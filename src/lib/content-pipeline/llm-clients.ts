import { spawn } from 'child_process';

export interface LLMReviewRequest {
  claim: string;
  evidence: string;
  context?: string;
}

export interface LLMReviewResult {
  status: 'supported' | 'flagged' | 'unclear';
  explanation: string;
}

export interface LLMReviewer {
  name: 'claude' | 'openai';
  review(request: LLMReviewRequest): Promise<LLMReviewResult | null>;
}

export class ClaudeCliReviewer implements LLMReviewer {
  name: 'claude' = 'claude';
  private model: string;

  constructor(model: string = process.env.ANTHROPIC_MODEL || 'claude-opus-4-1-20250805') {
    this.model = model;
  }

  async review(request: LLMReviewRequest): Promise<LLMReviewResult | null> {
    const prompt = this.buildPrompt(request);
    try {
      const response = await this.runClaude(prompt);
      if (response) {
        return this.parseResponse(response);
      }
      return null;
    } catch (error) {
      console.warn('[ClaudeCliReviewer] Unable to run Claude CLI:', error);
      return null;
    }
  }

  private buildPrompt({ claim, evidence, context }: LLMReviewRequest): string {
    return `You are acting as a fact-checker. Reply ONLY with JSON {"status":"supported|flagged|unclear","explanation":"..."}.

Claim: ${claim}
Evidence Snippet (primary): ${evidence}
Additional Context (use only if needed): ${context || 'None'}

Rules:
1. supported → evidence explicitly confirms the entire claim, including every number, unit, timeframe, and qualifier.
2. flagged → evidence contradicts the claim OR omits a required unit/timeframe/source OR references a different value.
3. unclear → evidence is unrelated, ambiguous, or incomplete; do not infer beyond text.
4. NEVER invent facts. Explanation ≤140 chars referencing exact wording or missing detail.
Return JSON only.`;
  }

  private async runClaude(prompt: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const args = ['--model', this.model, '--print', '--output-format', 'json', prompt.trim()];
      const child = spawn('claude', args);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', data => {
        stdout += data.toString();
      });

      child.stderr.on('data', data => {
        stderr += data.toString();
      });

      child.on('error', err => {
        reject(err);
      });

      child.on('close', code => {
        if (code === 0) {
          try {
            const wrapper = JSON.parse(stdout);
            const text = typeof (wrapper as any)?.result === 'string' ? String((wrapper as any).result).trim() : stdout.trim();
            resolve(text);
          } catch {
            resolve(stdout.trim());
          }
        } else {
          reject(new Error(stderr || `Claude CLI exited with code ${code}`));
        }
      });
    });
  }

  private parseResponse(raw: string): LLMReviewResult | null {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.status === 'string' && typeof parsed.explanation === 'string') {
        if (['supported', 'flagged', 'unclear'].includes(parsed.status)) {
          return { status: parsed.status, explanation: parsed.explanation } as LLMReviewResult;
        }
      }
    } catch (error) {
      console.warn('[ClaudeCliReviewer] Failed to parse JSON response:', error);
    }
    return null;
  }
}

export class OpenAIReviewer implements LLMReviewer {
  name: 'openai' = 'openai';
  private apiKey: string;
  private model: string;

  constructor(model: string = process.env.OPENAI_VALIDATOR_MODEL || 'gpt-4o-mini') {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = model;
  }

  async review(request: LLMReviewRequest): Promise<LLMReviewResult | null> {
    if (!this.apiKey) {
      console.warn('[OpenAIReviewer] OPENAI_API_KEY missing. Skipping.');
      return null;
    }

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a rigorous fact-checking assistant. Reply ONLY with JSON: {"status": "supported|flagged|unclear", "explanation": "..."}.'
        },
        {
          role: 'user',
          content: this.buildPrompt(request)
        }
      ],
      temperature: 0
    };

    try {
      // Add AbortController for 25 second timeout (recommended by OpenAI community)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (typeof raw === 'string') {
          return this.parseResponse(raw);
        }
        return null;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.warn('[OpenAIReviewer] API call failed:', error);
      return null;
    }
  }

  private buildPrompt({ claim, evidence, context }: LLMReviewRequest): string {
    return `You are validating a claim against evidence. Output JSON ONLY {"status":"supported|flagged|unclear","explanation":"..."}.

Claim: ${claim}
Evidence Snippet (primary): ${evidence}
Additional Context (use only if needed): ${context || 'None'}

Rules (strict):
- supported → snippet explicitly confirms the entire claim (numbers, units, timeframe, qualifiers).
- flagged → snippet contradicts or lacks any required unit/timeframe/source.
- unclear → snippet is unrelated/ambiguous; do not guess.
- Explanation ≤140 chars; cite specific wording or missing detail.
- NEVER fabricate evidence or assume.
Return JSON ONLY.`;
  }

  private parseResponse(raw: string): LLMReviewResult | null {
    try {
      const parsed = JSON.parse(raw.trim());
      if (parsed && typeof parsed.status === 'string' && typeof parsed.explanation === 'string') {
        if (['supported', 'flagged', 'unclear'].includes(parsed.status)) {
          return { status: parsed.status, explanation: parsed.explanation } as LLMReviewResult;
        }
      }
    } catch (error) {
      console.warn('[OpenAIReviewer] Failed to parse JSON response:', error, raw);
    }
    return null;
  }
}
