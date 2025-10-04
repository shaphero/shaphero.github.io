/**
 * Source Credibility Scoring System
 * Scores sources 0-100 based on authority, recency, citations, methodology, and bias
 */

import type { Source, SourceType } from './types.js';

export class CredibilityScorer {
  /**
   * Calculate overall credibility score for a source
   */
  scoreSource(source: Source): Source {
    const breakdown = {
      authority: this.scoreAuthority(source),
      recency: this.scoreRecency(source),
      citations: this.scoreCitations(source),
      methodology: this.scoreMethodology(source),
      bias: this.scoreBias(source),
    };

    const credibilityScore =
      breakdown.authority +
      breakdown.recency +
      breakdown.citations +
      breakdown.methodology +
      breakdown.bias;

    return {
      ...source,
      credibilityScore,
      credibilityBreakdown: breakdown,
    };
  }

  /**
   * Authority Score (0-30 points)
   * Based on source type hierarchy
   */
  private scoreAuthority(source: Source): number {
    const authorityScores: Record<SourceType, number> = {
      'academic': 30,           // Peer-reviewed papers
      'official-docs': 28,      // Official documentation
      'industry-research': 25,  // Gartner, Forrester, etc.
      'expert-commentary': 22,  // Named experts with credentials
      'news': 18,              // Reputable news outlets
      'community': 10,         // Reddit, forums
      'blog': 8,              // Blog posts
    };

    let score = authorityScores[source.type] || 5;

    // Bonus points for named authors with credentials
    if (source.authors && source.authors.length > 0) {
      score += 2;
    }

    // Bonus for DOI (indicates peer review)
    if (source.doi) {
      score += 3;
    }

    // Bonus for reputable publication
    if (source.publication) {
      score += this.scorePublication(source.publication);
    }

    return Math.min(score, 30);
  }

  /**
   * Recency Score (0-20 points)
   * Recent sources score higher, with decay based on topic velocity
   */
  private scoreRecency(source: Source): number {
    if (!source.date) {
      return 5; // Penalty for unknown date
    }

    const now = new Date();
    const ageMs = now.getTime() - source.date.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const ageMonths = ageDays / 30;

    // Academic papers have longer relevance
    if (source.type === 'academic') {
      if (ageMonths < 12) return 20;
      if (ageMonths < 24) return 18;
      if (ageMonths < 36) return 15;
      return 10;
    }

    // Tech/AI topics age quickly
    if (this.isFastMovingTopic(source)) {
      if (ageMonths < 3) return 20;
      if (ageMonths < 6) return 15;
      if (ageMonths < 12) return 10;
      return 5;
    }

    // General topics
    if (ageMonths < 6) return 20;
    if (ageMonths < 12) return 17;
    if (ageMonths < 24) return 14;
    if (ageMonths < 36) return 10;
    return 6;
  }

  /**
   * Citation Score (0-20 points)
   * Based on how often the source has been cited
   */
  private scoreCitations(source: Source): number {
    if (!source.citationCount) {
      return source.type === 'academic' ? 5 : 10; // Penalty for academic without citations
    }

    const count = source.citationCount;

    // Academic citation scoring
    if (source.type === 'academic') {
      if (count > 1000) return 20;
      if (count > 500) return 18;
      if (count > 100) return 16;
      if (count > 50) return 14;
      if (count > 10) return 12;
      return 8;
    }

    // Other source types
    if (count > 100) return 20;
    if (count > 50) return 17;
    if (count > 20) return 14;
    if (count > 5) return 11;
    return 8;
  }

  /**
   * Methodology Score (0-15 points)
   * Higher scores for sources that disclose their methodology
   */
  private scoreMethodology(source: Source): number {
    let score = 0;

    // Has methodology section
    if (source.hasMethodology) {
      score += 10;
    }

    // Academic papers typically have methodology
    if (source.type === 'academic') {
      score += 5;
    }

    // Official docs and industry research usually have transparent methods
    if (source.type === 'official-docs' || source.type === 'industry-research') {
      score += 4;
    }

    // Check metadata for methodology indicators
    if (source.metadata) {
      if (source.metadata.methodology || source.metadata.methods) {
        score += 3;
      }
      if (source.metadata.dataSource || source.metadata.sampleSize) {
        score += 2;
      }
    }

    return Math.min(score, 15);
  }

