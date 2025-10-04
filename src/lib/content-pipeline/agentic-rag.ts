/**
 * Agentic RAG - Adaptive retrieval based on query intent
 * Dynamically adjusts retrieval strategy based on what user is asking
 */

import type { QueryIntent, RetrievalStrategy } from './types.js';

export class AgenticRAG {
  /**
   * Detect query intent and determine retrieval strategy
   */
  detectIntent(query: string): QueryIntent {
    const queryLower = query.toLowerCase();

    // Detect query type
    let type: QueryIntent['type'];

    if (this.isFactualQuery(queryLower)) {
      type = 'factual';
    } else if (this.isHowToQuery(queryLower)) {
      type = 'howto';
    } else if (this.isComparisonQuery(queryLower)) {
      type = 'comparison';
    } else if (this.isDefinitionQuery(queryLower)) {
      type = 'definition';
    } else if (this.isTroubleshootingQuery(queryLower)) {
      type = 'troubleshooting';
    } else {
      type = 'opinion';
    }

    // Detect complexity
    const complexity = this.detectComplexity(query);

    // Determine sources needed
    const sourcesNeeded = this.determineSourcesNeeded(type, complexity);

    // Check if academic sources required
    const requiresAcademic = this.requiresAcademicSources(queryLower);

    // Check if multiple perspectives needed
    const requiresMultiplePerspectives = this.requiresMultiplePerspectives(type, queryLower);

    return {
      type,
      complexity,
      sourcesNeeded,
      requiresAcademic,
      requiresMultiplePerspectives,
    };
  }

  /**
   * Create retrieval strategy based on intent
   */
  createStrategy(intent: QueryIntent): RetrievalStrategy {
    const strategies: Record<QueryIntent['type'], Partial<RetrievalStrategy>> = {
      factual: {
        minSources: 3,
        minCredibilityScore: 70,
        diversityRequired: true,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      },
      howto: {
        minSources: 2,
        minCredibilityScore: 65,
        diversityRequired: false,
        maxAge: 180 * 24 * 60 * 60 * 1000, // 6 months
      },
      comparison: {
        minSources: 4,
        minCredibilityScore: 70,
        diversityRequired: true,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      },
      definition: {
        minSources: 2,
        minCredibilityScore: 75,
        diversityRequired: false,
        maxAge: undefined, // Definitions don't age as fast
      },
      opinion: {
        minSources: 3,
        minCredibilityScore: 60,
        diversityRequired: true,
        maxAge: undefined,
      },
      troubleshooting: {
        minSources: 3,
        minCredibilityScore: 60,
        diversityRequired: false,
        maxAge: 90 * 24 * 60 * 60 * 1000, // 3 months (recent solutions)
      },
    };

    const baseStrategy = strategies[intent.type] || strategies.factual;

    // Adjust based on complexity
    if (intent.complexity === 'advanced') {
      baseStrategy.minSources = (baseStrategy.minSources || 2) + 2;
      baseStrategy.minCredibilityScore = (baseStrategy.minCredibilityScore || 70) + 5;
    }

    // Adjust if academic sources required
    if (intent.requiresAcademic) {
      baseStrategy.minCredibilityScore = Math.max(75, baseStrategy.minCredibilityScore || 70);
    }

    return {
      queryIntent: intent,
      ...baseStrategy,
    } as RetrievalStrategy;
  }

  // Private helper methods

  private isFactualQuery(query: string): boolean {
    return /^(what|when|where|who|which)/.test(query) ||
           /how many|how much/.test(query) ||
           /is it true/.test(query);
  }

  private isHowToQuery(query: string): boolean {
    return /^how to/.test(query) ||
           /steps? to/.test(query) ||
           /guide|tutorial|instructions/.test(query);
  }

  private isComparisonQuery(query: string): boolean {
    return /vs\.?|versus|compare|difference between|better than/.test(query);
  }

  private isDefinitionQuery(query: string): boolean {
    return /^what is|what are|define|definition of|meaning of/.test(query);
  }

  private isTroubleshootingQuery(query: string): boolean {
    return /fix|solve|debug|error|problem|issue|not working|broken/.test(query);
  }

  private detectComplexity(query: string): 'basic' | 'intermediate' | 'advanced' {
    const wordCount = query.split(/\s+/).length;

    // Technical terms indicate higher complexity
    const technicalTerms = [
      'algorithm', 'architecture', 'implementation', 'optimization',
      'neural network', 'transformer', 'distributed', 'concurrent',
      'asynchronous', 'paradigm', 'methodology', 'framework',
    ];

    const hasTechnicalTerms = technicalTerms.some(term =>
      query.toLowerCase().includes(term)
    );

    if (wordCount > 15 || hasTechnicalTerms) {
      return 'advanced';
    } else if (wordCount > 8) {
      return 'intermediate';
    }

    return 'basic';
  }

  private determineSourcesNeeded(
    type: QueryIntent['type'],
    complexity: QueryIntent['complexity']
  ): 'single' | 'multiple' | 'comprehensive' {
    if (type === 'definition' && complexity === 'basic') {
      return 'single';
    }

    if (type === 'comparison' || complexity === 'advanced') {
      return 'comprehensive';
    }

    return 'multiple';
  }

  private requiresAcademicSources(query: string): boolean {
    const academicIndicators = [
      'research', 'study', 'paper', 'journal', 'academic',
      'peer-reviewed', 'scientific', 'empirical', 'evidence-based',
      'meta-analysis', 'systematic review',
    ];

    return academicIndicators.some(indicator =>
      query.toLowerCase().includes(indicator)
    );
  }

  private requiresMultiplePerspectives(
    type: QueryIntent['type'],
    query: string
  ): boolean {
    const controversialTopics = [
      'climate change', 'ai safety', 'privacy', 'ethics',
      'regulation', 'policy', 'controversial', 'debate',
    ];

    return type === 'comparison' ||
           type === 'opinion' ||
           controversialTopics.some(topic => query.toLowerCase().includes(topic));
  }
}

// Export singleton
export const agenticRAG = new AgenticRAG();
