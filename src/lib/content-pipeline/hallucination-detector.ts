/**
 * Hallucination Detection System
 * Detects when AI generates content not found in source material
 */

import type { HallucinationCheck, Claim, Source, ChunkData } from './types.js';

export class HallucinationDetector {
  /**
   * Detect potential hallucinations in generated content
   */
  async detectHallucinations(
    generatedContent: string,
    sources: Source[],
    chunks: ChunkData[],
    claims: Claim[]
  ): Promise<HallucinationCheck[]> {
    const hallucinations: HallucinationCheck[] = [];

    for (const claim of claims) {
      const check = await this.checkClaim(claim, sources, chunks);

      if (check.isPotentialHallucination) {
        hallucinations.push(check);
      }
    }

    return hallucinations;
  }

  /**
   * Check a single claim for hallucination
   */
  private async checkClaim(
    claim: Claim,
    sources: Source[],
    chunks: ChunkData[]
  ): Promise<HallucinationCheck> {
    // Check if claim is found in source material
    const foundInSources = this.searchInChunks(claim.statement, chunks);

    if (!foundInSources.found) {
      // Not found in sources - likely hallucination
      return {
        claim,
        isPotentialHallucination: true,
        reason: 'Claim not found in any source material',
        foundInSources: false,
        recommendation: 'remove',
      };
    }

    // Check confidence level
    if (claim.confidence < 50) {
      return {
        claim,
        isPotentialHallucination: true,
        reason: `Low confidence (${claim.confidence}%) - insufficient source support`,
        foundInSources: true,
        sourceExcerpts: foundInSources.excerpts,
        recommendation: 'add_citation',
      };
    }

    // Check for unverified status
    if (!claim.verified) {
      return {
        claim,
        isPotentialHallucination: true,
        reason: 'Claim is unverified - only one source supports it',
        foundInSources: true,
        sourceExcerpts: foundInSources.excerpts,
        recommendation: 'revise',
      };
    }

    // Check for conflicting data
    if (claim.verification.conflictingSources.length > 0) {
      return {
        claim,
        isPotentialHallucination: true,
        reason: 'Conflicting information found in sources',
        foundInSources: true,
        sourceExcerpts: foundInSources.excerpts,
        recommendation: 'revise',
      };
    }

    // No hallucination detected
    return {
      claim,
      isPotentialHallucination: false,
      reason: 'Claim is well-supported by sources',
      foundInSources: true,
      sourceExcerpts: foundInSources.excerpts,
      recommendation: 'keep',
    };
  }

  /**
   * Search for claim in chunks
   */
  private searchInChunks(
    claimText: string,
    chunks: ChunkData[]
  ): {
    found: boolean;
    excerpts: string[];
  } {
    const excerpts: string[] = [];
    const keywords = this.extractKeywords(claimText);

    for (const chunk of chunks) {
      const chunkLower = chunk.content.toLowerCase();

      // Count keyword matches
      let matches = 0;
      for (const keyword of keywords) {
        if (chunkLower.includes(keyword.toLowerCase())) {
          matches++;
        }
      }

      // If more than 50% of keywords match, extract excerpt
      if (matches >= keywords.length * 0.5) {
        const excerpt = this.extractRelevantExcerpt(chunk.content, keywords);
        if (excerpt) {
          excerpts.push(excerpt);
        }
      }
    }

    return {
      found: excerpts.length > 0,
      excerpts: excerpts.slice(0, 3), // Top 3 excerpts
    };
  }

  /**
   * Extract excerpt around keywords
   */
  private extractRelevantExcerpt(content: string, keywords: string[]): string | null {
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();

      // Check if sentence contains keywords
      let keywordCount = 0;
      for (const keyword of keywords) {
        if (sentenceLower.includes(keyword.toLowerCase())) {
          keywordCount++;
        }
      }

      if (keywordCount >= Math.min(2, keywords.length)) {
        // Return sentence with some context
        return sentence.trim().substring(0, 200) + (sentence.length > 200 ? '...' : '');
      }
    }

    return null;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
      'it', 'for', 'not', 'on', 'with', 'as', 'you', 'do', 'at',
      'this', 'but', 'by', 'from', 'they', 'we', 'or', 'an',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  /**
   * Detect specific hallucination types
   */
  detectSpecificTypes(content: string, sources: Source[]): {
    fabricatedStats: string[];
    fabricatedQuotes: string[];
    fabricatedSources: string[];
    fabricatedDetails: string[];
  } {
    return {
      fabricatedStats: this.detectFabricatedStats(content, sources),
      fabricatedQuotes: this.detectFabricatedQuotes(content, sources),
      fabricatedSources: this.detectFabricatedSources(content, sources),
      fabricatedDetails: this.detectFabricatedDetails(content, sources),
    };
  }

  /**
   * Detect fabricated statistics
   */
  private detectFabricatedStats(content: string, sources: Source[]): string[] {
    const fabricated: string[] = [];

    // Extract all statistics from content
    const stats = content.match(/\d+(\.\d+)?%|\d+(\.\d+)?\s*(million|billion|thousand)/gi);

    if (!stats) return fabricated;

    // Check each statistic against sources
    for (const stat of stats) {
      let foundInSources = false;

      for (const source of sources) {
        const sourceContent = JSON.stringify(source.metadata || {});
        if (sourceContent.includes(stat)) {
          foundInSources = true;
          break;
        }
      }

      if (!foundInSources) {
        fabricated.push(stat);
      }
    }

    return fabricated;
  }

