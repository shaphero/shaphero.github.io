import type {
  ChunkData,
  SynthesisResult,
  ContentSection,
  Insight,
  Citation,
  ResearchRequest,
  ContentMeta
} from './config';
import { claudeCode } from './claude-code-client';

/**
 * Synthesizer that uses Claude Code CLI as the AI backend
 * Works with your existing Claude Max Pro subscription
 */
export class ClaudeCodeSynthesizer {

  /**
   * Main synthesis pipeline using Claude Code
   */
  async synthesize(
    request: ResearchRequest,
    chunks: ChunkData[]
  ): Promise<SynthesisResult> {
    console.log('🎯 Starting Claude Code synthesis...');

    // Group chunks by source for summarization
    const bySource = this.groupChunksBySource(chunks);

    // Phase 0: Build citation map
    const { citations, chunkCitationMap, sourceCitationMap } = this.extractCitations(chunks);

    // Phase 1: Summarize each source
    const summaries = await this.summarizeSources(bySource, sourceCitationMap);

    // Phase 2: Extract insights and patterns
    const insights = await this.extractInsights(chunks, summaries, sourceCitationMap, chunkCitationMap);

    // Phase 3: Build narrative sections
    const sections = await this.buildNarrative(request, summaries, insights, sourceCitationMap);

    // Phase 4: Generate executive summary
    const executiveSummary = await this.createExecutiveSummary(insights, sections);

    // Build final result
    const meta = this.generateMeta(request, chunks);

    return {
      meta,
      summary: executiveSummary,
      sections,
      citations,
      insights
    };
  }

  /**
   * Phase 1: Summarize each source using Claude
   */
  private async summarizeSources(
    sourceChunks: Map<string, ChunkData[]>,
    sourceCitationMap: Map<string, string>
  ): Promise<Map<string, any>> {
    const summaries = new Map<string, any>();

    // Limit number of sources to summarize for speed
    const MAX_SOURCES = 8;
    const entries = Array.from(sourceChunks.entries()).slice(0, MAX_SOURCES);

    for (const [sourceId, chunks] of entries) {
      const content = chunks.map(c => c.content).join('\n\n');
      const citationId = sourceCitationMap.get(sourceId);

      // Smart truncation at semantic boundaries
      const truncatedContent = this.smartTruncate(content, 6000);

      const prompt = `You are a research assistant analyzing sources about AI implementation and ROI.

Source citation ID: ${citationId ?? 'unknown'}

Summarize the provided CONTENT (read from stdin) focusing on:
1. Implementation costs (specific numbers)
2. ROI metrics and timelines
3. Success and failure rates
4. Key challenges mentioned
5. Best practices or recommendations

Output as JSON with structure:
{
  "summary": "2-3 sentence overview",
  "key_stats": [{"metric": "X%", "context": "description"}],
  "costs": ["specific cost mentions"],
  "timeline": "implementation timeline if mentioned",
  "challenges": ["main challenges"],
  "recommendations": ["key recommendations"]
}`;

      try {
        const result = await claudeCode.queryWithInput(truncatedContent, prompt, { useJson: true, model: 'haiku' });
        const enriched = { ...result, citationId };
        summaries.set(sourceId, enriched);
        console.log(`✅ Summarized source: ${sourceId.substring(0, 50)}...`);
      } catch (error) {
        console.error(`Failed to summarize ${sourceId}:`, error);
        // Fallback to basic extraction
        const fallback = this.basicSummarize(content);
        summaries.set(sourceId, { ...fallback, citationId });
      }
    }

    return summaries;
  }

