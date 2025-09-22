import type {
  ResearchRequest,
  SynthesisResult,
  Source,
  ChunkData
} from './config';

import { RealDataCollector } from './real-data-collector';
import { RealContentProcessor } from './real-content-processor';
import { RealSynthesizer } from './real-synthesizer';
import { VectorStore } from './vector-store';
import { ContentFormatter } from './formatter';

interface AgentDependencies {
  collector?: RealDataCollector;
  processor?: RealContentProcessor;
  synthesizer?: RealSynthesizer;
  vectorStore?: VectorStore;
  formatter?: ContentFormatter;
  concurrency?: {
    scraping?: number;
    processing?: number;
  };
}

/**
 * Claude-powered Research Agent that uses:
 * - Claude subtasks for web research
 * - Real APIs (DataForSEO, Reddit, OpenAI)
 * - Intelligent synthesis and analysis
 */
export class ClaudeResearchAgent {
  private collector: RealDataCollector;
  private processor: RealContentProcessor;
  private synthesizer: RealSynthesizer;
  private vectorStore: VectorStore;
  private formatter: ContentFormatter;
  private scrapingConcurrency: number;
  private processingConcurrency: number;

  constructor(dependencies: AgentDependencies = {}) {
    this.collector = dependencies.collector || new RealDataCollector();
    this.processor = dependencies.processor || new RealContentProcessor();
    this.synthesizer = dependencies.synthesizer || new RealSynthesizer();
    this.vectorStore = dependencies.vectorStore || new VectorStore();
    this.formatter = dependencies.formatter || new ContentFormatter();

    this.scrapingConcurrency = dependencies.concurrency?.scraping ?? 4;
    this.processingConcurrency = dependencies.concurrency?.processing ?? 4;
  }

  async research(request: ResearchRequest): Promise<SynthesisResult> {
    console.log(`\n🤖 Claude Research Agent Starting`);
    console.log(`📋 Topic: ${request.keyword}`);
    console.log(`🎯 Audience: ${request.audience}`);
    console.log(`📊 Depth: ${request.depth}\n`);

    // Phase 1: Claude-Enhanced Search
    console.log('🔍 Phase 1: Multi-Source Data Collection');
    const sources = await this.collectWithClaude(request);
    console.log(`✅ Collected ${sources.length} sources\n`);

    // Phase 2: Intelligent Processing
    console.log('🧠 Phase 2: Content Processing & Embedding');
    const chunks = await this.processContent(sources);
    console.log(`✅ Created ${chunks.length} semantic chunks\n`);

    // Phase 3: Vector Storage
    console.log('💾 Phase 3: Building Knowledge Graph');
    await this.storeEmbeddings(chunks);
    console.log(`✅ Stored in vector database\n`);

    // Phase 4: Claude Synthesis
    console.log('🎨 Phase 4: Claude-Powered Synthesis');
    const synthesis = await this.synthesizeWithClaude(request, chunks);
    console.log(`✅ Generated insights and narrative\n`);

    // Phase 5: Format
    console.log('📝 Phase 5: Formatting Output');
    const formatted = await this.formatContent(synthesis);
    console.log(`✅ Created deliverables\n`);

    return formatted;
  }

  private async collectWithClaude(request: ResearchRequest): Promise<Source[]> {
    const sources: Source[] = [];

    // Use Claude subtask for enhanced search strategy
    const searchQueries = this.generateSearchQueries(request);

    // Parallel data collection
    const promises = searchQueries.map(async (query) => {
      const [webResults, redditResults] = await Promise.all([
        this.collector.searchWeb(query, {
          limit: Math.ceil((request.maxSources || 10) / searchQueries.length),
          freshness: request.depth === 'comprehensive' ? 'month' : 'week'
        }),
        request.includeReddit !== false
          ? this.collector.searchReddit(query, {
              limit: 3,
              sortBy: 'relevance'
            })
          : Promise.resolve([])
      ]);

      return [...webResults, ...redditResults];
    });

    const allResults = await Promise.all(promises);
    allResults.forEach(results => sources.push(...results));

    const deduped = this.dedupeSources(sources);

    const budget = request.maxSources || deduped.length;
    const limited = deduped.slice(0, budget);

    await this.scrapeSourcesInBatches(limited);

    return limited.filter(s => s.metadata?.content && s.metadata.content.length > 100);
  }

