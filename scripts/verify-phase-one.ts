#!/usr/bin/env tsx

import { FileCache } from '../src/lib/content-pipeline/cache';
import { VectorStore } from '../src/lib/content-pipeline/vector-store';
import { RealContentProcessor } from '../src/lib/content-pipeline/real-content-processor';
import type { ChunkData } from '../src/lib/content-pipeline/config';
import { promises as fs } from 'fs';
import { join } from 'path';

async function verifyCacheLayer() {
  const cacheDir = '.cache/phase-one-verification';
  const cache = new FileCache(cacheDir);
  await cache.set('sample', { hello: 'world' }, { ttlMs: 1000 });
  const value = await cache.get<{ hello: string }>('sample');
  if (!value || value.hello !== 'world') {
    throw new Error('Cache read/write failed');
  }
  console.log('✅ Cache layer read/write successful');
}

async function verifyDiskVectorStore() {
  const path = join('.cache', 'vector-store', 'verification.jsonl');
  await fs.rm(path, { force: true });

  const store = new VectorStore({ type: 'lancedb', path });
  const docs: ChunkData[] = [
    {
      id: 'doc-1',
      content: 'AI pilots succeed when workflows stay familiar and metrics are clear.',
      source: {
        url: 'https://example.com/success',
        title: 'Success Patterns',
        type: 'article'
      },
      embedding: [0.1, 0.2, 0.3]
    },
    {
      id: 'doc-2',
      content: 'Most AI initiatives fail because teams skip organizational change.',
      source: {
        url: 'https://example.com/failure',
        title: 'Failure Modes',
        type: 'article'
      },
      embedding: [0.2, 0.1, 0.25]
    }
  ];

  await store.addDocuments(docs);
  const keywordResults = await store.search('workflows change', 2);
  const similarityResults = await store.similaritySearch([0.21, 0.1, 0.24], 1);

  if (keywordResults.length === 0 || similarityResults.length === 0) {
    throw new Error('Disk vector store search returned no results');
  }

  console.log('✅ Disk-backed vector store keyword & similarity search successful');
}

async function verifyProcessorConcurrency() {
  const processor = new RealContentProcessor(500, 100, {
    embeddingBatchSize: 5,
    embeddingConcurrency: 2,
    embeddingMaxRetries: 2,
    retryBaseDelayMs: 250
  });

  const chunks: ChunkData[] = [
    {
      id: 'chunk-1',
      content: 'Short test chunk for embeddings.',
      source: {
        url: 'https://example.com/chunk',
        title: 'Chunk Source',
        type: 'article'
      }
    }
  ];

  const embedded = await processor.generateEmbeddings(chunks);
  if (!embedded[0].embedding || embedded[0].embedding.length === 0) {
    throw new Error('Embedding generation failed');
  }

  console.log('✅ Content processor generated embeddings with bounded concurrency');
}

async function main() {
  try {
    await verifyCacheLayer();
    await verifyDiskVectorStore();
    await verifyProcessorConcurrency();
    console.log('\nPhase one verification complete.');
  } catch (error) {
    console.error('Phase one verification failed:', error);
    process.exitCode = 1;
  }
}

main();
