import { spawn } from 'child_process';
import type {
  ResearchRequest,
  SynthesisResult,
  Source,
  ChunkData,
  ContentSection,
  Insight,
  ContentMeta
} from './config';
import { RealDataCollector } from './real-data-collector';
import { RealContentProcessor } from './real-content-processor';
import { VectorStore } from './vector-store';
import { ContentFormatter } from './formatter';

// Model constants
const MODEL_OPUS = 'claude-opus-4-1-20250805';
const MODEL_SONNET = 'claude-sonnet-4-20250514';

interface ClaudeResponse {
  completion?: string;
  summary?: string;
  key_stats?: Array<{ stat: string; source: string }>;
  themes?: any;
  report?: string;
  html?: string;
  [key: string]: any;
}

/**
 * Opus 4.1 Research Pipeline
 * Uses Claude's most powerful model for deep research and synthesis
 */
export class OpusPipeline {
  private collector: RealDataCollector;
  private processor: RealContentProcessor;
  private vectorStore: VectorStore;
  private formatter: ContentFormatter;
  private currentModel: string = MODEL_OPUS;

  constructor() {
    this.collector = new RealDataCollector();
    this.processor = new RealContentProcessor();
    this.vectorStore = new VectorStore();
    this.formatter = new ContentFormatter();

    // Set model from environment if available
    if (process.env.ANTHROPIC_MODEL) {
      this.currentModel = process.env.ANTHROPIC_MODEL;
    }
  }

  /**
   * Run Claude CLI with automatic fallback
   */
  private async runClaude(prompt: string, useJson: boolean = true): Promise<ClaudeResponse> {
    return new Promise((resolve, reject) => {
      const args = ['--model', this.currentModel, '--print'];
      if (useJson) {
        args.push('--output-format', 'json');
      }
      args.push(prompt);

      console.log(`🤖 Calling Claude ${this.currentModel.includes('opus') ? 'Opus 4.1' : 'Sonnet'}...`);

      const claude = spawn('claude', args);
      let stdout = '';
      let stderr = '';

      claude.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      claude.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      claude.on('error', (error) => {
        console.error('Claude CLI error:', error);
        // Try fallback to Sonnet
        if (this.currentModel === MODEL_OPUS) {
          console.log('⚠️ Falling back to Sonnet...');
          this.currentModel = MODEL_SONNET;
          this.runClaude(prompt, useJson).then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });

      claude.on('close', (code) => {
        if (code !== 0) {
          console.error(`Claude process exited with code ${code}`);
          console.error('stderr:', stderr);
          // Try fallback
          if (this.currentModel === MODEL_OPUS) {
            console.log('⚠️ Falling back to Sonnet...');
            this.currentModel = MODEL_SONNET;
            this.runClaude(prompt, useJson).then(resolve).catch(reject);
          } else {
            reject(new Error(`Claude failed: ${stderr}`));
          }
        } else {
          try {
            if (useJson) {
              const wrapper = JSON.parse(stdout);
              const text = typeof (wrapper as any)?.result === 'string' ? String((wrapper as any).result) : stdout;
              // Try to parse a JSON object from the text (handles ```json fences)
              const fence = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/```\s*([\s\S]*?)\s*```/);
              const candidate = fence ? fence[1] : text;
              try {
                const parsed = JSON.parse(String(candidate).trim());
                resolve(parsed as ClaudeResponse);
              } catch {
                resolve({ completion: text } as ClaudeResponse);
              }
            } else {
              resolve({ completion: stdout } as ClaudeResponse);
            }
          } catch (e) {
            // If parsing fails, return as plain text
            resolve({ completion: stdout } as ClaudeResponse);
          }
        }
      });
    });
  }

