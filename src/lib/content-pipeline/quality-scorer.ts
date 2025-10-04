/**
 * Quality Scoring System
 * Evaluates overall quality of generated content
 */

import type {
  QualityScore,
  QualityIssue,
  Source,
  Claim,
  Citation,
  HallucinationCheck,
  BiasCheck,
} from './types.js';

export class QualityScorer {
  /**
   * Calculate comprehensive quality score
   */
  calculateScore(data: {
    sources: Source[];
    claims: Claim[];
    citations: Citation[];
    hallucinationChecks: HallucinationCheck[];
    biasChecks: BiasCheck[];
    learningObjectives?: any[];
    wordCount?: number;
  }): QualityScore {
    const {
      sources,
      claims,
      citations,
      hallucinationChecks,
      biasChecks,
      learningObjectives = [],
      wordCount = 0,
    } = data;

    // Calculate individual scores
    const breakdown = {
      sourceCredibility: this.scoreSourceCredibility(sources),
      citationCoverage: this.scoreCitationCoverage(claims, citations),
      factVerification: this.scoreFactVerification(claims),
      conceptClarity: this.scoreConceptClarity(wordCount, learningObjectives.length),
      perspectiveDiversity: this.scorePerspectiveDiversity(sources, biasChecks),
      currency: this.scoreCurrency(sources),
      educationalValue: this.scoreEducationalValue(learningObjectives, claims.length),
    };

    // Overall score (weighted average)
    const weights = {
      sourceCredibility: 0.20,
      citationCoverage: 0.20,
      factVerification: 0.20,
      conceptClarity: 0.10,
      perspectiveDiversity: 0.10,
      currency: 0.10,
      educationalValue: 0.10,
    };

    const overall =
      breakdown.sourceCredibility * weights.sourceCredibility +
      breakdown.citationCoverage * weights.citationCoverage +
      breakdown.factVerification * weights.factVerification +
      breakdown.conceptClarity * weights.conceptClarity +
      breakdown.perspectiveDiversity * weights.perspectiveDiversity +
      breakdown.currency * weights.currency +
      breakdown.educationalValue * weights.educationalValue;

    // Collect issues
    const issues = this.collectIssues(data, breakdown);

    // Ready to publish if score >= 80 and no critical issues
    const readyToPublish =
      overall >= 80 &&
      !issues.some(i => i.severity === 'critical');

    // Generate recommendations
    const recommendations = this.generateRecommendations(breakdown, issues);

    return {
      overall: Math.round(overall),
      breakdown,
      issues,
      readyToPublish,
      recommendations,
    };
  }

  /**
   * Score source credibility (0-100)
   */
  private scoreSourceCredibility(sources: Source[]): number {
    if (sources.length === 0) return 0;

    const avgCredibility =
      sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length;

    return avgCredibility;
  }

  /**
   * Score citation coverage (0-100)
   */
  private scoreCitationCoverage(claims: Claim[], citations: Citation[]): number {
    if (claims.length === 0) return 100; // No claims = no problem

    const claimsRequiringCitation = claims.filter(
      c => c.type === 'fact' || c.type === 'statistic' || c.type === 'quote'
    );

    if (claimsRequiringCitation.length === 0) return 100;

    const citedClaims = claimsRequiringCitation.filter(
      c => c.sources.length > 0
    );

    return (citedClaims.length / claimsRequiringCitation.length) * 100;
  }

  /**
   * Score fact verification (0-100)
   */
  private scoreFactVerification(claims: Claim[]): number {
    if (claims.length === 0) return 100;

    const verifiedClaims = claims.filter(c => c.verified);

    return (verifiedClaims.length / claims.length) * 100;
  }

