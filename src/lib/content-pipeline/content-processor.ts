import type { ChunkData, Source } from './config';

export class ContentProcessor {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  async chunkContent(content: string, source: Source): Promise<ChunkData[]> {
    if (!content || content.length === 0) {
      return [];
    }

    const chunks: ChunkData[] = [];
    const sentences = this.splitIntoSentences(content);
    let currentChunk = '';
    let currentTokens = 0;
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);

      if (currentTokens + sentenceTokens > this.chunkSize && currentChunk) {
        // Save current chunk
        chunks.push({
          id: `${source.url || 'unknown'}_chunk_${chunkIndex}`,
          content: currentChunk.trim(),
          source,
          metadata: {
            position: chunkIndex,
            totalChunks: -1, // Will update after
            tokens: currentTokens
          }
        });

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, this.chunkOverlap);
        currentChunk = overlapText + ' ' + sentence;
        currentTokens = this.estimateTokens(currentChunk);
        chunkIndex++;
      } else {
        currentChunk += ' ' + sentence;
        currentTokens += sentenceTokens;
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
          tokens: currentTokens
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
    // In production, would call OpenAI embeddings API
    // For now, generate mock embeddings

    return chunks.map(chunk => ({
      ...chunk,
      embedding: this.mockEmbedding(chunk.content)
    }));
  }

  private splitIntoSentences(text: string): string[] {
    // Basic sentence splitting
    // In production, use a proper NLP library
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.map(s => s.trim());
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~0.75 tokens per character
    return Math.ceil(text.length * 0.75);
  }

  private getOverlapText(text: string, overlapTokens: number): string {
    // Get last N tokens worth of text for overlap
    const chars = Math.floor(overlapTokens / 0.75);
    const words = text.split(' ');
    let overlapText = '';
    let currentChars = 0;

    for (let i = words.length - 1; i >= 0; i--) {
      if (currentChars + words[i].length > chars) break;
      overlapText = words[i] + ' ' + overlapText;
      currentChars += words[i].length + 1;
    }

    return overlapText.trim();
  }

  private mockEmbedding(text: string): number[] {
    // Generate deterministic mock embedding based on text
    const embedding: number[] = [];
    const dimensions = 1536; // OpenAI embedding size

    for (let i = 0; i < dimensions; i++) {
      // Create pseudo-random values based on text content
      const charSum = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const value = Math.sin(charSum * (i + 1)) * Math.cos(text.length * (i + 1));
      embedding.push(value);
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  async extractKeyPhrases(text: string): Promise<string[]> {
    // Simple keyword extraction
    // In production, use NLP library or API

    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are',
      'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why',
      'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'just', 'but', 'in', 'out', 'up', 'down'
    ]);

    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Count frequencies
    const frequencies = new Map<string, number>();
    words.forEach(word => {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    });

    // Get top keywords
    return Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  async cleanText(text: string): Promise<string> {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII
      .trim();
  }
}