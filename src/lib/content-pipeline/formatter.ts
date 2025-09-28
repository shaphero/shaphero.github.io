import type { SynthesisResult, ContentSection, Citation, Insight, ContentMeta } from './config';

export class ContentFormatter {
  async format(synthesis: SynthesisResult): Promise<SynthesisResult> {
    // Apply formatting rules
    const formatted = { ...synthesis };

    // Format sections
    formatted.sections = this.formatSections(synthesis.sections);

    // Add structure markers
    formatted.sections = this.addStructureMarkers(formatted.sections);

    // Recompute reading time from output text (not raw chunks)
    try {
      const text = [formatted.summary, ...formatted.sections.map(s => [s.heading, s.content, s.snippet].filter(Boolean).join(' '))]
        .filter(Boolean)
        .join(' ');
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(words / 250));
      if (formatted.meta) {
        formatted.meta = { ...formatted.meta, readingTime: minutes } as ContentMeta;
      }
    } catch {
      // ignore recompute errors, keep existing readingTime
    }

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
    const template = this.selectTemplate(meta.format);

    this.runLint(meta, sections, insights);

    return `---
import ${template.importName} from '${template.importPath}';

const meta = ${JSON.stringify(meta, null, 2)};
const sections = ${JSON.stringify(sections, null, 2)};
const insights = ${JSON.stringify(insights, null, 2)};
const citations = ${JSON.stringify(citations, null, 2)};
const summary = ${JSON.stringify(synthesis.summary)};
---

<${template.component}
  meta={meta}
  sections={sections}
  insights={insights}
  citations={citations}
  summary={summary}
/>
`;
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
        if (insight.snippet) {
          markdown += `> ${insight.snippet}\n\n`;
        }
        markdown += `Confidence: ${Math.round((insight.confidence ?? 0.6) * 100)}%\n\n`;
      });
    }

    // Main sections
    sections.forEach(section => {
      const prefix = '#'.repeat(section.level + 1);
      markdown += `${prefix} ${section.heading}\n\n`;
      markdown += `${section.content}\n\n`;

      if (section.snippet) {
        markdown += `> ${section.snippet}\n\n`;
      }

      if (section.evidence && section.evidence.length > 0) {
        markdown += `**Supporting Evidence:**\n`;
        section.evidence.forEach(e => {
          markdown += `- ${e.claim} (Confidence: ${Math.round((e.confidence ?? 0.6) * 100)}%)\n`;
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
            ${this.escapeHtml(insight.description)}<br>
            <span>Confidence: ${Math.round((insight.confidence ?? 0.6) * 100)}%</span>
            ${insight.snippet ? `<blockquote>${this.escapeHtml(insight.snippet)}</blockquote>` : ''}
        </div>
    `).join('')}
    ` : ''}

    ${sections.map(section => `
        <h${section.level + 1}>${this.escapeHtml(section.heading)}</h${section.level + 1}>
        <p>${this.escapeHtml(section.content)}</p>
        ${section.snippet ? `<blockquote>${this.escapeHtml(section.snippet)}</blockquote>` : ''}
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

  private selectTemplate(format: ContentMeta['format'] = 'analysis'): {
    importName: string;
    importPath: string;
    component: string;
  } {
    switch (format) {
      case 'landing':
        return {
          importName: 'LandingPageTemplate',
          importPath: '../components/content-templates/LandingPageTemplate.astro',
          component: 'LandingPageTemplate'
        };
      case 'blog':
        return {
          importName: 'BlogPostTemplate',
          importPath: '../components/content-templates/BlogPostTemplate.astro',
          component: 'BlogPostTemplate'
        };
      case 'brief':
      case 'analysis':
      default:
        return {
          importName: 'ResearchBriefTemplate',
          importPath: '../components/content-templates/ResearchBriefTemplate.astro',
          component: 'ResearchBriefTemplate'
        };
    }
  }

  private runLint(meta: ContentMeta, sections: ContentSection[], insights: Insight[]): void {
    const warnings: string[] = [];

    if (!meta.title || meta.title.length < 10) {
      warnings.push('Meta title is short; consider expanding for SEO.');
    }
    if (!meta.description || meta.description.length < 60) {
      warnings.push('Meta description is missing or under 60 characters.');
    }
    if (!sections.length) {
      warnings.push('No content sections generated.');
    }
    sections.forEach((section, index) => {
      if (!section.heading) {
        warnings.push(`Section ${index + 1} is missing a heading.`);
      }
      if (!section.content || section.content.length < 40) {
        warnings.push(`Section "${section.heading || index + 1}" has minimal content.`);
      }
    });
    insights.forEach(insight => {
      if (!insight.snippet) {
        warnings.push(`Insight "${insight.title}" is missing a supporting snippet.`);
      }
      if (!insight.confidence) {
        warnings.push(`Insight "${insight.title}" is missing a confidence score.`);
      }
    });

    if (warnings.length > 0) {
      console.warn('[ContentFormatter] Lint warnings for generated Astro output:', warnings);
    }
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
}