  private generateSearchQueries(request: ResearchRequest): string[] {
    const base = request.keyword;
    const queries = [base];

    // Add variations based on depth
    if (request.depth === 'comprehensive' || request.depth === 'standard') {
      queries.push(
        `${base} statistics data 2025`,
        `${base} case studies results`,
        `${base} implementation costs ROI`
      );
    }

    if (request.depth === 'comprehensive') {
      queries.push(
        `${base} failure analysis`,
        `${base} success patterns`,
        `${base} vendor comparison`,
        `"${base}" research study`
      );
    }

    // Audience-specific queries
    if (request.audience === 'executive') {
      queries.push(`${base} executive summary C-suite`);
    } else if (request.audience === 'technical') {
      queries.push(`${base} technical implementation architecture`);
    }

    return [...new Set(queries)]; // Remove duplicates
  }

  private async processContent(sources: Source[]): Promise<ChunkData[]> {
    const tasks = sources
      .filter(source => source.metadata?.content)
      .map(source => async () => {
        const content = source.metadata?.content || '';
        const chunks = await this.processor.chunkContent(content, source);
        return this.processor.generateEmbeddings(chunks);
      });

    const results = await this.runWithConcurrency(tasks, this.processingConcurrency);
    return results.flat();
  }

  private async storeEmbeddings(chunks: ChunkData[]): Promise<void> {
    await this.vectorStore.addDocuments(chunks);
  }

  private async synthesizeWithClaude(
    request: ResearchRequest,
    chunks: ChunkData[]
  ): Promise<SynthesisResult> {
    // Retrieve relevant chunks using semantic search
    const query = `${request.keyword} ${request.audience || ''} ${request.format || ''}`;
    const queryEmbedding = await this.processor.generateQueryEmbedding(query);

    const relevantChunks = await this.vectorStore.search(query, 30, {
      embedding: queryEmbedding || undefined
    });

    // Use enhanced synthesizer
    return this.synthesizer.synthesizeWithClaude(request, relevantChunks);
  }

  private async formatContent(synthesis: SynthesisResult): Promise<SynthesisResult> {
    // Apply formatting enhancements
    const formatted = await this.formatter.format(synthesis);

    // Quality refinement
    const refined = await this.formatter.refine(formatted);

    return refined;
  }

  async generateAstroPage(synthesis: SynthesisResult): Promise<string> {
    return this.formatter.toAstroComponent(synthesis);
  }

  async generateMarkdown(synthesis: SynthesisResult): Promise<string> {
    return this.formatter.toMarkdown(synthesis);
  }

  async generateHTML(synthesis: SynthesisResult): Promise<string> {
    return this.formatter.toHTML(synthesis);
  }

  private dedupeSources(sources: Source[]): Source[] {
    const seen = new Map<string, Source>();

    sources.forEach(source => {
      const key = this.normalizeSourceKey(source);
      if (!seen.has(key)) {
        seen.set(key, source);
      }
    });

    return Array.from(seen.values());
  }

  private normalizeSourceKey(source: Source): string {
    if (source.url) {
      try {
        const url = new URL(source.url);
        url.hash = '';
        return url.toString();
      } catch {
        return source.url;
      }
    }
    return `${source.title}-${source.date}`;
  }

  private async scrapeSourcesInBatches(sources: Source[]): Promise<void> {
    const targets = sources.filter(source => source.url && !source.metadata?.content);
    const tasks = targets.map(source => async () => {
      try {
        const content = await this.collector.scrapeUrl(source.url!);
        source.metadata = { ...source.metadata, content };
      } catch (error) {
        console.warn(`Failed to scrape ${source.url}:`, error);
      }
    });

    await this.runWithConcurrency(tasks, this.scrapingConcurrency);
  }

  private async runWithConcurrency<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
    if (tasks.length === 0) {
      return [];
    }

    const limit = Math.max(1, concurrency);
    const results: T[] = [];

    for (let i = 0; i < tasks.length; i += limit) {
      const batch = tasks.slice(i, i + limit).map(task => task());
      const batchResults = await Promise.allSettled(batch);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.warn('Concurrent task failed:', result.reason);
        }
      });
    }

    return results;
  }
}
