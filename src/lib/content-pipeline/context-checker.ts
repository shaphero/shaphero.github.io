/**
 * Context Sufficiency Checker
 * Ensures chunks provide SUFFICIENT context, not just relevant context
 * Based on 2025 RAG best practices
 */

import type { ChunkData, ContextSufficiency } from './types.js';

export class ContextChecker {
  /**
   * Check if retrieved chunks provide sufficient context to answer query
   */
  async checkSufficiency(
    query: string,
    chunks: ChunkData[],
    options: {
      requireCompleteness?: number; // 0-100, minimum completeness score
      llmProvider?: 'openai' | 'anthropic';
    } = {}
  ): Promise<ContextSufficiency> {
    const { requireCompleteness = 70 } = options;

    if (chunks.length === 0) {
      return {
        isRelevant: false,
        isSufficient: false,
        completeness: 0,
        missingInfo: ['No chunks provided'],
        recommendedAction: 'search_more',
      };
    }

    // Check basic relevance
    const relevance = this.checkRelevance(query, chunks);

    if (!relevance.isRelevant) {
      return {
        isRelevant: false,
        isSufficient: false,
        completeness: 0,
        missingInfo: ['Content not relevant to query'],
        recommendedAction: 'refine_query',
      };
    }

    // Check if chunks can answer query completely
    const completeness = await this.calculateCompleteness(query, chunks);

    const isSufficient = completeness.score >= requireCompleteness;

    return {
      isRelevant: true,
      isSufficient,
      completeness: completeness.score,
      missingInfo: completeness.missingInfo,
      recommendedAction: this.getRecommendedAction(completeness.score, chunks.length),
    };
  }

  /**
   * Check if chunks are relevant to query
   */
  private checkRelevance(query: string, chunks: ChunkData[]): {
    isRelevant: boolean;
    relevanceScore: number;
  } {
    const queryTerms = this.extractKeyTerms(query);

    let totalMatches = 0;
    let totalPossible = queryTerms.length * chunks.length;

    for (const chunk of chunks) {
      const chunkLower = chunk.content.toLowerCase();
      for (const term of queryTerms) {
        if (chunkLower.includes(term.toLowerCase())) {
          totalMatches++;
        }
      }
    }

    const relevanceScore = (totalMatches / totalPossible) * 100;

    return {
      isRelevant: relevanceScore > 20, // At least 20% term overlap
      relevanceScore,
    };
  }

  /**
   * Calculate how completely the chunks can answer the query
   */
  private async calculateCompleteness(
    query: string,
    chunks: ChunkData[]
  ): Promise<{
    score: number;
    missingInfo: string[];
  }> {
    // Identify what information the query is asking for
    const queryComponents = this.parseQueryComponents(query);

    // Check which components are addressed in chunks
    const combinedContent = chunks.map(c => c.content).join('\n\n');
    const addressedComponents: string[] = [];
    const missingComponents: string[] = [];

    for (const component of queryComponents) {
      const hasInfo = this.hasInformation(combinedContent, component);
      if (hasInfo) {
        addressedComponents.push(component);
      } else {
        missingComponents.push(component);
      }
    }

    const score = (addressedComponents.length / queryComponents.length) * 100;

    return {
      score,
      missingInfo: missingComponents,
    };
  }

  /**
   * Parse query into information components
   */
  private parseQueryComponents(query: string): string[] {
    const components: string[] = [];

    // Check for question type
    const queryLower = query.toLowerCase();

    // What queries
    if (queryLower.startsWith('what')) {
      components.push('definition/explanation');
    }

    // How queries
    if (queryLower.startsWith('how')) {
      components.push('process/procedure');
      components.push('examples');
    }

    // Why queries
    if (queryLower.startsWith('why')) {
      components.push('explanation');
      components.push('reasoning/causes');
    }

    // When queries
    if (queryLower.startsWith('when')) {
      components.push('timeline/dates');
    }

    // Who queries
    if (queryLower.startsWith('who')) {
      components.push('people/organizations');
    }

    // Where queries
    if (queryLower.startsWith('where')) {
      components.push('location/context');
    }

    // Comparison queries
    if (queryLower.includes('vs') || queryLower.includes('versus') || queryLower.includes('compare')) {
      components.push('comparison');
      components.push('advantages/disadvantages');
    }

    // Best practices queries
    if (queryLower.includes('best') || queryLower.includes('recommend')) {
      components.push('recommendations');
      components.push('examples');
    }

    // Tutorial queries
    if (queryLower.includes('guide') || queryLower.includes('tutorial') || queryLower.includes('learn')) {
      components.push('step-by-step instructions');
      components.push('prerequisites');
      components.push('examples');
    }

    // If no specific components identified, add general requirements
    if (components.length === 0) {
      components.push('core information');
      components.push('context');
    }

    return components;
  }

