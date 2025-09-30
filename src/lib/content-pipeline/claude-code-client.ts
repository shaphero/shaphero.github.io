import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Claude Code CLI Client
 * Uses the local Claude Code installation as AI backend
 * Works with your existing Max Pro subscription - no API keys needed!
 */
export class ClaudeCodeClient {
  private maxRetries: number = 2;
  private timeout: number = 300000; // 300 seconds to support longer generations
  private lastCallTime: number = 0;
  private minCallInterval: number = 1000; // 1 second between calls

  /**
   * Call Claude Code CLI and return the response
   * Always uses stdin to avoid command-line argument length limits
   */
  async query(prompt: string, options: {
    useJson?: boolean;
    model?: string;
  } = {}): Promise<any> {
    // Rate limiting
    await this.rateLimitDelay();

    const { useJson = true, model } = options;
    const args: string[] = [];
    if (model) {
      args.push('--model', model);
    }
    args.push('--print');
    if (useJson) {
      args.push('--output-format', 'json');
    }

    try {
      console.log('🤖 Calling Claude Code...');

      // Always pipe prompt through stdin to avoid arg length limits
      const stdout = await this.runClaude(args, '', prompt);

      // Parse response with improved error handling
      return this.parseResponse(stdout, useJson);

    } catch (error: any) {
      console.error('Claude Code error:', error);

      // Handle timeout
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Claude Code request timed out');
      }

      // Handle command not found
      if (error.code === 'ENOENT' || error.message.includes('command not found')) {
        throw new Error('Claude Code CLI not found. Please ensure Claude Code is installed and available in PATH');
      }

      throw error;
    }
  }

  /**
   * Call Claude with input piped from text (prepended to prompt via stdin)
   */
  async queryWithInput(text: string, prompt: string, options: { useJson?: boolean; model?: string } = {}): Promise<any> {
    // Rate limiting
    await this.rateLimitDelay();

    const { useJson = true, model } = options;
    const args: string[] = [];
    if (model) args.push('--model', model);
    args.push('--print');
    if (useJson) args.push('--output-format', 'json');

    try {
      // Combine text and prompt via stdin
      const combined = `${text}\n\n---\n\n${prompt}`;
      const stdout = await this.runClaude(args, '', combined);
      return this.parseResponse(stdout, useJson);
    } catch (error) {
      console.error('Claude Code error:', error);
      throw error;
    }
  }

  /**
   * Stream process multiple items through Claude
   */
  async batchProcess<T>(
    items: T[],
    promptTemplate: (item: T) => string,
    options: { parallel?: boolean; useJson?: boolean } = {}
  ): Promise<any[]> {
    const { parallel = false, useJson = true } = options;
    const results: any[] = [];

    if (parallel) {
      // Process in parallel with semaphore to limit concurrency
      const concurrency = 3;
      const chunks: T[][] = [];
      for (let i = 0; i < items.length; i += concurrency) {
        chunks.push(items.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        const promises = chunk.map(item =>
          this.query(promptTemplate(item), { useJson })
        );
        const chunkResults = await Promise.all(promises);
        results.push(...chunkResults);
      }
      return results;
    } else {
      // Process sequentially (rate limiting handled in query())
      for (const item of items) {
        const prompt = promptTemplate(item);
        const result = await this.query(prompt, { useJson });
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Rate limiting delay
   */
  private async rateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < this.minCallInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minCallInterval - timeSinceLastCall));
    }
    this.lastCallTime = Date.now();
  }

  /**
   * Parse Claude response with improved error handling
   */
  private parseResponse(stdout: string, useJson: boolean): any {
    if (!stdout || stdout.trim().length === 0) {
      throw new Error('Claude returned empty response');
    }

    if (useJson) {
      // Try parsing as wrapper first
      try {
        const wrapper = JSON.parse(stdout);
        if (wrapper && typeof wrapper.result === 'string') {
          // Extract JSON from result string
          const extracted = this.extractJsonFromText(wrapper.result);
          if (extracted != null) return extracted;
          // If extraction fails, return the string itself
          return wrapper.result;
        }
        // Direct JSON object
        return wrapper;
      } catch (e) {
        // Not valid JSON wrapper, try extracting from raw text
        const extracted = this.extractJsonFromText(stdout);
        if (extracted != null) return extracted;

        console.warn('Failed to parse JSON response, returning raw text');
        return { response: stdout };
      }
    }

    // Non-JSON mode
    try {
      const wrapper = JSON.parse(stdout);
      if (wrapper && typeof wrapper.result === 'string') {
        return wrapper.result.trim();
      }
    } catch {
      // Not a JSON wrapper, return raw
    }
    return stdout.trim();
  }

  /**
   * Low-level runner for Claude CLI with stdin piping.
   * Always uses stdin to avoid command-line argument length limits.
   */
  private runClaude(args: string[], _unused: string, input: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // No prompt in args - everything goes through stdin
      const child = spawn('claude', args, {
        env: {
          ...process.env,
          CLAUDE_MAX_TOKENS: '4000'
        }
      });

      let stdout = '';
      let stderr = '';
      let finished = false;
      const timer = setTimeout(() => {
        if (!finished) {
          console.warn('Claude Code timeout - killing process');
          child.kill('SIGKILL');
        }
      }, this.timeout);

      child.stdout.on('data', d => (stdout += d.toString()));
      child.stderr.on('data', d => (stderr += d.toString()));
      child.on('error', err => {
        clearTimeout(timer);
        finished = true;
        reject(err);
      });
      child.on('close', code => {
        clearTimeout(timer);
        finished = true;
        if (code === 0) return resolve(stdout);
        const errorMsg = stderr || `Claude exited with code ${code}`;
        reject(new Error(errorMsg));
      });

      // Write entire input to stdin
      if (input) {
        child.stdin.write(input, 'utf-8');
      }
      child.stdin.end();
    });
  }

  /**
   * Extract JSON payload from a Claude result string, handling ```json code fences.
   * Tries multiple strategies to find valid JSON.
   */
  private extractJsonFromText(text: string): any | null {
    if (!text) return null;

    const trimmed = text.trim();

    // Strategy 1: Look for ```json fence
    const jsonFence = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonFence) {
      try {
        return JSON.parse(jsonFence[1].trim());
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 2: Look for any ``` fence
    const anyFence = trimmed.match(/```\s*([\s\S]*?)\s*```/);
    if (anyFence) {
      try {
        return JSON.parse(anyFence[1].trim());
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 3: Try parsing the whole text
    try {
      return JSON.parse(trimmed);
    } catch {
      // Continue to next strategy
    }

    // Strategy 4: Look for JSON object/array boundaries
    const jsonObjectMatch = trimmed.match(/(\{[\s\S]*\})/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[1]);
      } catch {
        // Continue to next strategy
      }
    }

    const jsonArrayMatch = trimmed.match(/(\[[\s\S]*\])/);
    if (jsonArrayMatch) {
      try {
        return JSON.parse(jsonArrayMatch[1]);
      } catch {
        // All strategies failed
      }
    }

    return null;
  }

  /**
   * Check if Claude Code CLI is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('claude --version');
      console.log('✅ Claude Code CLI available:', stdout.trim());
      return true;
    } catch (error) {
      console.error('❌ Claude Code CLI not found');
      return false;
    }
  }
}

/**
 * Singleton instance for easy access
 */
export const claudeCode = new ClaudeCodeClient();
