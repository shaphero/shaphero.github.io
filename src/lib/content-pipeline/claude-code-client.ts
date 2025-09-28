import { exec } from 'child_process';
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

  /**
   * Call Claude Code CLI and return the response
   */
  async query(prompt: string, options: {
    useJson?: boolean;
    model?: string;
  } = {}): Promise<any> {
    const { useJson = true, model } = options;

    const escapedPrompt = this.escapeForShell(prompt);
    const args: string[] = [];

    if (model) {
      args.push(`--model ${model}`);
    }

    args.push('--print');

    if (useJson) {
      args.push('--output-format json');
    }

    const command = `claude ${args.join(' ')} ${escapedPrompt}`;

    try {
      console.log('🤖 Calling Claude Code...');

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: {
          ...process.env,
          // Set any Claude Code environment variables here
          CLAUDE_MAX_TOKENS: '4000',
        }
      });

      if (stderr && !stderr.includes('Warning')) {
        console.warn('Claude stderr:', stderr);
      }

      // Parse response
      if (useJson) {
        try {
          const wrapper = JSON.parse(stdout);
          const text = typeof (wrapper as any)?.result === 'string' ? String((wrapper as any).result) : stdout;
          const extracted = this.extractJsonFromText(text);
          if (extracted != null) return extracted;
          return { response: text };
        } catch (e) {
          console.error('Failed to parse JSON response wrapper:', e);
          const extracted = this.extractJsonFromText(stdout);
          return extracted != null ? extracted : { response: stdout };
        }
      }

      // Non-JSON mode: prefer wrapper.result if available
      try {
        const wrapper = JSON.parse(stdout);
        if (typeof (wrapper as any)?.result === 'string') {
          return (wrapper as any).result.trim();
        }
      } catch {}
      return stdout.trim();

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
   * Call Claude with input piped from text
   */
  async queryWithInput(text: string, prompt: string, useJson: boolean = true): Promise<any> {
    const escapedText = this.escapeForShell(text);
    const escapedPrompt = this.escapeForShell(prompt);

    const command = useJson
      ? `echo ${escapedText} | claude --print --output-format json ${escapedPrompt}`
      : `echo ${escapedText} | claude --print ${escapedPrompt}`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: 10 * 1024 * 1024
      });

      if (stderr && !stderr.includes('Warning')) {
        console.warn('Claude stderr:', stderr);
      }

      if (useJson) {
        try {
          const wrapper = JSON.parse(stdout);
          const text = typeof (wrapper as any)?.result === 'string' ? String((wrapper as any).result) : stdout;
          const extracted = this.extractJsonFromText(text);
          if (extracted != null) return extracted;
          return { response: text };
        } catch (e) {
          console.error('Failed to parse JSON response wrapper:', e);
          const extracted = this.extractJsonFromText(stdout);
          return extracted != null ? extracted : { response: stdout };
        }
      }
      // Non-JSON wrapper path
      try {
        const wrapper = JSON.parse(stdout);
        if (typeof (wrapper as any)?.result === 'string') {
          return (wrapper as any).result.trim();
        }
      } catch {}
      return stdout.trim();
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
      // Process in parallel (be careful with rate limits)
      const promises = items.map(item =>
        this.query(promptTemplate(item), { useJson })
      );
      return Promise.all(promises);
    } else {
      // Process sequentially
      for (const item of items) {
        const prompt = promptTemplate(item);
        const result = await this.query(prompt, { useJson });
        results.push(result);

        // Small delay to avoid overwhelming Claude
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return results;
    }
  }

  /**
   * Escape text for shell execution
   */
  private escapeForShell(text: string): string {
    // Replace single quotes with '\'' and wrap in single quotes
    return `'${text.replace(/'/g, "'\\''")}'`;
  }

  /**
   * Extract JSON payload from a Claude result string, handling ```json code fences.
   */
  private extractJsonFromText(text: string): any | null {
    if (!text) return null;
    // Prefer fenced code blocks declared as json
    const jsonFence = text.match(/```json\s*([\s\S]*?)\s*```/i);
    const anyFence = jsonFence || text.match(/```\s*([\s\S]*?)\s*```/);
    const candidate = anyFence ? anyFence[1] : text;
    try {
      return JSON.parse(candidate.trim());
    } catch {
      return null;
    }
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
