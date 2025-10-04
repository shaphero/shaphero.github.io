/**
 * Claim Extraction and Verification System
 * Extracts factual claims and verifies them against sources
 */

import type { Claim, ClaimIssue, Source, ChunkData, FactCheck } from './types.js';

export class ClaimVerifier {
  /**
   * Extract claims from generated content
   */
  extractClaims(content: string, sources: Source[]): Claim[] {
    const claims: Claim[] = [];

    // Split into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();

      const claimType = this.identifyClaimType(sentence);

      if (claimType) {
        claims.push({
          id: `claim-${i}`,
          statement: sentence,
          type: claimType,
          sources: [],
          verified: false,
          confidence: 0,
          verification: {
            supportingSources: [],
            conflictingSources: [],
            agreement: false,
            needsReview: true,
            verificationMethod: 'inference',
          },
        });
      }
    }

    return claims;
  }

  /**
   * Identify type of claim
   */
  private identifyClaimType(sentence: string): Claim['type'] | null {
    const lower = sentence.toLowerCase();

    // Statistics
    if (/\d+(\.\d+)?%/.test(sentence) || /\d+(\.\d+)?\s*(million|billion|thousand)/.test(sentence)) {
      return 'statistic';
    }

    // Direct quotes
    if (/"[^"]+"|'[^']+'/.test(sentence) || /according to|states that|said that/.test(lower)) {
      return 'quote';
    }

    // Opinions
    if (/believe|think|feel|should|ought|better|worse|best|worst/.test(lower)) {
      return 'opinion';
    }

    // Interpretations
    if (/suggests|indicates|implies|appears|seems|likely/.test(lower)) {
      return 'interpretation';
    }

    // Factual statements
    if (/is|are|was|were|has|have|had/.test(lower) && !/(may|might|could|would)/.test(lower)) {
      return 'fact';
    }

    return null;
  }

  /**
   * Verify claims against source material
   */
  async verifyClaims(
    claims: Claim[],
    sources: Source[],
    chunks: ChunkData[]
  ): Promise<Claim[]> {
    const verifiedClaims: Claim[] = [];

    for (const claim of claims) {
      const verification = await this.verifySingleClaim(claim, sources, chunks);
      verifiedClaims.push({
        ...claim,
        ...verification,
      });
    }

    return verifiedClaims;
  }

  /**
   * Verify a single claim
   */
  private async verifySingleClaim(
    claim: Claim,
    sources: Source[],
    chunks: ChunkData[]
  ): Promise<Partial<Claim>> {
    const supportingSources: Source[] = [];
    const conflictingSources: Source[] = [];
    const issues: ClaimIssue[] = [];

    // Search for claim in chunks
    const matchingChunks = this.findMatchingChunks(claim.statement, chunks);

    if (matchingChunks.length === 0) {
      // No source found - potential hallucination
      issues.push({
        type: 'unsourced',
        severity: claim.type === 'fact' || claim.type === 'statistic' ? 'critical' : 'medium',
        description: 'Claim not found in source material',
        recommendation: 'Add citation or remove claim',
      });

      return {
        verified: false,
        confidence: 0,
        issues,
        verification: {
          supportingSources: [],
          conflictingSources: [],
          agreement: false,
          needsReview: true,
          verificationMethod: 'inference',
        },
      };
    }

    // Check each matching chunk
    for (const chunk of matchingChunks) {
      const similarity = this.calculateSimilarity(claim.statement, chunk.content);

      if (similarity > 0.8) {
        // Direct match
        supportingSources.push(chunk.source);
      } else if (similarity > 0.5) {
        // Partial match - check for conflicts
        if (this.hasConflict(claim.statement, chunk.content)) {
          conflictingSources.push(chunk.source);
        } else {
          supportingSources.push(chunk.source);
        }
      }
    }

    // Determine verification status
    const verified = supportingSources.length >= 2;
    const agreement = conflictingSources.length === 0;
    const confidence = this.calculateConfidence(
      supportingSources.length,
      conflictingSources.length,
      claim.type
    );

    // Check for issues
    if (supportingSources.length < 2) {
      issues.push({
        type: 'unverified',
        severity: claim.type === 'fact' || claim.type === 'statistic' ? 'high' : 'medium',
        description: `Only ${supportingSources.length} source(s) support this claim`,
        recommendation: 'Find additional sources or qualify statement',
      });
    }

    if (conflictingSources.length > 0) {
      issues.push({
        type: 'conflicting',
        severity: 'high',
        description: `${conflictingSources.length} source(s) conflict with this claim`,
        recommendation: 'Present multiple perspectives or resolve conflict',
      });
    }

    return {
      sources: supportingSources,
      verified,
      confidence,
      issues,
      verification: {
        supportingSources,
        conflictingSources,
        agreement,
        needsReview: !verified || !agreement,
        verificationMethod: this.getVerificationMethod(matchingChunks, claim.statement),
      },
    };
  }

  /**
   * Find chunks that might contain the claim
   */
  private findMatchingChunks(claimStatement: string, chunks: ChunkData[]): ChunkData[] {
    const matching: ChunkData[] = [];

    const claimKeywords = this.extractKeywords(claimStatement);

    for (const chunk of chunks) {
      const chunkKeywords = this.extractKeywords(chunk.content);

      // Calculate keyword overlap
      const overlap = claimKeywords.filter(kw => chunkKeywords.includes(kw));

      if (overlap.length >= Math.min(3, claimKeywords.length * 0.5)) {
        matching.push(chunk);
      }
    }

    return matching;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  /**
   * Calculate similarity between claim and chunk content
   */
  private calculateSimilarity(claim: string, content: string): number {
    const claimWords = new Set(this.extractKeywords(claim));
    const contentWords = new Set(this.extractKeywords(content));

    const intersection = new Set([...claimWords].filter(w => contentWords.has(w)));
    const union = new Set([...claimWords, ...contentWords]);

    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Check if content conflicts with claim
   */
  private hasConflict(claim: string, content: string): boolean {
    // Look for negation patterns
    const claimLower = claim.toLowerCase();
    const contentLower = content.toLowerCase();

    // Extract numbers from claim
    const claimNumbers = claim.match(/\d+(\.\d+)?/g);

    if (claimNumbers) {
      // Check if content has different numbers
      const contentNumbers = content.match(/\d+(\.\d+)?/g);

      if (contentNumbers) {
        // If numbers differ significantly, might be a conflict
        for (const cn of claimNumbers) {
          const claimNum = parseFloat(cn);
          let foundSimilar = false;

          for (const ctn of contentNumbers) {
            const contentNum = parseFloat(ctn);
            // Within 10% is considered similar
            if (Math.abs(claimNum - contentNum) / claimNum < 0.1) {
              foundSimilar = true;
              break;
            }
          }

          if (!foundSimilar && contentNumbers.length > 0) {
            return true; // Numbers don't match
          }
        }
      }
    }

    // Check for explicit contradictions
    const contradictionPatterns = [
      /not|never|no|none/i,
      /incorrect|wrong|false/i,
      /contrary|opposite|conversely/i,
    ];

    for (const pattern of contradictionPatterns) {
      if (pattern.test(contentLower)) {
        // If content contains negation and talks about same topic, might be conflict
        const claimKeywords = this.extractKeywords(claim);
        const contentKeywords = this.extractKeywords(content);
        const overlap = claimKeywords.filter(kw => contentKeywords.includes(kw));

        if (overlap.length >= 2) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate confidence score for claim
   */
  private calculateConfidence(
    supportingCount: number,
    conflictingCount: number,
    claimType: Claim['type']
  ): number {
    if (conflictingCount > 0) {
      return 0; // Any conflict = no confidence
    }

    // Base confidence on number of supporting sources
    let confidence = 0;

    if (supportingCount >= 5) confidence = 100;
    else if (supportingCount >= 3) confidence = 85;
    else if (supportingCount >= 2) confidence = 70;
    else if (supportingCount >= 1) confidence = 50;

    // Adjust by claim type
    if (claimType === 'fact' || claimType === 'statistic') {
      // Facts and statistics need more sources
      confidence = Math.max(0, confidence - 15);
    } else if (claimType === 'opinion' || claimType === 'interpretation') {
      // Opinions need less verification
      confidence = Math.min(100, confidence + 10);
    }

    return confidence;
  }

  /**
   * Determine how claim was verified
   */
  private getVerificationMethod(
    chunks: ChunkData[],
    claim: string
  ): 'direct_quote' | 'paraphrase' | 'synthesis' | 'inference' {
    if (chunks.length === 0) {
      return 'inference';
    }

    // Check for direct quotes
    if (/"[^"]+"/.test(claim) || /'[^']+'/.test(claim)) {
      return 'direct_quote';
    }

    // Check if claim appears verbatim in any chunk
    for (const chunk of chunks) {
      if (chunk.content.includes(claim)) {
        return 'direct_quote';
      }

      // Check for close paraphrase
      const similarity = this.calculateSimilarity(claim, chunk.content);
      if (similarity > 0.8) {
        return 'paraphrase';
      }
    }

    // If multiple chunks support, likely synthesis
    if (chunks.length > 1) {
      return 'synthesis';
    }

    return 'inference';
  }

  /**
   * Cross-reference claims across sources
   */
  async crossReference(claims: Claim[]): Promise<FactCheck[]> {
    const factChecks: FactCheck[] = [];

    for (const claim of claims) {
      const supportingSources = claim.verification.supportingSources;
      const conflictingSources = claim.verification.conflictingSources;

      const agreement = conflictingSources.length === 0;

      let status: FactCheck['status'];
      if (supportingSources.length >= 2 && agreement) {
        status = 'verified';
      } else if (supportingSources.length >= 1 && agreement) {
        status = 'partially_verified';
      } else if (conflictingSources.length > 0) {
        status = 'conflicting';
      } else {
        status = 'unverified';
      }

      factChecks.push({
        claim: claim.statement,
        sources: supportingSources,
        agreement,
        conflictingData:
          conflictingSources.length > 0
            ? {
                source1: {
                  claim: claim.statement,
                  citation: { id: '', inlineMarker: '', source: supportingSources[0], accessDate: new Date() },
                },
                source2: {
                  claim: 'Conflicting information found',
                  citation: { id: '', inlineMarker: '', source: conflictingSources[0], accessDate: new Date() },
                },
              }
            : undefined,
        confidence: claim.confidence,
        status,
      });
    }

    return factChecks;
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(claims: Claim[]) {
    const total = claims.length;
    const verified = claims.filter(c => c.verified).length;
    const unverified = claims.filter(c => !c.verified).length;
    const hasIssues = claims.filter(c => c.issues && c.issues.length > 0).length;

    const byType: Record<string, number> = {};
    claims.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });

    const avgConfidence =
      total > 0
        ? claims.reduce((sum, c) => sum + c.confidence, 0) / total
        : 0;

    return {
      total,
      verified,
      unverified,
      hasIssues,
      byType,
      avgConfidence,
      verificationRate: total > 0 ? (verified / total) * 100 : 0,
    };
  }
}

// Export singleton
export const claimVerifier = new ClaimVerifier();
