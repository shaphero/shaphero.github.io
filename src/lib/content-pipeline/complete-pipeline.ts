import type {
  ResearchRequest,
  SynthesisResult,
  Source,
  ChunkData
} from './config';
import { RealDataCollector } from './real-data-collector';
import { RealContentProcessor } from './real-content-processor';
import { ClaudeCodeSynthesizer } from './claude-code-synthesizer';
import { VectorStore } from './vector-store';
import { ContentFormatter } from './formatter';
import { claudeCode } from './claude-code-client';

interface PipelineProgress {
  phase: string;
  step: string;
  progress: number; // 0-100
  details?: any;
}

type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * Complete Research Pipeline with Claude Code Integration
 *
 * This is the FULL WORKING pipeline that:
 * 1. Collects real data from DataForSEO, Reddit, and web scraping
 * 2. Processes content with OpenAI embeddings
 * 3. Uses Claude Code CLI for synthesis (your Max Pro subscription)
 * 4. Generates professional research reports
 */
export class CompletePipeline {
  private collector: RealDataCollector;
  private processor: RealContentProcessor;
  private synthesizer: ClaudeCodeSynthesizer;
  private vectorStore: VectorStore;
  private formatter: ContentFormatter;
  private progressCallback?: ProgressCallback;

  constructor(options: { onProgress?: ProgressCallback } = {}) {
    this.collector = new RealDataCollector();
    this.processor = new RealContentProcessor();
    this.synthesizer = new ClaudeCodeSynthesizer();
    this.vectorStore = new VectorStore();
    this.formatter = new ContentFormatter();
    this.progressCallback = options.onProgress;
  }

  private reportProgress(phase: string, step: string, progress: number, details?: any): void {
    if (this.progressCallback) {
      this.progressCallback({ phase, step, progress, details });
    }
  }

  /**
   * Main research pipeline with progress tracking
   */
  async research(request: ResearchRequest): Promise<SynthesisResult> {
    console.log(`
╔════════════════════════════════════════════╗
║     COMPLETE RESEARCH PIPELINE ACTIVE      ║
╚════════════════════════════════════════════╝
`);

    this.reportProgress('initialization', 'starting', 0);

    // Check Claude Code availability
    const claudeAvailable = await claudeCode.checkAvailability();
    if (!claudeAvailable) {
      console.warn('⚠️ Claude Code CLI not found - will use fallback synthesis');
    }

    console.log(`📋 Research Topic: ${request.keyword}`);
    console.log(`🎯 Target Audience: ${request.audience || 'general'}`);
    console.log(`📊 Depth Level: ${request.depth || 'standard'}\n`);

    this.reportProgress('initialization', 'complete', 5);

    // ============================================================
    // PHASE 1: DATA COLLECTION
    // ============================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 PHASE 1: MULTI-SOURCE DATA COLLECTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.reportProgress('collection', 'searching', 10);
    const sources = await this.collectData(request);
    console.log(`✅ Collected ${sources.length} sources`);
    console.log(`   - Web results: ${sources.filter(s => s.type === 'article').length}`);
    console.log(`   - Reddit posts: ${sources.filter(s => s.type === 'reddit').length}`);
    console.log(`   - News articles: ${sources.filter(s => s.type === 'news').length}\n`);

    this.reportProgress('collection', 'complete', 25, { sourceCount: sources.length });

    // ============================================================
    // PHASE 2: CONTENT PROCESSING
    // ============================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧠 PHASE 2: CONTENT PROCESSING & EMBEDDINGS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.reportProgress('processing', 'chunking', 30);
    const chunks = await this.processContent(sources);
    console.log(`✅ Created ${chunks.length} semantic chunks`);

    const totalTokens = chunks.reduce((sum, c) => sum + (c.metadata?.tokens || 0), 0);
    console.log(`   - Total tokens: ${totalTokens.toLocaleString()}`);
    console.log(`   - Avg chunk size: ${Math.round(totalTokens / chunks.length)} tokens\n`);

    this.reportProgress('processing', 'complete', 45, { chunkCount: chunks.length, totalTokens });

    // ============================================================
    // PHASE 3: VECTOR STORAGE
    // ============================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 PHASE 3: VECTOR DATABASE STORAGE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.reportProgress('vectorization', 'storing', 50);
    await this.vectorStore.addDocuments(chunks);
    console.log(`✅ Stored ${chunks.length} chunks in vector database`);

    // Retrieve most relevant chunks
    this.reportProgress('vectorization', 'retrieving', 55);
    const relevantChunks = await this.vectorStore.search(request.keyword, process.env.FAST_PIPELINE === '1' ? 12 : 30);
    console.log(`✅ Retrieved ${relevantChunks.length} most relevant chunks\n`);

    this.reportProgress('vectorization', 'complete', 60, { relevantChunkCount: relevantChunks.length });

    // ============================================================
    // PHASE 4: CLAUDE CODE SYNTHESIS
    // ============================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 PHASE 4: CLAUDE CODE AI SYNTHESIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.reportProgress('synthesis', 'analyzing', 65);
    const synthesis = await this.synthesizer.synthesize(request, relevantChunks);
    console.log(`✅ Synthesis complete`);
    console.log(`   - Insights extracted: ${synthesis.insights.length}`);
    console.log(`   - Sections generated: ${synthesis.sections.length}`);
    console.log(`   - Citations: ${synthesis.citations.length}\n`);

    this.reportProgress('synthesis', 'complete', 85, {
      insightCount: synthesis.insights.length,
      sectionCount: synthesis.sections.length,
      citationCount: synthesis.citations.length
    });

    // ============================================================
    // PHASE 5: FORMATTING
    // ============================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 PHASE 5: OUTPUT FORMATTING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.reportProgress('formatting', 'formatting', 90);
    const formatted = await this.formatter.format(synthesis);
    this.reportProgress('formatting', 'refining', 95);
    const refined = await this.formatter.refine(formatted);
    console.log(`✅ Formatted and refined output\n`);

    this.reportProgress('formatting', 'complete', 100);

    console.log(`
╔════════════════════════════════════════════╗
║         PIPELINE COMPLETE SUCCESS!         ║
╚════════════════════════════════════════════╝
`);

    return refined;
  }

