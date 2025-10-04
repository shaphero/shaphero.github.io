/**
 * Bias Detection System
 * Identifies potential bias in sources and presentation
 */

import type { BiasCheck, Source, PerspectiveAnalysis, Perspective } from './types.js';

export class BiasDetector {
  /**
   * Detect bias in sources and content
   */
  detectBias(
    content: string,
    sources: Source[]
  ): BiasCheck[] {
    const biases: BiasCheck[] = [];

    // Check source diversity
    biases.push(...this.checkSourceDiversity(sources));

    // Check presentation bias
    biases.push(...this.checkPresentationBias(content));

    // Check selection bias
    biases.push(...this.checkSelectionBias(sources));

    // Check confirmation bias
    biases.push(...this.checkConfirmationBias(content, sources));

    return biases;
  }

  /**
   * Check for lack of source diversity
   */
  private checkSourceDiversity(sources: Source[]): BiasCheck[] {
    const biases: BiasCheck[] = [];

    // Count by source type
    const byType: Record<string, number> = {};
    sources.forEach(s => {
      byType[s.type] = (byType[s.type] || 0) + 1;
    });

    const totalSources = sources.length;

    // Check for academic sources
    const academicCount = byType['academic'] || 0;
    const academicPercentage = (academicCount / totalSources) * 100;

    if (academicPercentage < 20 && totalSources >= 5) {
      biases.push({
        type: 'selection',
        severity: 'medium',
        description: `Only ${academicPercentage.toFixed(0)}% academic sources (${academicCount}/${totalSources})`,
        mitigation: 'Add peer-reviewed research to increase credibility',
      });
    }

    // Check for single source type dominance
    for (const [type, count] of Object.entries(byType)) {
      const percentage = (count / totalSources) * 100;

      if (percentage > 70) {
        biases.push({
          type: 'selection',
          severity: 'high',
          description: `${percentage.toFixed(0)}% of sources are ${type} type`,
          affectedSources: sources.filter(s => s.type === type),
          mitigation: 'Diversify source types for balanced perspective',
        });
      }
    }

    // Check for publication diversity
    const publications = new Set(sources.map(s => s.publication).filter(p => p));

    if (publications.size === 1 && totalSources > 3) {
      biases.push({
        type: 'selection',
        severity: 'medium',
        description: 'All sources from same publication',
        mitigation: 'Include sources from different publications',
      });
    }

    return biases;
  }

  /**
   * Check for one-sided presentation
   */
  private checkPresentationBias(content: string): BiasCheck[] {
    const biases: BiasCheck[] = [];

    // Count positive vs negative sentiment
    const positiveWords = this.countWords(content, [
      'benefit', 'advantage', 'success', 'effective', 'improve',
      'better', 'best', 'excellent', 'superior', 'breakthrough',
    ]);

    const negativeWords = this.countWords(content, [
      'problem', 'disadvantage', 'failure', 'ineffective', 'worse',
      'worst', 'poor', 'inferior', 'flaw', 'limitation',
    ]);

    const total = positiveWords + negativeWords;

    if (total > 10) {
      const positiveRatio = positiveWords / total;

      if (positiveRatio > 0.8) {
        biases.push({
          type: 'presentation',
          severity: 'medium',
          description: 'Overly positive presentation - may lack critical analysis',
          mitigation: 'Include limitations and counterarguments',
        });
      } else if (positiveRatio < 0.2) {
        biases.push({
          type: 'presentation',
          severity: 'medium',
          description: 'Overly negative presentation - may lack balanced view',
          mitigation: 'Include benefits and positive aspects',
        });
      }
    }

    // Check for weasel words (vague claims)
    const weaselWords = this.countWords(content, [
      'some say', 'many believe', 'it is believed', 'studies show',
      'experts agree', 'research suggests', 'it is widely known',
    ]);

    if (weaselWords > 5) {
      biases.push({
        type: 'presentation',
        severity: 'low',
        description: `${weaselWords} instances of vague attribution ("some say", "many believe")`,
        mitigation: 'Replace with specific sources and citations',
      });
    }

    return biases;
  }

