import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import { dirname, join } from 'path';
import { createInterface } from 'readline';
import type { ChunkData } from './config';

interface VectorStoreConfig {
  type: 'memory' | 'faiss' | 'lancedb';
  path?: string;
}

interface SearchOptions {
  embedding?: number[];
}

interface VectorBackend {
  addDocuments(chunks: ChunkData[]): Promise<void>;
  search(query: string, k: number, options: SearchOptions): Promise<ChunkData[]>;
  similaritySearch(embedding: number[], k: number): Promise<ChunkData[]>;
  clear(): Promise<void>;
  count(): Promise<number>;
  hasEmbeddings(): Promise<boolean>;
}

export class VectorStore {
  private backend: VectorBackend;
  private config: VectorStoreConfig;

  constructor(config?: VectorStoreConfig) {
    this.config = config || { type: 'memory' };
    if (this.config.type === 'memory') {
      this.backend = new MemoryVectorBackend();
    } else {
      const storagePath = this.config.path || join('.cache', 'vector-store', `${this.config.type}.jsonl`);
      this.backend = new DiskVectorBackend(storagePath, this.config.type);
    }
  }

  async addDocuments(chunks: ChunkData[]): Promise<void> {
    await this.backend.addDocuments(chunks);
  }

  async search(query: string, k: number = 10, options: SearchOptions = {}): Promise<ChunkData[]> {
    return this.backend.search(query, k, options);
  }

  async similaritySearch(embedding: number[], k: number = 10): Promise<ChunkData[]> {
    return this.backend.similaritySearch(embedding, k);
  }

  async clear(): Promise<void> {
    await this.backend.clear();
  }

  async getDocumentCount(): Promise<number> {
    return this.backend.count();
  }
}

class MemoryVectorBackend implements VectorBackend {
  private documents: Map<string, ChunkData> = new Map();

  async addDocuments(chunks: ChunkData[]): Promise<void> {
    chunks.forEach(chunk => {
      const id = chunk.id || `${chunk.source.url || 'unknown'}-${this.documents.size}`;
      this.documents.set(id, { ...chunk, id });
    });
  }

  async search(query: string, k: number, options: SearchOptions): Promise<ChunkData[]> {
    const docs = Array.from(this.documents.values());
    if (docs.length === 0) {
      return [];
    }

    if (options.embedding && await this.hasEmbeddings()) {
      return this.similaritySearch(options.embedding, k);
    }

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

  async similaritySearch(embedding: number[], k: number): Promise<ChunkData[]> {
    const scored = Array.from(this.documents.values())
      .filter(doc => doc.embedding)
      .map(doc => ({
        doc,
        score: this.cosineSimilarity(embedding, doc.embedding!)
      }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(item => item.doc);
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }

  async count(): Promise<number> {
    return this.documents.size;
  }

  async hasEmbeddings(): Promise<boolean> {
    for (const doc of this.documents.values()) {
      if (doc.embedding && doc.embedding.length > 0) {
        return true;
      }
    }
    return false;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
}

class DiskVectorBackend implements VectorBackend {
  private filePath: string;
  private embeddingPresent: boolean = false;
  private backendLabel: 'faiss' | 'lancedb';

  constructor(path: string, label: 'faiss' | 'lancedb') {
    this.filePath = path;
    this.backendLabel = label;
  }

  async addDocuments(chunks: ChunkData[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    await fs.mkdir(dirname(this.filePath), { recursive: true });
    const lines = chunks.map(chunk => {
      if (chunk.embedding && chunk.embedding.length > 0) {
        this.embeddingPresent = true;
      }
      return JSON.stringify(chunk);
    });
    await fs.appendFile(this.filePath, lines.join('\n') + '\n');
  }

  async search(query: string, k: number, options: SearchOptions): Promise<ChunkData[]> {
    if (options.embedding && await this.hasEmbeddings()) {
      return this.similaritySearch(options.embedding, k);
    }

    const sanitizedQuery = query.trim().toLowerCase();
    if (!sanitizedQuery) {
      return [];
    }

    const queryWords = sanitizedQuery.split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) {
      return [];
    }

    const results: { doc: ChunkData; score: number }[] = [];

    await this.forEachDocument(doc => {
      const content = doc.content.toLowerCase();
      const score = queryWords.reduce((sum, word) => {
        const regex = new RegExp(this.escapeRegex(word), 'g');
        const occurrences = content.match(regex)?.length || 0;
        return sum + occurrences;
      }, 0);

      if (score <= 0) {
        return;
      }

      this.insertTopResult(results, { doc, score }, k, (a, b) => a.score - b.score);
    });

    return results
      .sort((a, b) => b.score - a.score)
      .map(item => item.doc);
  }

  async similaritySearch(embedding: number[], k: number): Promise<ChunkData[]> {
    const results: { doc: ChunkData; score: number }[] = [];

    await this.forEachDocument(doc => {
      if (!doc.embedding || doc.embedding.length === 0) {
        return;
      }
      const score = this.cosineSimilarity(embedding, doc.embedding);
      if (!Number.isFinite(score)) {
        return;
      }
      this.insertTopResult(results, { doc, score }, k, (a, b) => a.score - b.score);
    });

    return results
      .sort((a, b) => b.score - a.score)
      .map(item => item.doc);
  }

  async clear(): Promise<void> {
    this.embeddingPresent = false;
    await fs.rm(this.filePath, { force: true });
  }

  async count(): Promise<number> {
    let count = 0;
    await this.forEachDocument(() => {
      count += 1;
    });
    return count;
  }

  async hasEmbeddings(): Promise<boolean> {
    if (this.embeddingPresent) {
      return true;
    }

    await this.forEachDocument(doc => {
      if (this.embeddingPresent) {
        return;
      }
      if (doc.embedding && doc.embedding.length > 0) {
        this.embeddingPresent = true;
      }
    });

    return this.embeddingPresent;
  }

  private async forEachDocument(handler: (doc: ChunkData) => void | Promise<void>): Promise<void> {
    try {
      const stream = createReadStream(this.filePath, { encoding: 'utf-8' });
      const rl = createInterface({ input: stream, crlfDelay: Infinity });
      for await (const line of rl) {
        if (!line.trim()) {
          continue;
        }
        try {
          const doc = JSON.parse(line) as ChunkData;
          await handler(doc);
        } catch (error) {
          console.warn(`[VectorStore:${this.backendLabel}] Failed to parse entry`, error);
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn(`[VectorStore:${this.backendLabel}] Unable to iterate documents`, error);
      }
    }
  }

  private insertTopResult<T>(
    results: T[],
    candidate: T,
    k: number,
    comparator: (a: any, b: any) => number
  ): void {
    if (results.length < k) {
      results.push(candidate);
    } else {
      results.sort(comparator);
      if (comparator(candidate, results[0]) > 0) {
        results[0] = candidate;
      }
    }
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