  /**
   * Phase 2: Extract insights using Claude
   */
  private async extractInsights(
    chunks: ChunkData[],
    summaries: Map<string, any>,
    sourceCitationMap: Map<string, string>,
    chunkCitationMap: Map<string, string>
  ): Promise<Insight[]> {
    // Prepare insight extraction prompt
    const summaryTexts = Array.from(summaries.values())
      .map(s => s.summary || '')
      .join('\n---\n');

    const keyStats = Array.from(summaries.values())
      .flatMap(s => s.key_stats || [])
      .slice(0, 30);

    const citationSummaries = Array.from(summaries.entries())
      .map(([sourceId, summary]) => ({
        citationId: summary.citationId || sourceCitationMap.get(sourceId),
        summary: summary.summary,
        key_stats: summary.key_stats,
        challenges: summary.challenges,
        recommendations: summary.recommendations
      }))
      .filter(item => item.citationId);

    const prompt = `You are analyzing research about AI implementation. Extract key insights from these summaries.

Identify:
1. TRENDS: Emerging patterns across sources
2. RISKS: Common failure points or warnings
3. OPPORTUNITIES: Success factors and best practices
4. CONTROVERSIES: Conflicting information between sources

Output as JSON array of insights:
[
  {
    "type": "trend|risk|opportunity|controversy",
    "title": "Brief title",
    "description": "1-2 sentence description",
    "confidence": 0.1-1.0,
    "evidence": ["supporting facts"],
    "referenceIds": ["cite_1", "cite_2"]
  }
]

Summaries:
${summaryTexts}

Key Statistics Found:
${JSON.stringify(keyStats, null, 2)}

Available citations with summaries:
${JSON.stringify(citationSummaries.slice(0, 20), null, 2)}

Rules:
- Use ONLY the citationIds provided above when referencing evidence.
- Every insight MUST include referenceIds with valid citationIds (e.g., "cite_3").
- When referencing multiple sources, include each citationId once.

Extract 5-10 most important insights.`;

    try {
      const result = await claudeCode.query(prompt, { useJson: true, model: 'haiku' });

      // Ensure we have an array
      const rawInsights = result.insights || result;
      const insightArray = Array.isArray(rawInsights) ? rawInsights : [];

      // Convert to Insight type
      const insights: Insight[] = insightArray.map((i: any) => {
        const baseSupporting = Array.isArray(i.supporting) ? i.supporting : Array.isArray(i.evidence) ? i.evidence : [];
        const supportingRefs = baseSupporting
          .map((value: any) => {
            if (typeof value !== 'string') return null;
            const trimmed = value.trim();
            if (chunkCitationMap.has(trimmed)) return chunkCitationMap.get(trimmed)!;
            if (sourceCitationMap.has(trimmed)) return sourceCitationMap.get(trimmed)!;
            if (/^cite_\d+$/i.test(trimmed)) return trimmed.toLowerCase();
            return null;
          })
          .filter((v): v is string => Boolean(v));

        const refIds = this.normalizeReferenceIds(
          i.referenceIds || i.citationIds || i.citations || baseSupporting,
          sourceCitationMap
        );

        const referenceIds = this.uniqueIds([...refIds, ...supportingRefs]);

        return {
          type: i.type as any,
          title: i.title,
          description: i.description,
          supporting: Array.isArray(i.supporting) ? i.supporting : [],
          conflicting: i.conflicting,
          confidence: typeof i.confidence === 'number' ? i.confidence : undefined,
          snippet: i.snippet,
          referenceIds
        } as Insight;
      });

      console.log(`✅ Extracted ${insights.length} insights`);
      return insights;
    } catch (error) {
      console.error('Failed to extract insights:', error);
      return this.basicInsightExtraction(summaries);
    }
  }

  /**
   * Phase 3: Build narrative sections using Claude
   */
  private async buildNarrative(
    request: ResearchRequest,
    summaries: Map<string, any>,
    insights: Insight[],
    sourceCitationMap: Map<string, string>
  ): Promise<ContentSection[]> {
    const summaryData = Array.from(summaries.values());
    const citationSummaries = summaryData
      .map(summary => ({
        citationId: summary.citationId,
        summary: summary.summary,
        key_stats: summary.key_stats,
        challenges: summary.challenges,
        recommendations: summary.recommendations
      }))
      .filter(item => item.citationId);

    const prompt = `You are writing a professional research report about ${request.keyword}.

Create detailed sections for a ${request.audience || 'executive'} audience:

1. Current State Analysis
2. Cost Reality Check
3. Implementation Timelines
4. Success Patterns
5. Common Failures
6. Strategic Recommendations

Use data from the research to support each section.

Available citations:
${JSON.stringify(citationSummaries.slice(0, 20), null, 2)}

Output as JSON:
[
  {
    "heading": "Section Title",
    "level": 1,
    "content": "Detailed paragraph(s) with specific data points",
    "referenceIds": ["cite_1", "cite_2"],
    "evidence": [
      {
        "claim": "specific claim",
        "citationIds": ["cite_1"]
      }
    ]
  }
]

Research Summary:
${JSON.stringify(summaryData.slice(0, 10), null, 2)}

Key Insights:
${JSON.stringify(insights, null, 2)}

Rules:
- Use ONLY the provided citationIds when referencing sources.
- Each section MUST include a referenceIds array.
- If providing evidence items, include citationIds for each entry.

Write 5-6 detailed sections using specific numbers and examples from the research.`;

    try {
      const result = await claudeCode.query(prompt, {
        useJson: true,
        model: 'sonnet'
      });

      // Ensure we have an array
      const rawSections = result.sections || result;
      const sectionArray = Array.isArray(rawSections) ? rawSections : [];

      const sections = sectionArray.map((s: any) => ({
        heading: s.heading,
        level: s.level || 1,
        content: s.content,
        evidence: this.attachCitationIdsToEvidence(s.evidence, sourceCitationMap),
        referenceIds: this.normalizeReferenceIds(
          s.referenceIds || s.citationIds || s.citations,
          sourceCitationMap
        )
      }));

      console.log(`✅ Generated ${sections.length} narrative sections`);
      return sections;
    } catch (error) {
      console.error('Failed to build narrative:', error);
      return this.basicNarrativeBuilder(request, insights);
    }
  }

