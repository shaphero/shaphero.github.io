import type { SynthesisResult, ContentSection, Citation, Insight } from './config';

export class ContentFormatter {
  async format(synthesis: SynthesisResult): Promise<SynthesisResult> {
    // Apply formatting rules
    const formatted = { ...synthesis };

    // Format sections
    formatted.sections = this.formatSections(synthesis.sections);

    // Add structure markers
    formatted.sections = this.addStructureMarkers(formatted.sections);

    return formatted;
  }

  async refine(synthesis: SynthesisResult): Promise<SynthesisResult> {
    // Quality improvements
    const refined = { ...synthesis };

    // Improve readability
    refined.sections = this.improveReadability(synthesis.sections);

    // Add transitions
    refined.sections = this.addTransitions(refined.sections);

    return refined;
  }

  toAstroComponent(synthesis: SynthesisResult): string {
    const { meta, sections, citations, insights } = synthesis;

    return `---
import PageLayout from '../layouts/PageLayout.astro';
import Section from '../components/common/Section.astro';
import Icon from '../components/Icon.astro';

const title = "${this.escapeQuotes(meta.title)}";
const description = "${this.escapeQuotes(meta.description)}";

const insights = ${JSON.stringify(insights, null, 2)};
const citations = ${JSON.stringify(citations, null, 2)};
---

<PageLayout title={title} description={description}>
  <!-- Hero Section -->
  <section class="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white">
    <div class="absolute inset-0">
      <div class="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-40 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <div class="relative z-10 container mx-auto px-4 py-24">
      <div class="max-w-5xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600/20 backdrop-blur-lg border border-purple-400/30 text-white font-semibold text-sm mb-8">
          <span class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
          <span>RESEARCH ANALYSIS</span>
        </div>

        <h1 class="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
          {title}
        </h1>

        <p class="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
          {description}
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#key-findings" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-1 transition-all">
            View Key Findings
          </a>
          <a href="#recommendations" class="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all">
            Jump to Recommendations
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Executive Summary -->
  <Section>
    <div class="max-w-4xl mx-auto">
      <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 mb-12">
        <h2 class="text-3xl font-bold mb-6">Executive Summary</h2>
        <div class="prose prose-lg max-w-none">
          <p>${this.escapeHtml(synthesis.summary)}</p>
        </div>
      </div>
    </div>
  </Section>

  <!-- Key Insights -->
  {insights.length > 0 && (
    <Section id="key-findings">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-bold text-center mb-12">Key Findings</h2>
        <div class="grid md:grid-cols-2 gap-6">
          {insights.map((insight) => (
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div class="flex items-start gap-4">
                <div class={
                  insight.type === 'trend' ? 'text-green-500' :
                  insight.type === 'risk' ? 'text-red-500' :
                  insight.type === 'opportunity' ? 'text-blue-500' :
                  'text-yellow-500'
                }>
                  <Icon name={
                    insight.type === 'trend' ? 'trending-up' :
                    insight.type === 'risk' ? 'alert-triangle' :
                    insight.type === 'opportunity' ? 'target' :
                    'info'
                  } class="w-8 h-8" />
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold mb-2">{insight.title}</h3>
                  <p class="text-gray-600 dark:text-gray-300">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )}

  <!-- Main Content Sections -->
  ${sections.map(section => this.formatSectionAstro(section)).join('\n\n')}

  <!-- Citations -->
  {citations.length > 0 && (
    <Section>
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold mb-8">Sources & References</h2>
        <div class="space-y-3">
          {citations.map((citation) => (
            <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span class="text-sm font-mono text-gray-500">[{citation.id}]</span>
              <div class="flex-1">
                <a href={citation.url} target="_blank" rel="noopener noreferrer"
                   class="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
                  {citation.text}
                </a>
                <span class="ml-2 text-sm text-gray-500">({citation.source})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )}

  <!-- CTA Section -->
  <Section>
    <div class="max-w-4xl mx-auto text-center">
      <div class="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 text-white">
        <h2 class="text-3xl font-bold mb-4">Ready to Apply These Insights?</h2>
        <p class="text-xl mb-8">Let's discuss how these findings can drive your strategy forward.</p>
        <a href="mailto:dave@daveshap.com?subject=Research%20Discussion:%20${encodeURIComponent(meta.title)}"
           class="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all">
          <Icon name="mail" class="w-5 h-5" />
          Schedule a Discussion
        </a>
      </div>
    </div>
  </Section>
</PageLayout>`;
  }

