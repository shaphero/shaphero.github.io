import type { ChunkData, Source } from './config';

interface ProcessorOptions {
  embeddingBatchSize?: number;
  embeddingConcurrency?: number;
  embeddingMaxRetries?: number;
  retryBaseDelayMs?: number;
}

export class RealContentProcessor {
  private openaiApiKey: string;
  private chunkSize: number;
  private chunkOverlap: number;
  private embeddingBatchSize: number;
  private embeddingConcurrency: number;
  private embeddingMaxRetries: number;
  private retryBaseDelayMs: number;

  constructor(
    chunkSize: number = 1500,
    chunkOverlap: number = 200,
    options: ProcessorOptions = {}
  ) {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.embeddingBatchSize = options.embeddingBatchSize ?? 20;
    this.embeddingConcurrency = Math.max(1, options.embeddingConcurrency ?? 2);
    this.embeddingMaxRetries = Math.max(1, options.embeddingMaxRetries ?? 3);
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 1000;
  }

  async chunkContent(content: string, source: Source): Promise<ChunkData[]> {
    if (!content || content.trim().length === 0) {
      return [];
    }

    const chunks: ChunkData[] = [];

    // Split into paragraphs first, then combine into chunks
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

    let currentChunk = '';
    let currentTokens = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = this.estimateTokens(paragraph);

      if (currentTokens + paragraphTokens > this.chunkSize && currentChunk) {
        // Save current chunk
        chunks.push({
          id: `${source.url || 'unknown'}_chunk_${chunkIndex}`,
          content: currentChunk.trim(),
          source,
          metadata: {
            position: chunkIndex,
            totalChunks: -1,
            tokens: currentTokens,
            entities: this.extractNamedEntities(currentChunk),
            topics: this.extractTopics(currentChunk)
          }
        });

        // Start new chunk with overlap
        const overlapText = this.createOverlap(currentChunk);
        currentChunk = overlapText ? `${overlapText}\n\n${paragraph}` : paragraph;
        currentTokens = this.estimateTokens(currentChunk);
        chunkIndex++;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
        currentTokens = this.estimateTokens(currentChunk);
      }
    }