  /**
   * Main research pipeline
   */
  async research(request: ResearchRequest): Promise<SynthesisResult> {
    console.log('\n🚀 Opus 4.1 Research Pipeline Starting');
    console.log(`📋 Topic: ${request.keyword}`);
    console.log(`🎯 Model: ${this.currentModel}\n`);

    // Phase 1: Data Collection
    console.log('📚 Phase 1: Multi-Source Data Collection');
    const sources = await this.collectData(request);
    console.log(`✅ Collected ${sources.length} sources\n`);

    // Phase 2: Process & Embed
    console.log('🧠 Phase 2: Content Processing');
    const chunks = await this.processContent(sources);
    console.log(`✅ Created ${chunks.length} chunks\n`);

    // Phase 3: Store
    console.log('💾 Phase 3: Vector Storage');
    await this.vectorStore.addDocuments(chunks);
    console.log(`✅ Stored in vector DB\n`);

    // Phase 4: Summarize Each Source (Opus)
    console.log('📝 Phase 4: Per-Source Summarization (Opus 4.1)');
    const summaries = await this.summarizeSources(sources);
    console.log(`✅ Generated ${summaries.size} summaries\n`);

    // Phase 5: Retrieve & Synthesize Themes (Opus)
    console.log('🔍 Phase 5: Thematic Synthesis (Opus 4.1)');
    const themes = await this.synthesizeThemes(request, chunks, summaries);
    console.log(`✅ Extracted themes and insights\n`);

    // Phase 6: Generate Narrative (Opus)
    console.log('📖 Phase 6: Narrative Report (Opus 4.1)');
    const narrative = await this.generateNarrative(themes, summaries);
    console.log(`✅ Created narrative report\n`);

    // Phase 7: Quality Control (Opus)
    console.log('✅ Phase 7: Quality Control Pass (Opus 4.1)');
    const qcReport = await this.qualityControl(narrative);
    console.log(`✅ QC complete\n`);

    // Phase 8: Format
    console.log('🎨 Phase 8: HTML Formatting');
    const formatted = await this.formatReport(qcReport);
    console.log(`✅ Formatted output\n`);

    return formatted;
  }

  /**
   * Phase 1: Collect data from multiple sources
   */
  private async collectData(request: ResearchRequest): Promise<Source[]> {
    const sources: Source[] = [];

    // Generate search variations
    const queries = [
      request.keyword,
      `${request.keyword} statistics 2025`,
      `${request.keyword} implementation costs`,
      `${request.keyword} ROI metrics`
    ];

    for (const query of queries) {
      const [web, reddit] = await Promise.all([
        this.collector.searchWeb(query, {
          limit: Math.ceil((request.maxSources || 10) / queries.length),
          freshness: 'month'
        }),
        request.includeReddit !== false
          ? this.collector.searchReddit(query, { limit: 2 })
          : Promise.resolve([])
      ]);
      sources.push(...web, ...reddit);
    }

    // Scrape content
    await Promise.all(
      sources
        .filter(s => s.url && !s.metadata?.content)
        .map(async (source) => {
          try {
            source.metadata = {
              ...source.metadata,
              content: await this.collector.scrapeUrl(source.url)
            };
          } catch (e) {
            console.warn(`Failed to scrape ${source.url}`);
          }
        })
    );

    return sources.filter(s => s.metadata?.content);
  }

  /**
   * Phase 2: Process content into chunks with embeddings
   */
  private async processContent(sources: Source[]): Promise<ChunkData[]> {
    const allChunks: ChunkData[] = [];

    for (const source of sources) {
      const content = source.metadata?.content || '';
      if (!content) continue;

      const chunks = await this.processor.chunkContent(content, source);
      const embedded = await this.processor.generateEmbeddings(chunks);
      allChunks.push(...embedded);
    }

    return allChunks;
  }

  /**
   * Phase 4: Summarize each source using Opus
   */
  private async summarizeSources(sources: Source[]): Promise<Map<string, any>> {
    const summaries = new Map<string, any>();

    for (const source of sources) {
      const content = source.metadata?.content;
      if (!content) continue;

      const prompt = `You are a research assistant. Summarize the following document focusing ONLY on:
- ROI, implementation costs
- Timelines for adoption
- Talent needs and salaries
- Compliance / regulatory costs
- Success and failure rates

Extract hard numbers and statistics when possible.
Output JSON:

{
  "summary": "...",
  "key_stats": [
    {"stat": "...", "source": "..."}
  ]
}

Content:
<<<
${content.substring(0, 10000)}
>>>`;

      try {
        const response = await this.runClaude(prompt, true);
        summaries.set(source.url || source.title, response);
      } catch (e) {
        console.error(`Failed to summarize ${source.url}:`, e);
      }
    }

    return summaries;
  }

  /**
   * Phase 5: Synthesize themes using Opus
   */
  private async synthesizeThemes(
    request: ResearchRequest,
    chunks: ChunkData[],
    summaries: Map<string, any>
  ): Promise<any> {
    // Get relevant chunks from vector store
    const relevantChunks = await this.vectorStore.search(request.keyword, 20);

    // Combine summaries and top chunks
    const synthesisInput = [
      ...Array.from(summaries.values()).map(s => s.summary || ''),
      ...relevantChunks.slice(0, 10).map(c => c.content.substring(0, 500))
    ].join('\n\n---\n\n');

    const prompt = `You are a synthesis engine. Organize these findings into themes:
- Costs (actual numbers, hidden costs, vendor claims vs reality)
- ROI Timelines (how long to positive ROI)
- Talent (costs, availability, skills needed)
- Compliance (regulatory costs, requirements)
- Success Patterns (what works)
- Failure Patterns (what doesn't work)
- Disagreements / Contradictions between sources

Rules:
- Group related points under themes
- Include specific statistics with citations
- Highlight where sources disagree
- Extract actionable insights
- Keep it structured and concise

Input:
<<<
${synthesisInput}
>>>

Output as structured JSON with themes, insights, and contradictions.`;

    const response = await this.runClaude(prompt, true);
    return response;
  }