  toMarkdown(synthesis: SynthesisResult): string {
    const { meta, summary, sections, citations, insights } = synthesis;

    let markdown = `# ${meta.title}\n\n`;
    markdown += `*${meta.description}*\n\n`;
    markdown += `**Reading time:** ${meta.readingTime} minutes | `;
    markdown += `**Sources:** ${meta.sources.length}\n\n`;
    markdown += `---\n\n`;

    // Executive Summary
    markdown += `## Executive Summary\n\n${summary}\n\n`;

    // Key Insights
    if (insights.length > 0) {
      markdown += `## Key Findings\n\n`;
      insights.forEach(insight => {
        const icon = insight.type === 'trend' ? '📈' :
                    insight.type === 'risk' ? '⚠️' :
                    insight.type === 'opportunity' ? '🎯' : 'ℹ️';
        markdown += `### ${icon} ${insight.title}\n\n`;
        markdown += `${insight.description}\n\n`;
      });
    }

    // Main sections
    sections.forEach(section => {
      const prefix = '#'.repeat(section.level + 1);
      markdown += `${prefix} ${section.heading}\n\n`;
      markdown += `${section.content}\n\n`;

      if (section.evidence && section.evidence.length > 0) {
        markdown += `**Supporting Evidence:**\n`;
        section.evidence.forEach(e => {
          markdown += `- ${e.claim} (Confidence: ${e.confidence})\n`;
        });
        markdown += '\n';
      }
    });

    // Citations
    if (citations.length > 0) {
      markdown += `## References\n\n`;
      citations.forEach(cite => {
        markdown += `- [${cite.text}](${cite.url}) - ${cite.source}\n`;
      });
    }

    return markdown;
  }

  toHTML(synthesis: SynthesisResult): string {
    const { meta, summary, sections, citations, insights } = synthesis;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(meta.title)}</title>
    <meta name="description" content="${this.escapeHtml(meta.description)}">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        h1, h2, h3 { color: #1a1a1a; }
        h1 { border-bottom: 2px solid #6b46c1; padding-bottom: 0.5rem; }
        .meta { color: #666; margin-bottom: 2rem; }
        .insight {
            background: #f5f3ff;
            border-left: 4px solid #6b46c1;
            padding: 1rem;
            margin: 1rem 0;
        }
        .citation {
            background: #f9f9f9;
            padding: 0.5rem;
            margin: 0.5rem 0;
        }
        a { color: #6b46c1; }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(meta.title)}</h1>
    <div class="meta">
        <em>${this.escapeHtml(meta.description)}</em><br>
        Reading time: ${meta.readingTime} minutes | Sources: ${meta.sources.length}
    </div>

    <h2>Executive Summary</h2>
    <p>${this.escapeHtml(summary)}</p>

    ${insights.length > 0 ? `
    <h2>Key Findings</h2>
    ${insights.map(insight => `
        <div class="insight">
            <strong>${this.escapeHtml(insight.title)}</strong><br>
            ${this.escapeHtml(insight.description)}
        </div>
    `).join('')}
    ` : ''}

    ${sections.map(section => `
        <h${section.level + 1}>${this.escapeHtml(section.heading)}</h${section.level + 1}>
        <p>${this.escapeHtml(section.content)}</p>
    `).join('')}

    ${citations.length > 0 ? `
    <h2>References</h2>
    ${citations.map(cite => `
        <div class="citation">
            <a href="${cite.url}" target="_blank">${this.escapeHtml(cite.text)}</a>
            (${cite.source})
        </div>
    `).join('')}
    ` : ''}
</body>
</html>`;
  }

  private formatSections(sections: ContentSection[]): ContentSection[] {
    return sections.map(section => ({
      ...section,
      content: this.formatContent(section.content)
    }));
  }

  private formatContent(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private addStructureMarkers(sections: ContentSection[]): ContentSection[] {
    return sections;
  }

  private improveReadability(sections: ContentSection[]): ContentSection[] {
    return sections.map(section => ({
      ...section,
      content: this.improveSentenceStructure(section.content)
    }));
  }

  private improveSentenceStructure(content: string): string {
    // Split into sentences and ensure variety
    return content;
  }

  private addTransitions(sections: ContentSection[]): ContentSection[] {
    // Add transitional phrases between sections
    return sections;
  }

  private formatSectionAstro(section: ContentSection): string {
    return `  <Section>
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold mb-6">${this.escapeHtml(section.heading)}</h2>
      <div class="prose prose-lg max-w-none">
        <p>${this.escapeHtml(section.content)}</p>
        ${section.evidence ? `
        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 class="font-semibold mb-3">Supporting Evidence:</h3>
          <ul>
            ${section.evidence.map(e => `
            <li>${this.escapeHtml(e.claim)} <span class="text-sm text-gray-600">(Confidence: ${e.confidence}%)</span></li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    </div>
  </Section>`;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  private escapeQuotes(text: string): string {
    return text.replace(/"/g, '\\"').replace(/'/g, "\\'");
  }
}