    // Save final chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `${source.url || 'unknown'}_chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        source,
        metadata: {
          position: chunkIndex,
          totalChunks: chunks.length + 1,
          tokens: currentTokens,
          entities: this.extractNamedEntities(currentChunk),
          topics: this.extractTopics(currentChunk)
        }
      });
    }

    // Update total chunks count
    chunks.forEach(chunk => {
      if (chunk.metadata) {
        chunk.metadata.totalChunks = chunks.length;
      }
    });

    return chunks;
  }

  async generateEmbeddings(chunks: ChunkData[]): Promise<ChunkData[]> {
    if (chunks.length === 0) {
      return [];
    }

    const nonEmptyChunks = chunks.filter(chunk => chunk.content.trim().length > 0);
    if (nonEmptyChunks.length === 0) {
      return chunks.map(chunk => ({ ...chunk, embedding: this.createMockEmbedding('') }));
    }

    if (!this.openaiApiKey) {
      console.warn('No OpenAI API key found, using mock embeddings');
      return this.generateMockEmbeddings(chunks);
    }

    try {
      const embeddings = await this.generateEmbeddingsForTexts(nonEmptyChunks.map(c => c.content));

      const embedded = new Map<string, number[]>();
      nonEmptyChunks.forEach((chunk, index) => {
        embedded.set(chunk.id, embeddings[index]);
      });

      return chunks.map(chunk => ({
        ...chunk,
        embedding: embedded.get(chunk.id) || this.createMockEmbedding(chunk.content)
      }));
    } catch (error) {
      console.error('OpenAI embeddings failed, using mock:', error);
      return this.generateMockEmbeddings(chunks);
    }
  }

  async generateQueryEmbedding(text: string): Promise<number[] | null> {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }

    if (!this.openaiApiKey) {
      return this.createMockEmbedding(trimmed);
    }

    try {
      const [embedding] = await this.generateEmbeddingsForTexts([trimmed]);
      return embedding;
    } catch (error) {
      console.error('Failed to generate query embedding, using mock:', error);
      return this.createMockEmbedding(trimmed);
    }
  }

  private async generateEmbeddingsForTexts(texts: string[]): Promise<number[][]> {
    if (!this.openaiApiKey) {
      return texts.map(text => this.createMockEmbedding(text));
    }

    const batches = [] as Array<{ index: number; texts: string[] }>;
    for (let i = 0; i < texts.length; i += this.embeddingBatchSize) {
      batches.push({ index: i, texts: texts.slice(i, i + this.embeddingBatchSize) });
    }

    const embeddings: number[][] = new Array(texts.length);
    const tasks = batches.map(batch => async () => {
      const batchEmbeddings = await this.fetchEmbeddingsBatchWithRetry(batch.texts);
      batchEmbeddings.forEach((embedding, offset) => {
        embeddings[batch.index + offset] = embedding;
      });
    });

    await this.runWithConcurrency(tasks, this.embeddingConcurrency);

    return embeddings;
  }

  private async getOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
    const url = 'https://api.openai.com/v1/embeddings';

    // Truncate texts that are too long (max ~8000 tokens)
    const maxChars = 30000; // Roughly 7500 tokens
    const truncatedTexts = texts.map(text =>
      text.length > maxChars ? text.substring(0, maxChars) : text
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small', // Cheaper and faster
        input: truncatedTexts,
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error: any = new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      error.status = response.status;
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
      if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
        error.retryAfterMs = retryAfterSeconds * 1000;
      }
      throw error;
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }

  private async fetchEmbeddingsBatchWithRetry(texts: string[]): Promise<number[][]> {
    for (let attempt = 0; attempt < this.embeddingMaxRetries; attempt++) {
      try {
        return await this.getOpenAIEmbeddings(texts);
      } catch (error: any) {
        const isLastAttempt = attempt === this.embeddingMaxRetries - 1;
        if (isLastAttempt) {
          throw error;
        }
        const delayMs = this.calculateRetryDelay(error, attempt);
        await this.delay(delayMs);
      }
    }
    return texts.map(text => this.createMockEmbedding(text));
  }

  private calculateRetryDelay(error: any, attempt: number): number {
    const retryAfterMs = typeof error?.retryAfterMs === 'number' ? error.retryAfterMs : null;
    if (retryAfterMs && retryAfterMs > 0) {
      return retryAfterMs;
    }
    const exponential = this.retryBaseDelayMs * Math.pow(2, attempt);
    const capped = Math.min(exponential, 30_000);
    const jitter = Math.random() * 250;
    return capped + jitter;
  }

  private async runWithConcurrency(tasks: Array<() => Promise<void>>, limit: number): Promise<void> {
    if (tasks.length === 0) {
      return;
    }

    const concurrency = Math.min(limit, tasks.length);
    let cursor = 0;
    const runners = Array.from({ length: concurrency }, async () => {
      while (cursor < tasks.length) {
        const taskIndex = cursor++;
        await tasks[taskIndex]();
      }
    });

    await Promise.all(runners);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMockEmbeddings(chunks: ChunkData[]): ChunkData[] {
    return chunks.map(chunk => ({
      ...chunk,
      embedding: this.createMockEmbedding(chunk.content)
    }));
  }

  private createMockEmbedding(text: string): number[] {
    // Create a deterministic embedding based on content
    const embedding: number[] = [];
    const dimensions = 1536;

    // Use content characteristics to generate embedding
    const hashCode = text.split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0);

    for (let i = 0; i < dimensions; i++) {
      const value = Math.sin(hashCode * (i + 1) * 0.01) *
                   Math.cos(text.length * (i + 1) * 0.001);
      embedding.push(value);
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0 || Number.isNaN(magnitude)) {
      return Array(dimensions).fill(0);
    }
    return embedding.map(val => val / magnitude);
  }

  private estimateTokens(text: string): number {
    if (!text) {
      return 0;
    }

    const words = text.trim().split(/\s+/).length;
    const chars = text.length;

    // Blend word and character based heuristics for better approximation
    const wordEstimate = words * 1.35;
    const charEstimate = chars / 4;

    return Math.max(1, Math.ceil((wordEstimate + charEstimate) / 2));
  }

  private createOverlap(text: string): string {
    // Take last N tokens worth of text for overlap
    const targetTokens = this.chunkOverlap;
    const words = text.split(/\s+/);

    if (words.length === 0 || targetTokens <= 0) {
      return '';
    }

    const overlapWords: string[] = [];
    let tokenCount = 0;

    for (let i = words.length - 1; i >= 0 && tokenCount < targetTokens; i--) {
      overlapWords.unshift(words[i]);
      tokenCount += 1.3;
    }

    return overlapWords.join(' ').trim();
  }

  private extractNamedEntities(text: string): string[] {
    const entityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    const entities = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = entityPattern.exec(text)) !== null) {
      const candidate = match[1].trim();
      if (candidate.length <= 2) continue;
      if (/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(candidate)) {
        continue;
      }
      entities.add(candidate);
      if (entities.size >= 8) break;
    }

    return Array.from(entities);
  }

  private extractTopics(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));

    const frequency = new Map<string, number>();
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word]) => word);
  }

  async extractKeyPhrases(text: string): Promise<string[]> {
    // Extract meaningful phrases using TF-IDF-like approach
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));

    // Count bigrams and trigrams
    const phrases = new Map<string, number>();

    for (let i = 0; i < words.length - 2; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;

      if (!this.isStopPhrase(bigram)) {
        phrases.set(bigram, (phrases.get(bigram) || 0) + 1);
      }
      if (!this.isStopPhrase(trigram)) {
        phrases.set(trigram, (phrases.get(trigram) || 0) + 1);
      }
    }

    // Add important single words
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      if (this.isImportantWord(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    // Combine and sort
    const allPhrases = [...phrases.entries(), ...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase]) => phrase);

    return allPhrases;
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are',
      'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she'
    ]);
    return stopWords.has(word);
  }

  private isStopPhrase(phrase: string): boolean {
    const stopStarts = ['the ', 'is ', 'was ', 'are ', 'were ', 'be ', 'been '];
    return stopStarts.some(start => phrase.startsWith(start));
  }

  private isImportantWord(word: string): boolean {
    const importantPatterns = [
      /^ai$/i,
      /^roi$/i,
      /cost/i,
      /implement/i,
      /success/i,
      /fail/i,
      /data/i,
      /model/i,
      /enterprise/i,
      /platform/i
    ];
    return importantPatterns.some(pattern => pattern.test(word));
  }
}