  /**
   * Check if content has information about a component
   */
  private hasInformation(content: string, component: string): boolean {
    const contentLower = content.toLowerCase();
    const componentLower = component.toLowerCase();

    // Direct component type checks
    const patterns: Record<string, RegExp[]> = {
      'definition/explanation': [
        /is defined as/i,
        /refers to/i,
        /means that/i,
        /can be described as/i,
      ],
      'process/procedure': [
        /step \d+/i,
        /first.*then.*finally/i,
        /process.*follows/i,
        /procedure/i,
      ],
      'examples': [
        /for example/i,
        /for instance/i,
        /such as/i,
        /illustrated by/i,
      ],
      'reasoning/causes': [
        /because/i,
        /due to/i,
        /caused by/i,
        /reason/i,
      ],
      'timeline/dates': [
        /\d{4}/,
        /in \d+ years/i,
        /recently/i,
        /historically/i,
      ],
      'comparison': [
        /compared to/i,
        /versus/i,
        /while.*whereas/i,
        /difference between/i,
      ],
      'advantages/disadvantages': [
        /advantage/i,
        /benefit/i,
        /drawback/i,
        /limitation/i,
      ],
    };

    // Check if component matches any pattern
    for (const [type, regexes] of Object.entries(patterns)) {
      if (componentLower.includes(type)) {
        return regexes.some(regex => regex.test(content));
      }
    }

    // Fallback: check if component terms appear in content
    const terms = component.split(/[\s\/]+/);
    return terms.some(term => contentLower.includes(term));
  }

  /**
   * Get recommended action based on completeness score
   */
  private getRecommendedAction(
    completeness: number,
    chunkCount: number
  ): 'use' | 'refine_query' | 'search_more' | 'combine_chunks' {
    if (completeness >= 80) {
      return 'use';
    }

    if (completeness >= 60 && chunkCount < 5) {
      return 'search_more';
    }

    if (completeness >= 40 && chunkCount >= 5) {
      return 'combine_chunks';
    }

    return 'refine_query';
  }

  /**
   * Extract key terms from query
   */
  private extractKeyTerms(query: string): string[] {
    // Remove common question words
    const stopWords = new Set([
      'what', 'how', 'why', 'when', 'where', 'who', 'which',
      'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but',
      'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Check if chunks should be combined for better context
   */
  shouldCombineChunks(chunks: ChunkData[]): {
    shouldCombine: boolean;
    groups: ChunkData[][];
  } {
    if (chunks.length <= 1) {
      return { shouldCombine: false, groups: [chunks] };
    }

    // Group chunks by source
    const bySource = new Map<string, ChunkData[]>();

    for (const chunk of chunks) {
      const sourceId = chunk.source.id;
      if (!bySource.has(sourceId)) {
        bySource.set(sourceId, []);
      }
      bySource.get(sourceId)!.push(chunk);
    }

    // Sort chunks within each source by position
    for (const [sourceId, sourceChunks] of bySource.entries()) {
      sourceChunks.sort((a, b) => a.metadata.position - b.metadata.position);
    }

    const groups = Array.from(bySource.values());

    // Should combine if we have sequential chunks from same source
    const shouldCombine = groups.some(group =>
      group.length > 1 && this.areSequential(group)
    );

    return { shouldCombine, groups };
  }

  /**
   * Check if chunks are sequential (can be combined)
   */
  private areSequential(chunks: ChunkData[]): boolean {
    if (chunks.length <= 1) return false;

    for (let i = 1; i < chunks.length; i++) {
      const prev = chunks[i - 1];
      const curr = chunks[i];

      // Check if positions are sequential
      if (curr.metadata.position !== prev.metadata.position + 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Combine sequential chunks into larger context
   */
  combineChunks(chunks: ChunkData[]): ChunkData {
    if (chunks.length === 0) {
      throw new Error('No chunks to combine');
    }

    if (chunks.length === 1) {
      return chunks[0];
    }

    // Sort by position
    const sorted = [...chunks].sort((a, b) => a.metadata.position - b.metadata.position);

    const combinedContent = sorted.map(c => c.content).join('\n\n');

    return {
      id: `combined-${sorted[0].id}-to-${sorted[sorted.length - 1].id}`,
      content: combinedContent,
      source: sorted[0].source,

      metadata: {
        ...sorted[0].metadata,
        position: sorted[0].metadata.position,
        totalChunks: sorted[sorted.length - 1].metadata.position + 1,
        tokens: sorted.reduce((sum, c) => sum + c.metadata.tokens, 0),
        startChar: sorted[0].metadata.startChar,
        endChar: sorted[sorted.length - 1].metadata.endChar,
        isSelfContained: true, // Combined chunks should be self-contained

        // Merge entities, topics, keywords
        entities: Array.from(new Set(sorted.flatMap(c => c.metadata.entities || []))),
        topics: Array.from(new Set(sorted.flatMap(c => c.metadata.topics || []))),
        keywords: Array.from(new Set(sorted.flatMap(c => c.metadata.keywords || []))),
      },
    };
  }

  /**
   * Batch check sufficiency for multiple queries
   */
  async batchCheckSufficiency(
    queries: string[],
    chunks: ChunkData[],
    options?: { requireCompleteness?: number }
  ): Promise<Map<string, ContextSufficiency>> {
    const results = new Map<string, ContextSufficiency>();

    for (const query of queries) {
      const sufficiency = await this.checkSufficiency(query, chunks, options);
      results.set(query, sufficiency);
    }

    return results;
  }
}

// Export singleton
export const contextChecker = new ContextChecker();