  /**
   * Check for selection bias (cherry-picking)
   */
  private checkSelectionBias(sources: Source[]): BiasCheck[] {
    const biases: BiasCheck[] = [];

    // Check date range
    const dates = sources.map(s => s.date).filter((d): d is Date => !!d);

    if (dates.length >= 3) {
      const timestamps = dates.map(d => d.getTime());
      const oldest = Math.min(...timestamps);
      const newest = Math.max(...timestamps);
      const rangeMs = newest - oldest;
      const rangeDays = rangeMs / (1000 * 60 * 60 * 24);

      // If all sources from same narrow time period, might be cherry-picked
      if (rangeDays < 30 && dates.length > 5) {
        biases.push({
          type: 'selection',
          severity: 'low',
          description: `All sources from ${rangeDays.toFixed(0)}-day period - may miss historical context`,
          mitigation: 'Include sources from broader time range',
        });
      }
    }

    // Check for conflicts of interest
    const conflictsOfInterest = sources.filter(s => s.hasConflictOfInterest);

    if (conflictsOfInterest.length > 0) {
      biases.push({
        type: 'source',
        severity: 'high',
        description: `${conflictsOfInterest.length} source(s) have potential conflicts of interest`,
        affectedSources: conflictsOfInterest,
        mitigation: 'Disclose conflicts and add independent sources',
      });
    }

    return biases;
  }

  /**
   * Check for confirmation bias
   */
  private checkConfirmationBias(content: string, sources: Source[]): BiasCheck[] {
    const biases: BiasCheck[] = [];

    // Check if content ignores contradictory evidence
    const certaintyWords = this.countWords(content, [
      'definitely', 'certainly', 'obviously', 'clearly',
      'undoubtedly', 'without doubt', 'proven fact',
    ]);

    if (certaintyWords > 3) {
      biases.push({
        type: 'confirmation',
        severity: 'medium',
        description: `${certaintyWords} instances of absolute certainty - may ignore contradictions`,
        mitigation: 'Acknowledge uncertainty and present caveats',
      });
    }

    // Check if all sources agree (unusual for complex topics)
    if (sources.length >= 5) {
      // In a real implementation, we'd analyze source conclusions
      // For now, we'll just flag if there's no mention of disagreement
      const disagreementWords = this.countWords(content, [
        'however', 'although', 'conversely', 'on the other hand',
        'alternatively', 'critics argue', 'some disagree',
      ]);

      if (disagreementWords === 0) {
        biases.push({
          type: 'confirmation',
          severity: 'low',
          description: 'No contradictory views presented - may be overly selective',
          mitigation: 'Present alternative perspectives and counterarguments',
        });
      }
    }

    return biases;
  }

  /**
   * Analyze perspectives in content
   */
  analyzePerspectives(
    topic: string,
    content: string,
    sources: Source[]
  ): PerspectiveAnalysis {
    // Detect if topic is controversial
    const controversialKeywords = [
      'debate', 'controversial', 'disagree', 'critics',
      'proponents', 'opponents', 'argue', 'dispute',
    ];

    const isControversial = controversialKeywords.some(kw =>
      content.toLowerCase().includes(kw)
    );

    // Extract perspectives (simplified)
    const perspectives: Perspective[] = [];

    // For now, group sources by their stance (would need NLP in real implementation)
    const biases = this.detectBias(content, sources);

    return {
      topic,
      isControversial,
      perspectives,
      biases,
      consensus: perspectives.length === 1 ? perspectives[0].viewpoint : undefined,
      areasOfDisagreement: isControversial ? ['Multiple viewpoints exist'] : undefined,
    };
  }

  /**
   * Helper: Count occurrences of words/phrases
   */
  private countWords(content: string, words: string[]): number {
    const contentLower = content.toLowerCase();
    let count = 0;

    for (const word of words) {
      const regex = new RegExp(word.toLowerCase(), 'g');
      const matches = contentLower.match(regex);
      count += matches ? matches.length : 0;
    }

    return count;
  }
}

// Export singleton
export const biasDetector = new BiasDetector();