  /**
   * Detect fabricated quotes
   */
  private detectFabricatedQuotes(content: string, sources: Source[]): string[] {
    const fabricated: string[] = [];

    // Extract all quoted text
    const quotes = content.match(/"[^"]+"/g);

    if (!quotes) return fabricated;

    for (const quote of quotes) {
      let foundInSources = false;

      for (const source of sources) {
        const sourceContent = JSON.stringify(source.metadata || {});
        if (sourceContent.includes(quote.replace(/"/g, ''))) {
          foundInSources = true;
          break;
        }
      }

      if (!foundInSources) {
        fabricated.push(quote);
      }
    }

    return fabricated;
  }

  /**
   * Detect fabricated source citations
   */
  private detectFabricatedSources(content: string, sources: Source[]): string[] {
    const fabricated: string[] = [];

    // Extract mentioned sources/authors
    const mentionedAuthors = content.match(/according to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);

    if (!mentionedAuthors) return fabricated;

    const sourceAuthors = new Set(
      sources.flatMap(s => s.authors || [])
    );

    for (const mention of mentionedAuthors) {
      const author = mention.replace(/according to\s+/i, '').trim();

      if (!sourceAuthors.has(author)) {
        fabricated.push(author);
      }
    }

    return fabricated;
  }

  /**
   * Detect fabricated details (names, dates, specific claims)
   */
  private detectFabricatedDetails(content: string, sources: Source[]): string[] {
    const fabricated: string[] = [];

    // Extract proper nouns (potential names, places, companies)
    const properNouns = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);

    if (!properNouns) return fabricated;

    // Build index of all terms in sources
    const sourceTerms = new Set<string>();
    sources.forEach(source => {
      const terms = [
        source.title,
        ...(source.authors || []),
        source.publication,
        JSON.stringify(source.metadata || {}),
      ].join(' ').match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);

      if (terms) {
        terms.forEach(term => sourceTerms.add(term));
      }
    });

    // Check which proper nouns don't appear in sources
    const uniqueNouns = new Set(properNouns);
    for (const noun of uniqueNouns) {
      if (!sourceTerms.has(noun) && noun.length > 3) {
        fabricated.push(noun);
      }
    }

    return fabricated.slice(0, 10); // Limit to avoid false positives
  }

  /**
   * Calculate overall hallucination risk score
   */
  calculateHallucinationRisk(checks: HallucinationCheck[]): {
    score: number; // 0-100, higher = more risk
    severity: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
  } {
    if (checks.length === 0) {
      return {
        score: 0,
        severity: 'low',
        summary: 'No potential hallucinations detected',
      };
    }

    const hallucinationCount = checks.filter(c => c.isPotentialHallucination).length;
    const totalClaims = checks.length;

    const riskPercentage = (hallucinationCount / totalClaims) * 100;

    // Adjust based on severity
    const criticalCount = checks.filter(
      c => c.isPotentialHallucination && !c.foundInSources
    ).length;

    let finalScore = riskPercentage;

    if (criticalCount > 0) {
      // Unfounded claims are most serious
      finalScore += criticalCount * 10;
    }

    finalScore = Math.min(100, finalScore);

    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (finalScore < 10) severity = 'low';
    else if (finalScore < 30) severity = 'medium';
    else if (finalScore < 60) severity = 'high';
    else severity = 'critical';

    return {
      score: finalScore,
      severity,
      summary: `${hallucinationCount} potential hallucinations detected (${riskPercentage.toFixed(1)}% of claims)`,
    };
  }

  /**
   * Generate hallucination report
   */
  generateReport(checks: HallucinationCheck[]): string {
    const risk = this.calculateHallucinationRisk(checks);

    const lines = [
      '# Hallucination Detection Report',
      '',
      `**Risk Score**: ${risk.score}/100 (${risk.severity})`,
      `**Summary**: ${risk.summary}`,
      '',
      '## Detected Issues',
      '',
    ];

    const hallucinations = checks.filter(c => c.isPotentialHallucination);

    if (hallucinations.length === 0) {
      lines.push('✅ No potential hallucinations detected. All claims are well-supported by sources.');
    } else {
      for (const check of hallucinations) {
        lines.push(`### ${check.claim.type.toUpperCase()}: "${check.claim.statement}"`);
        lines.push('');
        lines.push(`- **Issue**: ${check.reason}`);
        lines.push(`- **Recommendation**: ${check.recommendation}`);
        lines.push(`- **Found in sources**: ${check.foundInSources ? 'Yes' : 'No'}`);

        if (check.sourceExcerpts && check.sourceExcerpts.length > 0) {
          lines.push('- **Source excerpts**:');
          check.sourceExcerpts.forEach((excerpt, i) => {
            lines.push(`  ${i + 1}. "${excerpt}"`);
          });
        }

        lines.push('');
      }
    }

    return lines.join('\n');
  }
}

// Export singleton
export const hallucinationDetector = new HallucinationDetector();
