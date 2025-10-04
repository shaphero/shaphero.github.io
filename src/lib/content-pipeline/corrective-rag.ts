/**
 * Corrective RAG (CRAG) - Verifies and corrects retrieved data
 * Based on 2025 best practices for reducing hallucinations
 */

import type { ChunkData, RetrievalResult, ContextSufficiency } from './types.js';
import { contextChecker } from './context-checker.js';

export class CorrectiveRAG {
  /**
   * Perform corrective retrieval with verification
   */
  async retrieve(
    query: string,
    initialChunks: ChunkData[],
    options: {
      vectorStore: any; // Your vector store instance
      minSufficiency?: number;
      maxIterations?: number;
      requireMultipleSources?: boolean;
    }
  ): Promise<RetrievalResult> {
    const {
      vectorStore,
      minSufficiency = 70,
      maxIterations = 3,
      requireMultipleSources = true,
    } = options;

    let currentChunks = initialChunks;
    let iteration = 0;
    let sufficiency: ContextSufficiency;

    while (iteration < maxIterations) {
      // Step 1: Grade relevance and sufficiency
      sufficiency = await contextChecker.checkSufficiency(
        query,
        currentChunks,
        { requireCompleteness: minSufficiency }
      );

      // If sufficient, we're done
      if (sufficiency.isSufficient && this.hasSourceDiversity(currentChunks, requireMultipleSources)) {
        break;
      }

      // Step 2: Identify what's missing
      const missingInfo = sufficiency.missingInfo || [];

      // Step 3: Refine query based on missing information
      const refinedQuery = this.refineQuery(query, missingInfo);

      // Step 4: Search again with refined query
      try {
        const additionalChunks = await vectorStore.search(refinedQuery, {
          limit: 10,
          excludeIds: currentChunks.map(c => c.id),
        });

        // Step 5: Combine and deduplicate
        currentChunks = this.mergeChunks(currentChunks, additionalChunks);
      } catch (error) {
        console.error('Error in corrective retrieval:', error);
        break;
      }

      iteration++;
    }

    // Final verification
    const finalSufficiency = await contextChecker.checkSufficiency(
      query,
      currentChunks,
      { requireCompleteness: minSufficiency }
    );

    return {
      chunks: currentChunks,
      sufficiency: finalSufficiency,
      sourceDiversity: this.calculateSourceDiversity(currentChunks),
      needsRefinement: !finalSufficiency.isSufficient,
      refinedQuery: iteration > 0 ? query : undefined,
    };
  }

  /**
   * Refine query based on missing information
   */
  private refineQuery(originalQuery: string, missingInfo: string[]): string {
    if (missingInfo.length === 0) {
      return originalQuery;
    }

    // Add missing information components to query
    const additions = missingInfo.map(info => {
      // Convert component to search terms
      if (info.includes('definition')) {
        return 'definition explanation what is';
      }
      if (info.includes('example')) {
        return 'examples use cases';
      }
      if (info.includes('process') || info.includes('procedure')) {
        return 'how to step by step process';
      }
      if (info.includes('comparison')) {
        return 'compare versus differences';
      }
      if (info.includes('recommendation')) {
        return 'best practices recommendations';
      }
      return info;
    });

    return `${originalQuery} ${additions.join(' ')}`;
  }

  /**
   * Merge new chunks with existing, removing duplicates
   */
  private mergeChunks(
    existing: ChunkData[],
    newChunks: ChunkData[]
  ): ChunkData[] {
    const merged = [...existing];
    const existingIds = new Set(existing.map(c => c.id));

    for (const chunk of newChunks) {
      if (!existingIds.has(chunk.id)) {
        merged.push(chunk);
        existingIds.add(chunk.id);
      }
    }

    return merged;
  }

  /**
   * Check if chunks come from multiple sources
   */
  private hasSourceDiversity(
    chunks: ChunkData[],
    requireMultiple: boolean
  ): boolean {
    if (!requireMultiple) return true;

    const uniqueSources = new Set(chunks.map(c => c.source.id));
    return uniqueSources.size >= 2;
  }