  /**
   * Phase 4: Create executive summary using Claude
   */
  private async createExecutiveSummary(
    insights: Insight[],
    sections: ContentSection[]
  ): Promise<string> {
    const topInsights = insights.slice(0, 5);
    const sectionSummaries = sections.map(s => `${s.heading}: ${s.content.substring(0, 200)}...`);

    const prompt = `Write an executive summary for a research report on AI implementation.

Key Insights:
${topInsights.map(i => `- ${i.title}: ${i.description}`).join('\n')}

Section Overviews:
${sectionSummaries.join('\n')}

Write a 3-4 paragraph executive summary that:
1. Opens with the most important finding
2. Summarizes the key data points
3. Highlights critical risks and opportunities
4. Ends with a clear bottom-line conclusion

Make it compelling and data-driven.`;

    try {
      const result = await claudeCode.query(prompt, { useJson: false, model: 'sonnet' });
      console.log('✅ Generated executive summary');
      return result;
    } catch (error) {
      console.error('Failed to create executive summary:', error);
      return this.basicExecutiveSummary(insights);
    }
  }

  /**
   * Group chunks by source for easier processing
   */
  private groupChunksBySource(chunks: ChunkData[]): Map<string, ChunkData[]> {
    const bySource = new Map<string, ChunkData[]>();

    chunks.forEach(chunk => {
      const sourceId = chunk.source.url || chunk.source.title;
      if (!bySource.has(sourceId)) {
        bySource.set(sourceId, []);
      }
      bySource.get(sourceId)!.push(chunk);
    });

    return bySource;
  }

  /**
   * Extract citations from chunks
   */
  private extractCitations(chunks: ChunkData[]): {
    citations: Citation[];
    chunkCitationMap: Map<string, string>;
    sourceCitationMap: Map<string, string>;
  } {
    const citations: Citation[] = [];
    const seen = new Map<string, string>();
    const chunkCitationMap = new Map<string, string>();
    const sourceCitationMap = new Map<string, string>();

    chunks.forEach(chunk => {
      const source = chunk.source;
      const sourceId = source.url || source.title;

      if (!seen.has(sourceId)) {
        const citationId = `cite_${seen.size + 1}`;
        seen.set(sourceId, citationId);
        sourceCitationMap.set(sourceId, citationId);
        citations.push({
          id: citationId,
          text: source.title,
          url: source.url,
          source: source.type
        });
      }

      const citationId = seen.get(sourceId)!;
      chunkCitationMap.set(chunk.id, citationId);
    });

    return { citations, chunkCitationMap, sourceCitationMap };
  }

  /**
   * Generate metadata
   * Note: readingTime will be recalculated by formatter based on final output
   */
  private generateMeta(request: ResearchRequest, chunks: ChunkData[]): ContentMeta {
    return {
      title: `${request.keyword}: Research Analysis`,
      description: `Comprehensive analysis based on ${chunks.length} data points`,
      keywords: request.keyword.split(' '),
      audience: request.audience || 'executive',
      readingTime: 1, // Placeholder - will be recalculated by formatter from final output
      publishDate: new Date().toISOString(),
      sources: [...new Set(chunks.map(c => c.source))]
    };
  }

  /**
   * Simplified citation normalization
   * Ensures all references use cite_N format and exist in the citation map
   */
  private normalizeReferenceIds(
    value: any,
    sourceCitationMap: Map<string, string>
  ): string[] {
    if (!value) return [];

    const items = Array.isArray(value) ? value : [value];
    const validCitationIds = new Set(sourceCitationMap.values());
    const result: string[] = [];

    for (const item of items) {
      if (typeof item !== 'string') continue;

      const trimmed = item.trim().toLowerCase();
      if (!trimmed) continue;

      // Check if it's already a valid cite_N format
      if (/^cite_\d+$/.test(trimmed) && validCitationIds.has(trimmed)) {
        result.push(trimmed);
      }
    }

    return this.uniqueIds(result);
  }

