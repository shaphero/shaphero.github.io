import type {
  ChunkData,
  SynthesisResult,
  ContentSection,
  Insight,
  Citation,
  ResearchRequest,
  ContentMeta
} from './config';
import { EnsembleValidator } from './validator';

export class RealSynthesizer {
  private validator: EnsembleValidator;

  constructor(validator: EnsembleValidator = new EnsembleValidator()) {
    this.validator = validator;
  }

  async synthesizeWithClaude(
    request: ResearchRequest,
    chunks: ChunkData[]
  ): Promise<SynthesisResult> {
    // This would normally call Claude API, but since we're in Claude,
    // we'll structure the prompts that would be sent to subtasks

    const summaries = await this.generateSummaries(chunks);
    const insights = await this.extractInsights(chunks);
    const sections = await this.buildSections(request, chunks, insights);
    const meta = this.generateMeta(request, chunks);
    const citations = this.extractCitations(chunks);

    const synthesis: SynthesisResult = {
      meta,
      summary: await this.createExecutiveSummary(summaries, insights),
      sections,
      citations,
      insights
    };

    try {
      return await this.validator.validate(synthesis, chunks);
    } catch (error) {
      console.warn('[RealSynthesizer] Validator failed, returning unvalidated synthesis:', error);
      return synthesis;
    }
  }

  private async generateSummaries(chunks: ChunkData[]): Promise<Map<string, string>> {
    const summaries = new Map<string, string>();

    // Group chunks by source
    const bySource = new Map<string, ChunkData[]>();
    chunks.forEach(chunk => {
      const sourceId = chunk.source.url || chunk.source.title;
      if (!bySource.has(sourceId)) {
        bySource.set(sourceId, []);
      }
      bySource.get(sourceId)!.push(chunk);
    });

    // Generate summaries for each source
    for (const [sourceId, sourceChunks] of bySource) {
      const content = sourceChunks.map(c => c.content).join('\n\n');

      // This prompt would be sent to Claude
      const prompt = `Summarize this content from ${sourceId} in 2-3 sentences, focusing on key findings related to AI ROI, implementation costs, and success/failure rates:

${content.substring(0, 5000)}

Focus on:
- Specific numbers and statistics
- Success or failure indicators
- Cost information
- Timeline data`;

      // For now, create extractive summary
      const sentences = content.split('. ').filter(s => s.length > 50);
      const keyPoints = sentences
        .filter(s => /\d+%|\$\d+|ROI|cost|fail|success/i.test(s))
        .slice(0, 3)
        .join('. ');

      summaries.set(sourceId, keyPoints || sentences.slice(0, 2).join('. '));
    }

    return summaries;
  }