  /**
   * Phase 6: Generate narrative report using Opus
   */
  private async generateNarrative(themes: any, summaries: Map<string, any>): Promise<string> {
    const stats = Array.from(summaries.values())
      .flatMap(s => s.key_stats || [])
      .slice(0, 20);

    const prompt = `You are a research analyst. Write a structured report with this outline:

# Executive Summary
- 3–5 bullets on overall findings
- Most important statistics
- Bottom-line conclusion

## Implementation Costs
- Vendor claims vs reality
- Hidden costs
- Total cost of ownership

## ROI Timelines
- Time to positive ROI
- Success rate statistics
- Factors affecting timeline

## Talent Requirements
- Roles needed
- Salary ranges
- Availability challenges

## Compliance & Risk
- Regulatory requirements
- Security considerations
- Common pitfalls

## Success Patterns
- What successful implementations do differently
- Key success factors
- Case examples

## Recommendations
- For enterprises considering AI
- For those already implementing
- Risk mitigation strategies

Requirements:
- Professional, data-driven tone
- Use inline citations [Source: name]
- Short, scannable paragraphs
- Include specific numbers and percentages
- Do not invent statistics
- Be honest about contradictions in data

Key Statistics Found:
${JSON.stringify(stats, null, 2)}

Themes Synthesis:
${JSON.stringify(themes, null, 2)}`;

    const response = await this.runClaude(prompt, false);
    return response.completion || response.report || '';
  }

  /**
   * Phase 7: Quality control using Opus
   */
  private async qualityControl(report: string): Promise<string> {
    const prompt = `You are an editor. Review this report for:

1. Unsupported claims – flag any statistics without sources
2. Clarity and conciseness – improve where needed
3. Consistency in statistics – ensure numbers align
4. Narrative flow – smooth transitions
5. Actionability – ensure recommendations are practical

Make improvements directly. Mark any concerns with ⚠️.

Draft:
<<<
${report}
>>>

Output the improved report.`;

    const response = await this.runClaude(prompt, false);
    return response.completion || report;
  }

  /**
   * Phase 8: Format to HTML
   */
  private async formatReport(report: string): Promise<SynthesisResult> {
    const prompt = `Convert this report into a polished HTML article:

Requirements:
- Use semantic HTML tags (h1, h2, h3, p, ul, li, blockquote)
- Include a Table of Contents with links
- Style key statistics as callout boxes
- Highlight important numbers with <strong> tags
- Add a "References" section with sources
- Make it scannable with good visual hierarchy

Report:
<<<
${report}
>>>

Output clean HTML only.`;

    const response = await this.runClaude(prompt, false);
    const html = response.completion || response.html || '';

    // Parse into synthesis result
    return this.parseToSynthesisResult(report, html);
  }

  /**
   * Parse report into SynthesisResult format
   */
  private parseToSynthesisResult(report: string, html: string): SynthesisResult {
    // Extract sections from report
    const sections: ContentSection[] = [];
    const sectionMatches = report.match(/##\s+([^\n]+)\n([\s\S]*?)(?=##|\z)/g) || [];

    sectionMatches.forEach((match) => {
      const [, heading, content] = match.match(/##\s+([^\n]+)\n([\s\S]*)/) || [];
      if (heading && content) {
        sections.push({
          heading: heading.trim(),
          level: 2,
          content: content.trim()
        });
      }
    });

    // Extract insights from report
    const insights: Insight[] = [];
    const statMatches = report.match(/(\d+(?:\.\d+)?%)[^.]*(?:success|fail|cost|ROI|implement)/gi) || [];

    statMatches.slice(0, 6).forEach((match) => {
      const [stat] = match.match(/\d+(?:\.\d+)?%/) || [];
      insights.push({
        type: match.toLowerCase().includes('fail') ? 'risk' : 'opportunity',
        title: stat,
        description: match,
        supporting: []
      });
    });

    // Generate meta
    const meta: ContentMeta = {
      title: 'AI Implementation Research Report',
      description: 'Data-driven analysis based on multiple sources',
      keywords: ['AI', 'ROI', 'implementation', 'costs', 'enterprise'],
      audience: 'executive',
      readingTime: Math.ceil(report.split(' ').length / 250),
      publishDate: new Date().toISOString(),
      sources: []
    };

    return {
      meta,
      summary: 'Executive summary from Opus 4.1 analysis',
      sections,
      citations: [],
      insights
    };
  }
}
