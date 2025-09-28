import type {
  ChunkData,
  ContentSection,
  Insight,
  ReviewNote,
  SynthesisResult
} from './config';
import {
  ClaudeCliReviewer,
  OpenAIReviewer,
  type LLMReviewer,
  type LLMReviewResult
} from './llm-clients';

interface ValidationTarget {
  kind: 'insight' | 'section';
  id: string;
  claim: string;
  snippet: string;
  context?: string;
}

export class EnsembleValidator {
  private reviewers: LLMReviewer[];

  constructor(reviewers: LLMReviewer[] = [new ClaudeCliReviewer(), new OpenAIReviewer()]) {
    this.reviewers = reviewers;
  }

  async validate(synthesis: SynthesisResult, chunks: ChunkData[]): Promise<SynthesisResult> {
    const chunkMap = new Map(chunks.map(chunk => [chunk.id, chunk]));
    const targets = this.collectTargets(synthesis, chunkMap);

    if (targets.length === 0 || this.reviewers.length === 0) {
      return synthesis;
    }

    const reviewResults = await this.reviewTargets(targets);

    const updatedInsights = synthesis.insights.map(insight => {
      const key = `insight:${insight.title}`;
      const result = reviewResults.get(key);
      if (!result) return insight;
      const updatedConfidence = this.mergeConfidence(insight.confidence ?? 0.6, result.aggregateScore, result.conflicted);
      const reviewNotes: ReviewNote[] = result.notes;
      return {
        ...insight,
        confidence: updatedConfidence,
        reviewNotes
      };
    });

    const updatedSections = synthesis.sections.map(section => {
      const key = `section:${section.heading}`;
      const result = reviewResults.get(key);
      if (!result) return section;
      const reviewNotes: ReviewNote[] = result.notes;
      return {
        ...section,
        reviewNotes
      };
    });

    return {
      ...synthesis,
      sections: updatedSections,
      insights: updatedInsights
    };
  }

  private collectTargets(
    synthesis: SynthesisResult,
    chunkMap: Map<string, ChunkData>
  ): ValidationTarget[] {
    const targets: ValidationTarget[] = [];

    synthesis.insights.forEach(insight => {
      const supportingChunk = insight.supporting
        .map(id => chunkMap.get(id))
        .find(Boolean);
      const snippet = insight.snippet || supportingChunk?.content?.slice(0, 400) || '';
      if (!snippet) return;
      targets.push({
        kind: 'insight',
        id: insight.title,
        claim: insight.description || insight.title,
        snippet,
        context: supportingChunk?.content
      });
    });

    synthesis.sections.forEach(section => {
      const snippet = section.snippet || section.content.slice(0, 400);
      if (!snippet) return;
      targets.push({
        kind: 'section',
        id: section.heading,
        claim: section.content,
        snippet,
        context: snippet
      });
    });

    return targets;
  }

  private async reviewTargets(targets: ValidationTarget[]): Promise<Map<string, { notes: ReviewNote[]; aggregateScore: number }>> {
    const results = new Map<string, { notes: ReviewNote[]; aggregateScore: number; conflicted: boolean }>();

    for (const target of targets) {
      const notes: ReviewNote[] = [];
      let aggregateScore = 0;
      let reviewersResponded = 0;
      let hasFlagged = false;
      let statuses = new Set<LLMReviewResult['status']>();

      for (const reviewer of this.reviewers) {
        const response = await reviewer.review({
          claim: target.claim,
          evidence: target.snippet,
          context: target.context
        });

        if (!response) continue;
        reviewersResponded += 1;
        aggregateScore += this.score(response.status);
        statuses.add(response.status);
        if (response.status === 'flagged') {
          hasFlagged = true;
        }
        notes.push({
          reviewer: reviewer.name,
          status: response.status,
          explanation: response.explanation
        });
      }

      if (reviewersResponded > 0) {
        const key = `${target.kind}:${target.id}`;
        const average = aggregateScore / reviewersResponded;
        const conflicted = statuses.has('flagged') && statuses.has('supported');
        results.set(key, {
          notes,
          aggregateScore: hasFlagged ? Math.min(average, 0.25) : average,
          conflicted
        });
      }
    }

    return results;
  }

  private score(status: LLMReviewResult['status']): number {
    switch (status) {
      case 'supported':
        return 1;
      case 'unclear':
        return 0.25;
      case 'flagged':
      default:
        return 0;
    }
  }

  private mergeConfidence(existing: number, aggregateScore: number, conflicted: boolean): number {
    if (conflicted) {
      return Math.min(existing, 0.4);
    }

    const delta = aggregateScore - 0.5;
    if (delta > 0) {
      const boosted = existing + Math.min(delta, 0.15);
      return Math.min(0.95, boosted);
    }
    const reduced = Math.min(existing, aggregateScore);
    return Math.max(0.15, reduced);
  }
}
