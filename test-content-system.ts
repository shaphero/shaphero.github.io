/**
 * Test script for Educational Content Generation System
 */

import { createCoreClient } from './src/lib/content-pipeline/core-api-client.js';
import { credibilityScorer } from './src/lib/content-pipeline/credibility-scorer.js';
import { semanticChunker } from './src/lib/content-pipeline/semantic-chunker.js';
import { claimVerifier } from './src/lib/content-pipeline/claim-verifier.js';
import { hallucinationDetector } from './src/lib/content-pipeline/hallucination-detector.js';
import { createCitationManager } from './src/lib/content-pipeline/citation-manager.js';
import { agenticRAG } from './src/lib/content-pipeline/agentic-rag.js';
import { biasDetector } from './src/lib/content-pipeline/bias-detector.js';
import { qualityScorer } from './src/lib/content-pipeline/quality-scorer.js';

async function testContentSystem() {
  console.log('🧪 Testing Educational Content Generation System\n');

  // Test 1: CORE API Client
  console.log('1️⃣ Testing CORE API Integration...');
  try {
    const coreClient = createCoreClient();
    if (!coreClient) {
      console.log('⚠️  CORE API client not initialized (missing API key?)');
    } else {
      console.log('✅ CORE API client initialized');

      // Try searching for papers
      const papers = await coreClient.searchPapers('machine learning', { limit: 3 });
      console.log(`   Found ${papers.length} papers`);
      if (papers.length > 0) {
        console.log(`   Example: "${papers[0].title}"`);
      }
    }
  } catch (error: any) {
    console.log(`❌ CORE API Error: ${error.message}`);
  }

  console.log();

  // Test 2: Credibility Scorer
  console.log('2️⃣ Testing Credibility Scorer...');
  try {
    const testSource = {
      id: 'test-1',
      url: 'https://example.com',
      title: 'Test Paper',
      type: 'academic' as const,
      date: new Date('2024-01-01'),
      authors: ['Dr. Smith'],
      doi: '10.1234/test',
      credibilityScore: 0,
      credibilityBreakdown: {
        authority: 0,
        recency: 0,
        citations: 0,
        methodology: 0,
        bias: 0,
      },
    };

    const scored = credibilityScorer.scoreSource(testSource);
    console.log(`✅ Credibility Score: ${scored.credibilityScore}/100`);
    console.log(`   Authority: ${scored.credibilityBreakdown.authority}`);
    console.log(`   Recency: ${scored.credibilityBreakdown.recency}`);
  } catch (error: any) {
    console.log(`❌ Credibility Scorer Error: ${error.message}`);
  }

  console.log();

  // Test 3: Semantic Chunker
  console.log('3️⃣ Testing Semantic Chunker...');
  try {
    const testContent = `
# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data.

## Types of Machine Learning

There are three main types: supervised learning, unsupervised learning, and reinforcement learning.

Supervised learning uses labeled data to train models. For example, a spam filter learns from emails labeled as spam or not spam.

Unsupervised learning finds patterns in unlabeled data. Clustering is a common unsupervised technique.
    `.trim();

    const testSource = {
      id: 'test-1',
      url: 'https://example.com',
      title: 'ML Guide',
      type: 'documentation' as const,
      credibilityScore: 75,
      credibilityBreakdown: { authority: 20, recency: 15, citations: 15, methodology: 12, bias: 13 },
    };

    const chunks = await semanticChunker.chunkContent(testContent, testSource);
    console.log(`✅ Created ${chunks.length} semantic chunks`);
    chunks.forEach((chunk, i) => {
      console.log(`   Chunk ${i + 1}: ${chunk.metadata.conceptType} (${chunk.content.substring(0, 50)}...)`);
    });
  } catch (error: any) {
    console.log(`❌ Semantic Chunker Error: ${error.message}`);
  }

  console.log();

  // Test 4: Agentic RAG (Query Intent Detection)
  console.log('4️⃣ Testing Agentic RAG...');
  try {
    const queries = [
      'What is machine learning?',
      'How to implement a neural network?',
      'Compare supervised vs unsupervised learning',
    ];

    for (const query of queries) {
      const intent = agenticRAG.detectIntent(query);
      console.log(`✅ Query: "${query}"`);
      console.log(`   Type: ${intent.type}, Complexity: ${intent.complexity}`);
      console.log(`   Needs ${intent.sourcesNeeded} sources, Academic: ${intent.requiresAcademic}`);
    }
  } catch (error: any) {
    console.log(`❌ Agentic RAG Error: ${error.message}`);
  }

  console.log();

  // Test 5: Claim Verifier
  console.log('5️⃣ Testing Claim Verifier...');
  try {
    const testContent = 'Machine learning is widely used in spam filtering. Studies show 95% accuracy.';
    const testSources = [{
      id: 'source-1',
      url: 'https://example.com',
      title: 'ML Research',
      type: 'academic' as const,
      credibilityScore: 80,
      credibilityBreakdown: { authority: 25, recency: 18, citations: 15, methodology: 12, bias: 10 },
    }];

    const claims = claimVerifier.extractClaims(testContent, testSources);
    console.log(`✅ Extracted ${claims.length} claims`);
    claims.forEach((claim, i) => {
      console.log(`   Claim ${i + 1}: [${claim.type}] "${claim.statement}"`);
    });
  } catch (error: any) {
    console.log(`❌ Claim Verifier Error: ${error.message}`);
  }

  console.log();

  // Test 6: Citation Manager
  console.log('6️⃣ Testing Citation Manager...');
  try {
    const citationManager = createCitationManager();

    const testSource = {
      id: 'source-1',
      url: 'https://example.com/paper',
      title: 'Advances in Machine Learning',
      type: 'academic' as const,
      date: new Date('2024-01-15'),
      authors: ['Dr. Jane Smith', 'Dr. John Doe'],
      publication: 'Journal of AI Research',
      doi: '10.1234/jair.2024.001',
      credibilityScore: 85,
      credibilityBreakdown: { authority: 28, recency: 19, citations: 16, methodology: 13, bias: 9 },
    };

    const citation = citationManager.addCitation(testSource);
    console.log(`✅ Added citation: ${citation.inlineMarker}`);

    const bibliography = citationManager.formatBibliography('apa');
    console.log('   Bibliography (APA):');
    console.log(bibliography.split('\n').map(line => `   ${line}`).join('\n'));
  } catch (error: any) {
    console.log(`❌ Citation Manager Error: ${error.message}`);
  }

  console.log();

  // Test 7: Bias Detector
  console.log('7️⃣ Testing Bias Detector...');
  try {
    const testContent = `
Machine learning is definitely the best technology ever created.
It has excellent benefits and superior advantages.
All experts agree it's revolutionary and proven fact it will change everything.
    `.trim();

    const testSources = [
      {
        id: 's1',
        url: 'https://example.com/1',
        title: 'ML Paper 1',
        type: 'blog' as const,
        credibilityScore: 60,
        credibilityBreakdown: { authority: 15, recency: 18, citations: 10, methodology: 9, bias: 8 },
      },
      {
        id: 's2',
        url: 'https://example.com/2',
        title: 'ML Paper 2',
        type: 'blog' as const,
        credibilityScore: 65,
        credibilityBreakdown: { authority: 16, recency: 18, citations: 11, methodology: 10, bias: 10 },
      },
    ];

    const biases = biasDetector.detectBias(testContent, testSources);
    console.log(`✅ Detected ${biases.length} potential bias issues`);
    biases.forEach((bias, i) => {
      console.log(`   ${i + 1}. [${bias.severity}] ${bias.description}`);
    });
  } catch (error: any) {
    console.log(`❌ Bias Detector Error: ${error.message}`);
  }

  console.log();

  // Test 8: Quality Scorer
  console.log('8️⃣ Testing Quality Scorer...');
  try {
    const testSources = [
      {
        id: 's1',
        url: 'https://example.com/1',
        title: 'Academic Paper',
        type: 'academic' as const,
        date: new Date('2024-06-01'),
        credibilityScore: 85,
        credibilityBreakdown: { authority: 28, recency: 19, citations: 16, methodology: 13, bias: 9 },
      },
      {
        id: 's2',
        url: 'https://example.com/2',
        title: 'Documentation',
        type: 'documentation' as const,
        date: new Date('2024-03-01'),
        credibilityScore: 75,
        credibilityBreakdown: { authority: 20, recency: 17, citations: 14, methodology: 12, bias: 12 },
      },
    ];

    const testClaims = [
      {
        id: 'c1',
        statement: 'ML is used in spam filtering',
        type: 'fact' as const,
        sources: testSources,
        verified: true,
        confidence: 90,
        verification: {
          supportingSources: testSources,
          conflictingSources: [],
          agreement: true,
          needsReview: false,
        },
      },
    ];

    const testCitations = [
      {
        id: 'cite-1',
        inlineMarker: '[1]',
        source: testSources[0],
        accessDate: new Date(),
      },
    ];

    const qualityScore = qualityScorer.calculateScore({
      sources: testSources,
      claims: testClaims,
      citations: testCitations,
      hallucinationChecks: [],
      biasChecks: [],
      wordCount: 500,
    });

    console.log(`✅ Overall Quality Score: ${qualityScore.overall}/100`);
    console.log(`   Ready to Publish: ${qualityScore.readyToPublish ? 'YES ✅' : 'NO ⚠️'}`);
    console.log('   Breakdown:');
    console.log(`   - Source Credibility: ${qualityScore.breakdown.sourceCredibility.toFixed(0)}/100`);
    console.log(`   - Citation Coverage: ${qualityScore.breakdown.citationCoverage.toFixed(0)}/100`);
    console.log(`   - Fact Verification: ${qualityScore.breakdown.factVerification.toFixed(0)}/100`);
    console.log(`   - Concept Clarity: ${qualityScore.breakdown.conceptClarity.toFixed(0)}/100`);
  } catch (error: any) {
    console.log(`❌ Quality Scorer Error: ${error.message}`);
  }

  console.log();
  console.log('🎉 Test Suite Complete!');
}

// Run the tests
testContentSystem().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