  /**
   * Calculate source diversity metrics
   */
  private calculateSourceDiversity(chunks: ChunkData[]) {
    const sourceTypes = new Map<string, number>();
    const dates: Date[] = [];

    for (const chunk of chunks) {
      // Count by source type
      const type = chunk.source.type;
      sourceTypes.set(type, (sourceTypes.get(type) || 0) + 1);

      // Collect dates
      if (chunk.source.date) {
        dates.push(chunk.source.date);
      }
    }

    const dateRange =
      dates.length > 0
        ? {
            oldest: new Date(Math.min(...dates.map(d => d.getTime()))),
            newest: new Date(Math.max(...dates.map(d => d.getTime()))),
          }
        : {
            oldest: new Date(),
            newest: new Date(),
          };

    return {
      types: Object.fromEntries(sourceTypes),
      perspectives: sourceTypes.size,
      dateRange,
    };
  }

  /**
   * Cross-verify facts across multiple chunks
   */
  async crossVerifyFacts(chunks: ChunkData[]): Promise<{
    verified: ChunkData[];
    flagged: ChunkData[];
    confidence: number;
  }> {
    const verified: ChunkData[] = [];
    const flagged: ChunkData[] = [];

    // Group chunks by claims they make
    const claimMap = new Map<string, ChunkData[]>();

    for (const chunk of chunks) {
      const claims = this.extractClaims(chunk.content);

      for (const claim of claims) {
        if (!claimMap.has(claim)) {
          claimMap.set(claim, []);
        }
        claimMap.get(claim)!.push(chunk);
      }
    }

    // Chunks with claims supported by multiple sources are verified
    for (const chunk of chunks) {
      const chunkClaims = this.extractClaims(chunk.content);

      let verifiedClaims = 0;
      for (const claim of chunkClaims) {
        const supportingSources = claimMap.get(claim) || [];
        if (supportingSources.length >= 2) {
          verifiedClaims++;
        }
      }

      const verificationRate = chunkClaims.length > 0
        ? verifiedClaims / chunkClaims.length
        : 0;

      if (verificationRate >= 0.5) {
        verified.push(chunk);
      } else if (verificationRate < 0.3) {
        flagged.push(chunk);
      }
    }

    const confidence = verified.length / chunks.length;

    return { verified, flagged, confidence };
  }

  /**
   * Extract factual claims from content (simple version)
   */
  private extractClaims(content: string): string[] {
    const claims: string[] = [];

    // Split into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    for (const sentence of sentences) {
      // Claims typically have certain patterns
      const hasClaim =
        /\d+%/.test(sentence) || // Statistics
        /is|are|was|were/.test(sentence) || // Definitive statements
        /research|study|found|shows|indicates/.test(sentence) || // Research claims
        /according to|states that/.test(sentence); // Attribution

      if (hasClaim && sentence.length > 20) {
        claims.push(sentence.trim());
      }
    }

    return claims;
  }

  /**
   * Evaluate quality of retrieval result
   */
  evaluateResult(result: RetrievalResult): {
    score: number;
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let score = 0;

    // Sufficiency
    if (result.sufficiency.isSufficient) {
      score += 40;
      strengths.push('Sufficient context provided');
    } else {
      weaknesses.push(`Context only ${result.sufficiency.completeness}% complete`);
    }

    // Source diversity
    const perspectives = result.sourceDiversity.perspectives;
    if (perspectives >= 3) {
      score += 30;
      strengths.push(`${perspectives} different source types`);
    } else if (perspectives >= 2) {
      score += 15;
      weaknesses.push('Limited source diversity');
    } else {
      weaknesses.push('Single source type only');
    }

    // Chunk count
    const chunkCount = result.chunks.length;
    if (chunkCount >= 5 && chunkCount <= 15) {
      score += 20;
      strengths.push('Good number of chunks');
    } else if (chunkCount < 5) {
      score += 10;
      weaknesses.push('Too few chunks');
    } else {
      score += 10;
      weaknesses.push('Too many chunks (may have noise)');
    }

    // Recency
    const daysSinceNewest =
      (Date.now() - result.sourceDiversity.dateRange.newest.getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysSinceNewest < 180) {
      // Within 6 months
      score += 10;
      strengths.push('Recent sources');
    } else {
      weaknesses.push('Sources may be outdated');
    }

    return { score, strengths, weaknesses };
  }
}

// Export singleton
export const correctiveRAG = new CorrectiveRAG();
