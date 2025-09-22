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

    // Phase 1: Summarize each source
    const summaries = await this.summarizeSources(bySource);

    // Phase 2: Extract insights and patterns
    const insights = await this.extractInsights(chunks, summaries);

    // Phase 3: Build narrative sections
    const sections = await this.buildNarrative(request, summaries, insights);

    // Phase 4: Generate executive summary
    const executiveSummary = await this.createExecutiveSummary(insights, sections);

    // Phase 5: Extract citations
    const citations = this.extractCitations(chunks);

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
    sourceChunks: Map<string, ChunkData[]>
  ): Promise<Map<string, any>> {
    const summaries = new Map<string, any>();

    for (const [sourceId, chunks] of sourceChunks) {
      const content = chunks.map(c => c.content).join('\n\n');

      // Limit content length to avoid token limits
      const truncatedContent = content.substring(0, 15000);

      const prompt = `You are a research assistant analyzing sources about AI implementation and ROI.

Summarize the following content focusing on:
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
}

Content from ${sourceId}:
${truncatedContent}`;

      try {
        const result = await claudeCode.query(prompt, { useJson: true });
        summaries.set(sourceId, result);
        console.log(`✅ Summarized source: ${sourceId.substring(0, 50)}...`);
      } catch (error) {
        console.error(`Failed to summarize ${sourceId}:`, error);
        // Fallback to basic extraction
        summaries.set(sourceId, this.basicSummarize(content));
      }
    }

    return summaries;
  }

  /**
   * Phase 2: Extract insights using Claude
   */
  private async extractInsights(
    chunks: ChunkData[],
    summaries: Map<string, any>
  ): Promise<Insight[]> {
    // Prepare insight extraction prompt
    const summaryTexts = Array.from(summaries.values())
      .map(s => s.summary || '')
      .join('\n---\n');

    const keyStats = Array.from(summaries.values())
      .flatMap(s => s.key_stats || [])
      .slice(0, 30);

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
    "evidence": ["supporting facts"]
  }
]

Summaries:
${summaryTexts}

Key Statistics Found:
${JSON.stringify(keyStats, null, 2)}

Extract 5-10 most important insights.`;

    try {
      const result = await claudeCode.query(prompt, { useJson: true });

      // Convert to Insight type
      const insights: Insight[] = (result.insights || result || []).map((i: any) => ({
        type: i.type as any,
        title: i.title,
        description: i.description,
        supporting: i.evidence || [],
        conflicting: i.conflicting
      }));

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
    insights: Insight[]
  ): Promise<ContentSection[]> {
    const summaryData = Array.from(summaries.values());

    const prompt = `You are writing a professional research report about ${request.keyword}.

Create detailed sections for a ${request.audience || 'executive'} audience:

1. Current State Analysis
2. Cost Reality Check
3. Implementation Timelines
4. Success Patterns
5. Common Failures
6. Strategic Recommendations

Use data from the research to support each section.

Output as JSON:
[
  {
    "heading": "Section Title",
    "level": 1,
    "content": "Detailed paragraph(s) with specific data points"
  }
]

Research Summary:
${JSON.stringify(summaryData.slice(0, 10), null, 2)}

Key Insights:
${JSON.stringify(insights, null, 2)}

Write 5-6 detailed sections using specific numbers and examples from the research.`;

    try {
      const result = await claudeCode.query(prompt, {
        useJson: true,
        maxTokens: 4000
      });

      const sections = (result.sections || result || []).map((s: any) => ({
        heading: s.heading,
        level: s.level || 1,
        content: s.content,
        evidence: s.evidence
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
      const result = await claudeCode.query(prompt, { useJson: false });
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
  private extractCitations(chunks: ChunkData[]): Citation[] {
    const citations: Citation[] = [];
    const seen = new Set<string>();

    chunks.forEach((chunk, index) => {
      const source = chunk.source;
      const id = source.url || source.title;

      if (!seen.has(id)) {
        seen.add(id);
        citations.push({
          id: `cite_${index + 1}`,
          text: source.title,
          url: source.url,
          source: source.type
        });
      }
    });

    return citations;
  }

  /**
   * Generate metadata
   */
  private generateMeta(request: ResearchRequest, chunks: ChunkData[]): ContentMeta {
    const wordCount = chunks.reduce((sum, chunk) => sum + chunk.content.split(' ').length, 0);
    const readingTime = Math.ceil(wordCount / 250);

    return {
      title: `${request.keyword}: Research Analysis`,
      description: `Comprehensive analysis based on ${chunks.length} data points`,
      keywords: request.keyword.split(' '),
      audience: request.audience || 'executive',
      readingTime,
      publishDate: new Date().toISOString(),
      sources: [...new Set(chunks.map(c => c.source))]
    };
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
          supporting: [source]
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
        content: `Analysis of ${request.keyword} based on comprehensive research.`
      },
      {
        heading: 'Key Findings',
        level: 1,
        content: insights.map(i => `${i.title}: ${i.description}`).join(' ')
      },
      {
        heading: 'Recommendations',
        level: 1,
        content: 'Based on the analysis, organizations should consider a phased approach to implementation.'
      }
    ];
  }

  private basicExecutiveSummary(insights: Insight[]): string {
    return `This research analyzes current trends and patterns. Key findings include: ${
      insights.slice(0, 3).map(i => i.title).join(', ')
    }. The analysis reveals both opportunities and challenges for organizations considering implementation.`;
  }
}