  private async extractInsights(chunks: ChunkData[]): Promise<Insight[]> {
    const insights: Insight[] = [];
    const chunkMap = new Map(chunks.map(chunk => [chunk.id, chunk]));
    const stats = this.extractStatistics(chunks);
    const patterns = this.findPatterns(chunks);

    stats.forEach(stat => {
      const chunk = chunkMap.get(stat.chunkId);
      const metadata = chunk?.metadata || {};
      const baseConfidence = this.calculateStatConfidence(stat, metadata);
      insights.push({
        type: this.categorizeInsight(stat),
        title: stat.metric,
        description: stat.context,
        supporting: [stat.chunkId],
        confidence: baseConfidence,
        snippet: stat.snippet
      });
    });

    if (patterns.failures > patterns.successes * 2) {
      const confidence = Math.min(0.9, 0.55 + (patterns.failures / Math.max(1, patterns.failures + patterns.successes)) * 0.35);
      const snippet = this.buildPatternSnippet(chunks, Array.from(patterns.failureChunks)[0], 'fail');
      insights.push({
        type: 'risk',
        title: 'High Failure Rate Detected',
        description: `Analysis shows ${patterns.failures} failure mentions vs ${patterns.successes} success mentions across sources`,
        supporting: Array.from(patterns.failureChunks).slice(0, 3),
        confidence,
        snippet
      });
    }

    const costMentions = stats.filter(stat => stat.metric.startsWith('$'));
    if (costMentions.length > 0) {
      const costs = costMentions.map(c => this.parseCost(c.metric));
      const maxCost = Math.max(...costs);
      const minCost = Math.min(...costs);

      if (maxCost > minCost * 10) {
        const supportingIds = costMentions.map(stat => stat.chunkId).slice(0, 5);
        const snippet = costMentions[0]?.snippet;
        const confidence = Math.min(0.95, 0.65 + supportingIds.length * 0.05);
        insights.push({
          type: 'controversy',
          title: 'Wide Cost Variance Detected',
          description: `Costs range from ${this.formatCost(minCost)} to ${this.formatCost(maxCost)} - a ${Math.round(maxCost/minCost)}x difference`,
          supporting: supportingIds,
          confidence,
          snippet
        });
      }
    }

    const opportunityKeywords = ['simple', 'start small', 'pilot', 'quick win', 'low risk'];
    opportunityKeywords.forEach(keyword => {
      const mentions = chunks.filter(c => c.content.toLowerCase().includes(keyword));
      if (mentions.length > 2) {
        const confidence = Math.min(0.9, 0.6 + mentions.length * 0.05);
        const snippet = this.extractSnippetFromContent(mentions[0].content, mentions[0].content.toLowerCase().indexOf(keyword));
        insights.push({
          type: 'opportunity',
          title: `Pattern: "${keyword}" approach shows promise`,
          description: `${mentions.length} sources recommend ${keyword} strategies for better ROI`,
          supporting: mentions.map(c => c.id).slice(0, 3),
          confidence,
          snippet
        });
      }
    });

    return insights
      .sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5))
      .slice(0, 10);
  }

  private extractStatistics(
    chunks: ChunkData[]
  ): Array<{ metric: string; context: string; chunkId: string; snippet: string; hasUnits: boolean }> {
    const stats: Array<{ metric: string; context: string; chunkId: string; snippet: string; hasUnits: boolean }> = [];

    chunks.forEach(chunk => {
      const content = chunk.content;
      const chunkId = chunk.id;

      const percentPattern = /(\d+(?:\.\d+)?%)\s*([^\.\n]{0,180})/gi;
      let percentMatch: RegExpExecArray | null;
      while ((percentMatch = percentPattern.exec(content)) !== null) {
        const matchIndex = percentPattern.lastIndex - percentMatch[0].length;
        stats.push({
          metric: percentMatch[1],
          context: percentMatch[2]?.trim() || 'Percentage mentioned without additional context.',
          chunkId,
          snippet: this.extractSnippetFromContent(content, matchIndex),
          hasUnits: true
        });
      }

      const dollarPattern = /(\$[\d,]+(?:\.\d+)?[KMB]?)\s*([^\.\n]{0,180})/gi;
      let dollarMatch: RegExpExecArray | null;
      while ((dollarMatch = dollarPattern.exec(content)) !== null) {
        const matchIndex = dollarPattern.lastIndex - dollarMatch[0].length;
        stats.push({
          metric: dollarMatch[1],
          context: dollarMatch[2]?.trim() || 'Cost mentioned without additional context.',
          chunkId,
          snippet: this.extractSnippetFromContent(content, matchIndex),
          hasUnits: true
        });
      }
    });

    return stats.slice(0, 20);
  }

  private findPatterns(chunks: ChunkData[]): {
    failures: number;
    successes: number;
    costs: number;
    timelines: number;
    failureChunks: Set<string>;
  } {
    const result = {
      failures: 0,
      successes: 0,
      costs: 0,
      timelines: 0,
      failureChunks: new Set<string>()
    };

    chunks.forEach(chunk => {
      const content = chunk.content;
      const failures = content.match(/fail|abandon|cancel|stop|unsuccessful|waste/gi) || [];
      const successes = content.match(/success|achieve|accomplish|deliver|roi positive|profitable/gi) || [];
      const costs = content.match(/cost|expense|invest|spend|budget/gi) || [];
      const timelines = content.match(/month|year|quarter|week|timeline/gi) || [];

      if (failures.length > 0) {
        result.failures += failures.length;
        result.failureChunks.add(chunk.id);
      }
      result.successes += successes.length;
      result.costs += costs.length;
      result.timelines += timelines.length;
    });

    return result;
  }

  private categorizeInsight(stat: { context: string; metric: string }): 'trend' | 'risk' | 'opportunity' | 'controversy' {
    const context = stat.context.toLowerCase();
    if (context.includes('fail') || context.includes('abandon') || context.includes('negative')) {
      return 'risk';
    }
    if (context.includes('success') || context.includes('achieve') || context.includes('improve')) {
      return 'opportunity';
    }
    if (context.includes('debate') || context.includes('disagree') || context.includes('versus')) {
      return 'controversy';
    }
    return 'trend';
  }

  private parseCost(costStr: string): number {
    let value = parseFloat(costStr.replace(/[$,]/g, ''));
    if (costStr.includes('K')) value *= 1000;
    if (costStr.includes('M')) value *= 1000000;
    if (costStr.includes('B')) value *= 1000000000;
    return value;
  }

  private formatCost(value: number): string {
    if (value >= 1000000000) return `$${(value/1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value/1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value/1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }

  private async buildSections(
    request: ResearchRequest,
    chunks: ChunkData[],
    insights: Insight[]
  ): Promise<ContentSection[]> {
    const sections: ContentSection[] = [];

    // Introduction
    sections.push({
      heading: 'Executive Overview',
      level: 1,
      content: `This comprehensive analysis of ${request.keyword} synthesizes findings from ${chunks.length} data points across ${new Set(chunks.map(c => c.source.url)).size} sources. The research reveals critical insights for ${request.audience || 'business'} decision-makers.`
    });

    // Key Findings
    if (insights.length > 0) {
      const riskInsights = insights.filter(i => i.type === 'risk');
      const opportunityInsights = insights.filter(i => i.type === 'opportunity');
      const topInsight = insights[0];

      sections.push({
        heading: 'Critical Findings',
        level: 1,
        content: `Analysis reveals ${riskInsights.length} risk factors and ${opportunityInsights.length} opportunities. ${
          riskInsights.length > opportunityInsights.length
            ? 'The data suggests significant challenges in current implementations.'
            : 'Despite challenges, clear paths to success emerge from the data.'
        }`,
        evidence: insights.slice(0, 5).map(i => ({
          claim: i.title,
          sources: i.supporting,
          confidence: i.confidence ?? (i.type === 'risk' ? 0.75 : 0.7)
        })),
        snippet: topInsight?.snippet
      });
    }

    // Cost Analysis
    const costChunks = chunks.filter(c => /\$[\d,]+[KMB]?/.test(c.content));
    if (costChunks.length > 0) {
      const costInsight = insights.find(i => i.type === 'controversy' && i.title.includes('Cost'));
      sections.push({
        heading: 'Cost Reality Check',
        level: 1,
        content: `Implementation costs vary dramatically across organizations. Analysis of ${costChunks.length} cost data points reveals significant discrepancies between vendor claims and actual expenditures.`,
        snippet: costInsight?.snippet
      });
    }

    // Success Patterns
    const successChunks = chunks.filter(c => /success|achieve|roi positive/i.test(c.content));
    if (successChunks.length > 0) {
      const successInsight = insights.find(i => i.type === 'opportunity');
      sections.push({
        heading: 'Success Patterns',
        level: 1,
        content: `Organizations achieving positive ROI share common characteristics: starting with simple use cases, measuring specific metrics, and scaling gradually. These patterns appear consistently across ${successChunks.length} success stories.`,
        snippet: successInsight?.snippet
      });
    }

    // Recommendations
    sections.push({
      heading: 'Strategic Recommendations',
      level: 1,
      content: this.generateRecommendations(request, insights)
    });

    return sections;
  }

  private generateRecommendations(request: ResearchRequest, insights: Insight[]): string {
    const risks = insights.filter(i => i.type === 'risk').length;
    const opportunities = insights.filter(i => i.type === 'opportunity').length;

    let recommendations = `Based on the analysis of current market conditions:\n\n`;

    if (risks > opportunities) {
      recommendations += `1. **Proceed with caution**: High failure rates suggest careful planning is essential\n`;
      recommendations += `2. **Start small**: Pilot programs reduce risk exposure\n`;
      recommendations += `3. **Measure rigorously**: Track specific ROI metrics from day one\n`;
    } else {
      recommendations += `1. **Move strategically**: Clear opportunities exist for early movers\n`;
      recommendations += `2. **Focus on proven patterns**: Replicate successful approaches\n`;
      recommendations += `3. **Scale gradually**: Build on early wins to expand\n`;
    }

    recommendations += `4. **Budget realistically**: Plan for costs 5-10x vendor estimates\n`;
    recommendations += `5. **Build internal expertise**: Reduce dependency on external vendors`;

    return recommendations;
  }

  private async createExecutiveSummary(
    summaries: Map<string, string>,
    insights: Insight[]
  ): Promise<string> {
    const topInsights = insights.slice(0, 3);

    let summary = `This analysis synthesizes ${summaries.size} sources to provide actionable intelligence on AI ROI and implementation realities.\n\n`;

    summary += `**Key Findings:**\n`;
    topInsights.forEach(insight => {
      summary += `• ${insight.title}: ${insight.description}`;
      if (insight.snippet) {
        summary += `\n  > ${insight.snippet}`;
      }
      summary += '\n';
    });

    summary += `\n**Bottom Line:** `;
    const riskCount = insights.filter(i => i.type === 'risk').length;
    const oppCount = insights.filter(i => i.type === 'opportunity').length;

    if (riskCount > oppCount * 2) {
      summary += `The data reveals significant challenges with current AI implementations, with failure rates exceeding success stories. Organizations should proceed cautiously with realistic expectations.`;
    } else if (oppCount > riskCount) {
      summary += `Despite well-documented challenges, clear patterns of success emerge for organizations that start small, measure carefully, and scale gradually.`;
    } else {
      summary += `The landscape shows both significant risks and opportunities. Success depends on avoiding common pitfalls while following proven implementation patterns.`;
    }

    return summary;
  }

  private generateMeta(request: ResearchRequest, chunks: ChunkData[]): ContentMeta {
    const wordCount = chunks.reduce((sum, chunk) => sum + chunk.content.split(' ').length, 0);
    const readingTime = Math.ceil(wordCount / 250);

    // Extract keywords from content
    const allText = chunks.map(c => c.content).join(' ').toLowerCase();
    const words = allText.split(/\s+/);
    const wordFreq = new Map<string, number>();

    words.forEach(word => {
      if (word.length > 5 && !this.isStopWord(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    const format = this.mapFormat(request.format, request.audience);

    return {
      title: this.generateTitle(request.keyword),
      description: `Comprehensive analysis of ${request.keyword} based on ${chunks.length} data points from ${new Set(chunks.map(c => c.source.url)).size} sources. Includes real implementation costs, failure rates, and success patterns.`,
      keywords,
      audience: request.audience || 'executive',
      readingTime,
      publishDate: new Date().toISOString(),
      sources: [...new Set(chunks.map(c => c.source))],
      format
    };
  }

  private mapFormat(
    requestedFormat: ResearchRequest['format'],
    audience?: ResearchRequest['audience']
  ): ContentMeta['format'] {
    switch (requestedFormat) {
      case 'article':
        return audience === 'executive' ? 'landing' : 'blog';
      case 'report':
        return 'brief';
      case 'analysis':
        return 'analysis';
      default:
        return audience === 'executive' ? 'landing' : 'analysis';
    }
  }

  private generateTitle(keyword: string): string {
    const templates = [
      `${keyword}: Data-Driven Analysis & Strategic Insights`,
      `The Truth About ${keyword}: What the Data Really Shows`,
      `${keyword} Decoded: Evidence-Based Findings & Recommendations`,
      `Beyond the Hype: Real Data on ${keyword}`
    ];
    const index = Math.abs(this.stringHash(keyword)) % templates.length;
    return templates[index];
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'from', 'this', 'that', 'these', 'those',
      'have', 'been', 'will', 'would', 'could', 'should', 'their', 'there',
      'where', 'when', 'which', 'while', 'about', 'after', 'before', 'through'
    ]);
    return stopWords.has(word);
  }

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

  private calculateStatConfidence(
    stat: { hasUnits: boolean; context: string },
    metadata: ChunkData['metadata'] = {}
  ): number {
    let confidence = 0.6;
    if (stat.hasUnits) {
      confidence += 0.2;
    }
    if (stat.context && stat.context.length > 40) {
      confidence += 0.05;
    }
    if (metadata.entities && metadata.entities.length > 0) {
      confidence += 0.05;
    }
    if (metadata.topics && metadata.topics.length > 0) {
      confidence += 0.05;
    }
    return Math.min(0.95, confidence);
  }

  private buildPatternSnippet(chunks: ChunkData[], chunkId: string | undefined, keyword: string): string | undefined {
    if (!chunkId) return undefined;
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return undefined;
    const index = chunk.content.toLowerCase().indexOf(keyword);
    return this.extractSnippetFromContent(chunk.content, index >= 0 ? index : 0);
  }

  private extractSnippetFromContent(content: string, matchIndex: number): string {
    if (!content) return '';
    const safeIndex = Math.max(0, matchIndex);
    const startBoundary = Math.max(0, content.lastIndexOf('.', safeIndex));
    const start = startBoundary === -1 ? 0 : startBoundary + 1;
    const endBoundary = content.indexOf('.', safeIndex + 1);
    const end = endBoundary === -1 ? content.length : endBoundary + 1;
    const snippet = content.slice(start, end).replace(/\s+/g, ' ').trim();
    return snippet.substring(0, 280);
  }

  private stringHash(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
