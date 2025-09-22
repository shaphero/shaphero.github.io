import type { ChunkData } from './config';

interface VectorStoreConfig {
  type: 'memory' | 'faiss' | 'lancedb';
  path?: string;
}

interface SearchOptions {
  embedding?: number[];
}

export class VectorStore {
  private documents: Map<string, ChunkData> = new Map();
  private config: VectorStoreConfig;

  constructor(config?: VectorStoreConfig) {
    this.config = config || { type: 'memory' };
  }

  async addDocuments(chunks: ChunkData[]): Promise<void> {
    // In production, would use actual vector database
    // For now, store in memory
    chunks.forEach(chunk => {
      const id = chunk.id || `${chunk.source.url || 'unknown'}-${this.documents.size}`;
      this.documents.set(id, { ...chunk, id });
    });
  }

  async search(query: string, k: number = 10, options: SearchOptions = {}): Promise<ChunkData[]> {
    const docs = Array.from(this.documents.values());
    if (docs.length === 0) {
      return [];
    }

    if (options.embedding && this.hasEmbeddings()) {
      return this.similaritySearch(options.embedding, k);
    }

    // Fallback to keyword matching
    const sanitizedQuery = query.trim().toLowerCase();
    if (!sanitizedQuery) {
      return [];
    }

    const queryWords = sanitizedQuery
      .split(/\s+/)
      .map(word => this.escapeRegex(word))
      .filter(Boolean);

    if (queryWords.length === 0) {
      return [];
    }

    const scored = docs.map(doc => {
      const content = doc.content.toLowerCase();
      const score = queryWords.reduce((sum, word) => {
        const regex = new RegExp(word, 'g');
        const occurrences = content.match(regex)?.length || 0;
        return sum + occurrences;
      }, 0);

      return { doc, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(item => item.doc);
  }

  async similaritySearch(embedding: number[], k: number = 10): Promise<ChunkData[]> {
    // Calculate cosine similarity with all documents
    const scored = Array.from(this.documents.values())
      .filter(doc => doc.embedding)
      .map(doc => ({
        doc,
        score: this.cosineSimilarity(embedding, doc.embedding!)
      }));

    // Return top k
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(item => item.doc);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }

  async getDocumentCount(): Promise<number> {
    return this.documents.size;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private hasEmbeddings(): boolean {
    for (const doc of this.documents.values()) {
      if (doc.embedding && doc.embedding.length > 0) {
        return true;
      }
    }
    return false;
  }
}
