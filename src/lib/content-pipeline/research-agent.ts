import type {
  ResearchRequest,
  SynthesisResult,
  Source,
  ChunkData,
  ContentSection,
  Insight,
  Citation
} from './config';
import { DataCollector } from './data-collector';
import { ContentProcessor } from './content-processor';
import { Synthesizer } from './synthesizer';
import { VectorStore } from './vector-store';
import { ContentFormatter } from './formatter';

export class ResearchAgent {
  private collector: DataCollector;
  private processor: ContentProcessor;
  private synthesizer: Synthesizer;
  private vectorStore: VectorStore;
  private formatter: ContentFormatter;

  constructor(config?: any) {
    this.collector = new DataCollector(config);
    this.processor = new ContentProcessor();
    this.synthesizer = new Synthesizer(config);
    this.vectorStore = new VectorStore(config?.vectorDb);
    this.formatter = new ContentFormatter();
  }

  async research(request: ResearchRequest): Promise<SynthesisResult> {
    console.log(`🔍 Starting research for: ${request.keyword}`);

    // Phase 1: Data Collection
    const sources = await this.collectData(request);

    // Phase 2: Process & Chunk
    const chunks = await this.processContent(sources);

    // Phase 3: Store in Vector DB
    await this.storeEmbeddings(chunks);

    // Phase 4: Synthesize
    const synthesis = await this.synthesizeContent(request, chunks);

    // Phase 5: Format
    const formatted = await this.formatContent(synthesis);

    return formatted;
  }

  private async collectData(request: ResearchRequest): Promise<Source[]> {
    const sources: Source[] = [];

    // Web search via DataForSEO
    const webResults = await this.collector.searchWeb(request.keyword, {
      limit: request.maxSources || 10,
      freshness: 'month'
    });
    sources.push(...webResults);

    // Reddit search
    if (request.includeReddit !== false) {
      const redditResults = await this.collector.searchReddit(request.keyword, {
        limit: 5,
        sortBy: 'relevance'
      });
      sources.push(...redditResults);
    }

    // News search
    if (request.includeNews) {
      const newsResults = await this.collector.searchNews(request.keyword, {
        limit: 5,
        freshness: 'week'
      });
      sources.push(...newsResults);
    }

    console.log(`✅ Collected ${sources.length} sources`);
    return sources;
  }

  private async processContent(sources: Source[]): Promise<ChunkData[]> {
    const allChunks: ChunkData[] = [];

    for (const source of sources) {
      // Scrape if URL
      if (source.url && !source.metadata?.content) {
        const content = await this.collector.scrapeUrl(source.url);
        source.metadata = { ...source.metadata, content };
      }

      // Chunk the content
      const chunks = await this.processor.chunkContent(
        source.metadata?.content || '',
        source
      );

      // Generate embeddings
      const embeddedChunks = await this.processor.generateEmbeddings(chunks);
      allChunks.push(...embeddedChunks);
    }

    console.log(`📦 Processed ${allChunks.length} chunks`);
    return allChunks;
  }

  private async storeEmbeddings(chunks: ChunkData[]): Promise<void> {
    await this.vectorStore.addDocuments(chunks);
    console.log(`💾 Stored ${chunks.length} chunks in vector DB`);
  }

  private async synthesizeContent(
    request: ResearchRequest,
    chunks: ChunkData[]
  ): Promise<SynthesisResult> {
    // Retrieve relevant chunks
    const relevantChunks = await this.vectorStore.search(request.keyword, 20);

    // Generate summaries
    const summaries = await this.synthesizer.summarizeChunks(relevantChunks);

    // Identify insights
    const insights = await this.synthesizer.extractInsights(relevantChunks);

    // Build narrative
    const narrative = await this.synthesizer.buildNarrative({
      request,
      summaries,
      insights,
      chunks: relevantChunks
    });

    return narrative;
  }

  private async formatContent(synthesis: SynthesisResult): Promise<SynthesisResult> {
    // Apply formatting rules
    const formatted = await this.formatter.format(synthesis);

    // Quality check
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
}