  /**
   * Data Collection Phase
   */
  private async collectData(request: ResearchRequest): Promise<Source[]> {
    const sources: Source[] = [];

    // Generate search queries based on depth
    let queries = this.generateSearchQueries(request);
    if (process.env.FAST_PIPELINE === '1') {
      queries = queries.slice(0, 4);
    }
    console.log(`   Searching with ${queries.length} query variations...`);

    // Parallel data collection from multiple sources
    const promises = queries.map(async (query) => {
      const [webResults, redditResults] = await Promise.all([
        // DataForSEO web search
        this.collector.searchWeb(query, {
          limit: Math.ceil((request.maxSources || 10) / queries.length),
          freshness: this.getFreshness(request.depth)
        }),
        // Reddit search
        request.includeReddit !== false
          ? this.collector.searchReddit(query, {
              limit: 2,
              sortBy: 'relevance'
            })
          : Promise.resolve([])
      ]);

      return [...webResults, ...redditResults];
    });

    const allResults = await Promise.all(promises);
    allResults.forEach(results => sources.push(...results));

    // Scrape full content from URLs
    console.log(`   Scraping content from ${sources.length} sources...`);
    const scrapingPromises = sources
      .filter(source => source.url && !source.metadata?.content)
      .map(async (source) => {
        try {
          const content = await this.collector.scrapeUrl(source.url);
          source.metadata = { ...source.metadata, content };
          console.log(`   ✓ Scraped: ${source.url.substring(0, 50)}...`);
        } catch (error) {
          console.warn(`   ✗ Failed: ${source.url.substring(0, 50)}...`);
        }
        return source;
      });

    await Promise.all(scrapingPromises);

    // Filter out sources without content
    return sources.filter(s => s.metadata?.content && s.metadata.content.length > 100);
  }

  /**
   * Content Processing Phase
   */
  private async processContent(sources: Source[]): Promise<ChunkData[]> {
    const allChunks: ChunkData[] = [];

    console.log(`   Processing ${sources.length} sources...`);

    for (const source of sources) {
      const content = source.metadata?.content || '';
      if (!content) continue;

      // Intelligent chunking with overlap
      const chunks = await this.processor.chunkContent(content, source);

      // Generate embeddings (OpenAI or fallback)
      const embeddedChunks = await this.processor.generateEmbeddings(chunks);
      allChunks.push(...embeddedChunks);

      console.log(`   ✓ Processed: ${source.title?.substring(0, 50) || source.url?.substring(0, 50)}...`);
    }

    return allChunks;
  }

  /**
   * Generate search query variations
   */
  private generateSearchQueries(request: ResearchRequest): string[] {
    const base = request.keyword;
    const queries = [base];

    // Add depth-based variations
    if (request.depth === 'standard' || request.depth === 'comprehensive') {
      queries.push(
        `${base} statistics 2025 data`,
        `${base} case study results`,
        `${base} implementation costs ROI`,
        `${base} best practices`
      );
    }

    if (request.depth === 'comprehensive') {
      queries.push(
        `${base} failure analysis why`,
        `${base} success patterns`,
        `${base} comparison benchmark`,
        `"${base}" research report`,
        `${base} trends 2025`
      );
    }

    // Audience-specific queries
    if (request.audience === 'executive') {
      queries.push(`${base} executive summary C-level`);
    } else if (request.audience === 'technical') {
      queries.push(`${base} technical implementation guide`);
    }

    return [...new Set(queries)]; // Remove duplicates
  }

  /**
   * Get freshness setting based on depth
   */
  private getFreshness(depth?: string): 'day' | 'week' | 'month' | 'year' {
    switch (depth) {
      case 'quick': return 'week';
      case 'standard': return 'month';
      case 'comprehensive': return 'year';
      default: return 'month';
    }
  }

  /**
   * Generate output in different formats
   */
  async generateAstroPage(synthesis: SynthesisResult): Promise<string> {
    return this.formatter.toAstroComponent(synthesis);
  }

  async generateMarkdown(synthesis: SynthesisResult): Promise<string> {
    return this.formatter.toMarkdown(synthesis);
  }

  async generateHTML(synthesis: SynthesisResult): Promise<string> {
    return this.formatter.toHTML(synthesis);
  }

  /**
   * Generate a quality score for the research
   */
  generateQualityScore(synthesis: SynthesisResult): {
    score: number;
    factors: Record<string, number>;
  } {
    const factors = {
      sources: Math.min(synthesis.meta.sources.length / 10, 1) * 100,
      insights: Math.min(synthesis.insights.length / 8, 1) * 100,
      sections: Math.min(synthesis.sections.length / 6, 1) * 100,
      citations: Math.min(synthesis.citations.length / 15, 1) * 100,
      contentLength: Math.min(
        synthesis.sections.reduce((sum, s) => sum + s.content.length, 0) / 5000,
        1
      ) * 100
    };

    const score = Object.values(factors).reduce((sum, val) => sum + val, 0) / 5;

    return { score: Math.round(score), factors };
  }
}