  private attachCitationIdsToEvidence(
    evidence: any,
    sourceCitationMap: Map<string, string>
  ): any[] | undefined {
    if (!Array.isArray(evidence)) {
      return undefined;
    }

    return evidence.map(item => {
      const citationIds = this.normalizeReferenceIds(
        item?.citationIds || item?.referenceIds || item?.sources,
        sourceCitationMap
      );
      return {
        ...item,
        citationIds
      };
    });
  }

  private uniqueIds(ids: string[]): string[] {
    return Array.from(new Set(ids));
  }

  // Fallback methods for when Claude Code is unavailable

  private basicSummarize(content: string): any {
    const sentences = content.split('.').slice(0, 3);
    return {
      summary: sentences.join('.'),
      key_stats: [],
      costs: [],
      timeline: '',
      challenges: [],
      recommendations: []
    };
  }

  private basicInsightExtraction(summaries: Map<string, any>): Insight[] {
    const insights: Insight[] = [];

    // Extract basic patterns
    summaries.forEach((summary, source) => {
      if (summary.key_stats && summary.key_stats.length > 0) {
        insights.push({
          type: 'trend',
          title: 'Key Statistic',
          description: summary.key_stats[0]?.context || 'Data point from research',
          supporting: [source],
          referenceIds: summary.citationId ? [summary.citationId] : []
        });
      }
    });

    return insights.slice(0, 5);
  }

  private basicNarrativeBuilder(request: ResearchRequest, insights: Insight[]): ContentSection[] {
    return [
      {
        heading: 'Overview',
        level: 1,
        content: `Analysis of ${request.keyword} based on comprehensive research.`,
        referenceIds: insights.flatMap(i => i.referenceIds || []).slice(0, 3)
      },
      {
        heading: 'Key Findings',
        level: 1,
        content: insights.map(i => `${i.title}: ${i.description}`).join(' '),
        referenceIds: insights.flatMap(i => i.referenceIds || []).slice(0, 5)
      },
      {
        heading: 'Recommendations',
        level: 1,
        content: 'Based on the analysis, organizations should consider a phased approach to implementation.',
        referenceIds: insights.flatMap(i => i.referenceIds || []).slice(0, 3)
      }
    ];
  }

  private basicExecutiveSummary(insights: Insight[]): string {
    const top = insights.slice(0, 4);
    const bullets = top.map(i => `- ${i.title}: ${i.description}`).join('\n');
    const opening = `This research analyzes current trends and patterns in enterprise AI ROI.`;
    const middle = top.length ? `Key findings:\n${bullets}` : `Key findings: Diverse results across sources with both opportunities and risks.`;
    const close = `Bottom line: Organizations should align initiatives to measurable business outcomes, start narrow, and scale as ROI is proven.`;
    return `${opening}\n\n${middle}\n\n${close}`;
  }

  /**
   * Smart truncation at semantic boundaries
   * Prefers to cut at paragraph, sentence, or word boundaries rather than mid-word
   */
  private smartTruncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to find a paragraph boundary within last 10% of limit
    const paragraphWindow = maxLength - Math.floor(maxLength * 0.1);
    const paragraphBreak = text.lastIndexOf('\n\n', maxLength);
    if (paragraphBreak >= paragraphWindow) {
      return text.substring(0, paragraphBreak).trim();
    }

    // Try to find a sentence boundary
    const sentenceWindow = maxLength - Math.floor(maxLength * 0.05);
    const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    let bestSentenceEnd = -1;
    for (const ending of sentenceEndings) {
      const pos = text.lastIndexOf(ending, maxLength);
      if (pos >= sentenceWindow && pos > bestSentenceEnd) {
        bestSentenceEnd = pos;
      }
    }
    if (bestSentenceEnd >= sentenceWindow) {
      return text.substring(0, bestSentenceEnd + 1).trim();
    }

    // Fall back to word boundary
    const wordBoundary = text.lastIndexOf(' ', maxLength);
    if (wordBoundary > maxLength - 50) {
      return text.substring(0, wordBoundary).trim();
    }

    // Last resort: hard truncate with ellipsis
    return text.substring(0, maxLength - 3).trim() + '...';
  }
}