  /**
   * Bias Score (0-15 points)
   * Lower scores for potential bias or conflicts of interest
   */
  private scoreBias(source: Source): number {
    let score = 15; // Start at max, deduct for bias indicators

    // Conflict of interest
    if (source.hasConflictOfInterest) {
      score -= 8;
    }

    // Check for bias indicators in metadata
    if (source.metadata) {
      // Vendor content (selling something)
      if (source.metadata.isSponsored || source.metadata.isAdvertorial) {
        score -= 5;
      }

      // Opinion pieces
      if (source.metadata.type === 'opinion' || source.metadata.type === 'editorial') {
        score -= 3;
      }

      // Self-published without peer review
      if (source.metadata.selfPublished && source.type !== 'academic') {
        score -= 4;
      }
    }

    // URL-based bias detection
    if (this.hasKnownBias(source.url)) {
      score -= 6;
    }

    return Math.max(score, 0);
  }

  /**
   * Score publication credibility
   */
  private scorePublication(publication: string): number {
    const pubLower = publication.toLowerCase();

    // Top-tier academic publishers
    const topAcademic = [
      'nature', 'science', 'cell', 'lancet', 'jama', 'nejm',
      'pnas', 'ieee', 'acm', 'springer', 'elsevier', 'wiley',
      'oxford', 'cambridge', 'mit press', 'arxiv'
    ];
    if (topAcademic.some(name => pubLower.includes(name))) {
      return 5;
    }

    // Top-tier news
    const topNews = [
      'new york times', 'washington post', 'wall street journal',
      'reuters', 'associated press', 'bloomberg', 'financial times',
      'the economist', 'the guardian', 'bbc'
    ];
    if (topNews.some(name => pubLower.includes(name))) {
      return 4;
    }

    // Reputable tech publications
    const techPubs = [
      'ars technica', 'wired', 'mit technology review', 'ieee spectrum',
      'techcrunch', 'the verge', 'hacker news'
    ];
    if (techPubs.some(name => pubLower.includes(name))) {
      return 3;
    }

    return 1;
  }

  /**
   * Check if topic requires recent sources (AI, tech move fast)
   */
  private isFastMovingTopic(source: Source): boolean {
    const fastTopics = [
      'ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt',
      'deep learning', 'neural network', 'transformer', 'chatgpt', 'claude',
      'cryptocurrency', 'blockchain', 'web3', 'nft',
      'covid', 'coronavirus', 'pandemic',
      'quantum computing', 'quantum', 'AGI'
    ];

    const titleLower = source.title.toLowerCase();
    const metadataString = JSON.stringify(source.metadata || {}).toLowerCase();

    return fastTopics.some(topic =>
      titleLower.includes(topic) || metadataString.includes(topic)
    );
  }

  /**
   * Check for known biased or unreliable sources
   */
  private hasKnownBias(url: string): boolean {
    const urlLower = url.toLowerCase();

    // Known unreliable domains (you'd expand this list)
    const unreliable = [
      'infowars', 'breitbart', 'dailymail', 'naturalnews',
      'rt.com', 'sputnik', 'beforeitsnews', 'collective-evolution'
    ];

    return unreliable.some(domain => urlLower.includes(domain));
  }

  /**
   * Batch score multiple sources
   */
  scoreSources(sources: Source[]): Source[] {
    return sources.map(source => this.scoreSource(source));
  }

  /**
   * Filter sources by minimum credibility score
   */
  filterByCredibility(sources: Source[], minScore: number = 60): Source[] {
    const scored = this.scoreSources(sources);
    return scored.filter(source => source.credibilityScore >= minScore);
  }

  /**
   * Get credibility statistics for a set of sources
   */
  getCredibilityStats(sources: Source[]) {
    if (sources.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        distribution: {} as Record<SourceType, number>,
      };
    }

    const scored = this.scoreSources(sources);
    const scores = scored.map(s => s.credibilityScore).sort((a, b) => a - b);

    const distribution: Record<string, number> = {};
    scored.forEach(source => {
      distribution[source.type] = (distribution[source.type] || 0) + 1;
    });

    return {
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      median: scores[Math.floor(scores.length / 2)],
      min: scores[0],
      max: scores[scores.length - 1],
      distribution,
      sourceCount: sources.length,
      aboveThreshold: scored.filter(s => s.credibilityScore >= 60).length,
    };
  }
}

// Export singleton instance
export const credibilityScorer = new CredibilityScorer();