  /**
   * Score concept clarity (0-100)
   */
  private scoreConceptClarity(wordCount: number, conceptCount: number): number {
    let score = 100;

    // Penalize if too few words
    if (wordCount < 500) {
      score -= 20;
    }

    // Penalize if no concepts explained
    if (conceptCount === 0) {
      score -= 30;
    }

    // Bonus for good concept coverage
    if (conceptCount >= 3) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score perspective diversity (0-100)
   */
  private scorePerspectiveDiversity(sources: Source[], biasChecks: BiasCheck[]): number {
    // Start at 100, deduct for bias issues
    let score = 100;

    // Deduct for bias severity
    for (const bias of biasChecks) {
      if (bias.severity === 'high') {
        score -= 25;
      } else if (bias.severity === 'medium') {
        score -= 15;
      } else {
        score -= 5;
      }
    }

    // Bonus for source type diversity
    const sourceTypes = new Set(sources.map(s => s.type));

    if (sourceTypes.size >= 3) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score currency (how recent are sources) (0-100)
   */
  private scoreCurrency(sources: Source[]): number {
    if (sources.length === 0) return 0;

    const now = Date.now();
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const twoYearsAgo = now - 730 * 24 * 60 * 60 * 1000;

    const recentSources = sources.filter(s => {
      if (!s.date) return false;
      return s.date.getTime() >= sixMonthsAgo;
    });

    const moderatelySources = sources.filter(s => {
      if (!s.date) return false;
      return s.date.getTime() >= oneYearAgo && s.date.getTime() < sixMonthsAgo;
    });

    const olderSources = sources.filter(s => {
      if (!s.date) return false;
      return s.date.getTime() >= twoYearsAgo && s.date.getTime() < oneYearAgo;
    });

    // Weight: recent sources count more
    const score =
      (recentSources.length * 100 +
        moderatelySources.length * 70 +
        olderSources.length * 40) /
      sources.length;

    return Math.min(100, score);
  }

  /**
   * Score educational value (0-100)
   */
  private scoreEducationalValue(learningObjectivesCount: number, claimCount: number): number {
    let score = 0;

    // Has learning objectives
    if (learningObjectivesCount > 0) {
      score += 40;

      // Bonus for good coverage
      if (learningObjectivesCount >= 3) {
        score += 20;
      }
    }

    // Has substantial content (claims)
    if (claimCount >= 10) {
      score += 30;
    } else if (claimCount >= 5) {
      score += 20;
    } else if (claimCount >= 2) {
      score += 10;
    }

    // Bonus for good ratio of objectives to content
    if (learningObjectivesCount > 0 && claimCount > 0) {
      const ratio = claimCount / learningObjectivesCount;
      if (ratio >= 3 && ratio <= 10) {
        score += 10; // Good depth per objective
      }
    }

    return Math.min(100, score);
  }

  /**
   * Collect all quality issues
   */
  private collectIssues(
    data: {
      sources: Source[];
      claims: Claim[];
      citations: Citation[];
      hallucinationChecks: HallucinationCheck[];
      biasChecks: BiasCheck[];
    },
    breakdown: QualityScore['breakdown']
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Source credibility issues
    if (breakdown.sourceCredibility < 60) {
      issues.push({
        type: 'citation',
        severity: 'high',
        description: `Low average source credibility (${breakdown.sourceCredibility.toFixed(0)}/100)`,
        recommendation: 'Add more authoritative sources (academic papers, official docs)',
      });
    }

    // Citation coverage issues
    if (breakdown.citationCoverage < 80) {
      issues.push({
        type: 'citation',
        severity: 'high',
        description: `Only ${breakdown.citationCoverage.toFixed(0)}% of claims are cited`,
        recommendation: 'Add citations for all factual claims and statistics',
      });
    }

    // Fact verification issues
    if (breakdown.factVerification < 70) {
      issues.push({
        type: 'verification',
        severity: 'critical',
        description: `Only ${breakdown.factVerification.toFixed(0)}% of claims are verified`,
        recommendation: 'Find additional sources to verify claims or remove unverified claims',
      });
    }

    // Hallucination issues
    const hallucinations = data.hallucinationChecks.filter(h => h.isPotentialHallucination);
    if (hallucinations.length > 0) {
      issues.push({
        type: 'verification',
        severity: 'critical',
        description: `${hallucinations.length} potential hallucinations detected`,
        recommendation: 'Review and remove AI-generated content not found in sources',
      });
    }

    // Bias issues
    const highBias = data.biasChecks.filter(b => b.severity === 'high');
    if (highBias.length > 0) {
      issues.push({
        type: 'bias',
        severity: 'high',
        description: `${highBias.length} high-severity bias issue(s) detected`,
        recommendation: 'Address bias by adding diverse sources and perspectives',
      });
    }

    // Currency issues
    if (breakdown.currency < 50) {
      issues.push({
        type: 'currency',
        severity: 'medium',
        description: 'Many sources are outdated',
        recommendation: 'Add recent sources (within last 6-12 months)',
      });
    }

    // Educational value issues
    if (breakdown.educationalValue < 50) {
      issues.push({
        type: 'structure',
        severity: 'medium',
        description: 'Limited educational value',
        recommendation: 'Add learning objectives, examples, and clear explanations',
      });
    }

    return issues;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    breakdown: QualityScore['breakdown'],
    issues: QualityIssue[]
  ): string[] {
    const recommendations: string[] = [];

    // Prioritize critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push('🚨 Address critical issues before publishing');
      criticalIssues.forEach(issue => {
        recommendations.push(`  - ${issue.recommendation}`);
      });
    }

    // High priority improvements
    if (breakdown.sourceCredibility < 70) {
      recommendations.push('Add 2-3 academic or authoritative sources');
    }

    if (breakdown.citationCoverage < 90) {
      recommendations.push('Cite all factual claims and statistics');
    }

    if (breakdown.factVerification < 80) {
      recommendations.push('Cross-reference key claims with multiple sources');
    }

    if (breakdown.perspectiveDiversity < 70) {
      recommendations.push('Include alternative perspectives and counterarguments');
    }

    if (breakdown.educationalValue < 70) {
      recommendations.push('Add learning objectives and practical examples');
    }

    return recommendations;
  }

  /**
   * Generate quality report
   */
  generateReport(score: QualityScore): string {
    const lines = [
      '# Content Quality Report',
      '',
      `**Overall Score**: ${score.overall}/100 ${score.readyToPublish ? '✅ Ready to Publish' : '⚠️ Needs Improvement'}`,
      '',
      '## Breakdown',
      '',
      `- **Source Credibility**: ${score.breakdown.sourceCredibility.toFixed(0)}/100`,
      `- **Citation Coverage**: ${score.breakdown.citationCoverage.toFixed(0)}/100`,
      `- **Fact Verification**: ${score.breakdown.factVerification.toFixed(0)}/100`,
      `- **Concept Clarity**: ${score.breakdown.conceptClarity.toFixed(0)}/100`,
      `- **Perspective Diversity**: ${score.breakdown.perspectiveDiversity.toFixed(0)}/100`,
      `- **Currency**: ${score.breakdown.currency.toFixed(0)}/100`,
      `- **Educational Value**: ${score.breakdown.educationalValue.toFixed(0)}/100`,
      '',
    ];

    if (score.issues.length > 0) {
      lines.push('## Issues');
      lines.push('');

      const critical = score.issues.filter(i => i.severity === 'critical');
      const high = score.issues.filter(i => i.severity === 'high');
      const medium = score.issues.filter(i => i.severity === 'medium');
      const low = score.issues.filter(i => i.severity === 'low');

      if (critical.length > 0) {
        lines.push('### Critical Issues');
        critical.forEach(issue => {
          lines.push(`- ${issue.description}`);
          lines.push(`  **Recommendation**: ${issue.recommendation}`);
        });
        lines.push('');
      }

      if (high.length > 0) {
        lines.push('### High Priority');
        high.forEach(issue => {
          lines.push(`- ${issue.description}`);
        });
        lines.push('');
      }

      if (medium.length > 0) {
        lines.push('### Medium Priority');
        medium.forEach(issue => {
          lines.push(`- ${issue.description}`);
        });
        lines.push('');
      }
    } else {
      lines.push('✅ No quality issues detected!');
      lines.push('');
    }

    if (score.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      score.recommendations.forEach(rec => {
        lines.push(`- ${rec}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}

// Export singleton
export const qualityScorer = new QualityScorer();
