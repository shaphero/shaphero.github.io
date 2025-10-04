/**
 * Research AI ROI Analysis from Academic Sources
 */

import 'dotenv/config';
import { createCoreClient } from './src/lib/content-pipeline/core-api-client.js';
import { credibilityScorer } from './src/lib/content-pipeline/credibility-scorer.js';
import { semanticChunker } from './src/lib/content-pipeline/semantic-chunker.js';
import { claimVerifier } from './src/lib/content-pipeline/claim-verifier.js';
import { createCitationManager } from './src/lib/content-pipeline/citation-manager.js';
import { qualityScorer } from './src/lib/content-pipeline/quality-scorer.js';
import { biasDetector } from './src/lib/content-pipeline/bias-detector.js';
import { hallucinationDetector } from './src/lib/content-pipeline/hallucination-detector.js';
import type { Source, ChunkData } from './src/lib/content-pipeline/types.js';
import * as fs from 'fs';

async function researchAIROI() {
  console.log('🔬 Researching AI ROI Analysis from Academic Sources\n');

  const allSources: Source[] = [];
  const allChunks: ChunkData[] = [];

  // 1. Search CORE API for academic papers
  console.log('1️⃣ Searching academic papers on AI ROI...');
  const coreClient = createCoreClient();

  if (coreClient) {
    try {
      const topics = [
        'AI ROI',
        'AI enterprise adoption',
        'machine learning business value',
        'AI implementation success'
      ];

      for (const topic of topics) {
        console.log(`   Searching: "${topic}"...`);
        const papers = await coreClient.searchPapers(topic, {
          limit: 10,
          minCitations: 0,  // Don't filter by citations initially
          yearFrom: 2020
        });

        console.log(`   Found ${papers.length} papers`);
        allSources.push(...papers);
      }
    } catch (error: any) {
      console.log(`   ⚠️  CORE API Error: ${error.message}`);
    }
  } else {
    console.log('   ⚠️  CORE API not available (check CORE_API_KEY in .env)');
  }

  // 2. Score source credibility
  console.log('\n2️⃣ Scoring source credibility...');
  const scoredSources = credibilityScorer.scoreSources(allSources);
  const qualitySources = scoredSources.filter(s => s.credibilityScore >= 60);
  console.log(`   ${qualitySources.length}/${scoredSources.length} sources meet quality threshold (60+)`);

  if (qualitySources.length > 0) {
    const avgCredibility = qualitySources.reduce((sum, s) => sum + s.credibilityScore, 0) / qualitySources.length;
    console.log(`   Average credibility: ${avgCredibility.toFixed(0)}/100`);
  }

  // 3. Create semantic chunks
  console.log('\n3️⃣ Creating semantic chunks from sources...');
  for (const source of qualitySources.slice(0, 10)) {
    if (source.metadata?.abstract) {
      const chunks = await semanticChunker.chunkContent(source.metadata.abstract, source);
      allChunks.push(...chunks);
    }
  }
  console.log(`   Created ${allChunks.length} semantic chunks`);

  // 4. Generate research summary
  console.log('\n4️⃣ Generating research summary...');

  const summary = {
    totalSources: scoredSources.length,
    qualitySources: qualitySources.length,
    totalChunks: allChunks.length,
    averageCredibility: qualitySources.length > 0
      ? qualitySources.reduce((sum, s) => sum + s.credibilityScore, 0) / qualitySources.length
      : 0,
    sourcesByType: {} as Record<string, number>,
    topSources: qualitySources.slice(0, 10).map(s => ({
      title: s.title,
      authors: s.authors,
      year: s.date?.getFullYear(),
      credibility: s.credibilityScore,
      doi: s.doi,
      url: s.url
    }))
  };

  qualitySources.forEach(s => {
    summary.sourcesByType[s.type] = (summary.sourcesByType[s.type] || 0) + 1;
  });

  // Save research data
  const outputDir = './research-output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    `${outputDir}/ai-roi-research.json`,
    JSON.stringify({ summary, sources: qualitySources, chunks: allChunks }, null, 2)
  );

  console.log('\n📊 Research Summary:');
  console.log(`   Total sources found: ${summary.totalSources}`);
  console.log(`   Quality sources (60+): ${summary.qualitySources}`);
  console.log(`   Average credibility: ${summary.averageCredibility.toFixed(0)}/100`);
  console.log(`   Semantic chunks: ${summary.totalChunks}`);
  console.log(`\n   Sources by type:`);
  Object.entries(summary.sourcesByType).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`);
  });

  console.log(`\n✅ Research data saved to: ${outputDir}/ai-roi-research.json`);

  if (summary.topSources.length > 0) {
    console.log('\n📚 Top 5 Sources:');
    summary.topSources.slice(0, 5).forEach((s, i) => {
      console.log(`\n${i + 1}. ${s.title}`);
      console.log(`   Authors: ${s.authors?.join(', ') || 'Unknown'}`);
      console.log(`   Year: ${s.year || 'Unknown'}`);
      console.log(`   Credibility: ${s.credibility}/100`);
      if (s.doi) console.log(`   DOI: ${s.doi}`);
    });
  }
}

researchAIROI().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
