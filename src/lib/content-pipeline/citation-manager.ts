/**
 * Citation Management System
 * Manages inline citations and bibliography generation
 */

import type { Citation, Source, CitationManager } from './types.js';

export class CitationManagerImpl implements CitationManager {
  citations: Map<string, Citation> = new Map();
  nextNumber: number = 1;

  /**
   * Add a citation for a source
   */
  addCitation(source: Source, quotedText?: string, pageNumber?: string): Citation {
    // Check if citation for this source already exists
    const existing = Array.from(this.citations.values()).find(
      c => c.source.id === source.id && c.quotedText === quotedText
    );

    if (existing) {
      return existing;
    }

    const citation: Citation = {
      id: `cite-${this.nextNumber}`,
      inlineMarker: `[${this.nextNumber}]`,
      source,
      quotedText,
      pageNumber,
      accessDate: new Date(),
    };

    this.citations.set(citation.id, citation);
    this.nextNumber++;

    return citation;
  }

  /**
   * Get citation by ID
   */
  getCitation(id: string): Citation | undefined {
    return this.citations.get(id);
  }

  /**
   * Generate inline citation marker
   */
  generateInlineCitation(citationId: string): string {
    const citation = this.citations.get(citationId);
    return citation ? citation.inlineMarker : '';
  }

  /**
   * Format bibliography in specified style
   */
  formatBibliography(style: 'apa' | 'mla' | 'chicago' = 'apa'): string {
    const citations = Array.from(this.citations.values()).sort((a, b) => {
      const aNum = parseInt(a.inlineMarker.replace(/\[|\]/g, ''));
      const bNum = parseInt(b.inlineMarker.replace(/\[|\]/g, ''));
      return aNum - bNum;
    });

    const lines = ['## References\n'];

    for (const citation of citations) {
      const formatted = this.formatCitation(citation, style);
      lines.push(`${citation.inlineMarker} ${formatted}\n`);
    }

    return lines.join('\n');
  }

  /**
   * Format a single citation
   */
  private formatCitation(citation: Citation, style: 'apa' | 'mla' | 'chicago'): string {
    switch (style) {
      case 'apa':
        return this.formatAPA(citation);
      case 'mla':
        return this.formatMLA(citation);
      case 'chicago':
        return this.formatChicago(citation);
      default:
        return this.formatAPA(citation);
    }
  }

  /**
   * Format in APA style
   */
  private formatAPA(citation: Citation): string {
    const { source } = citation;

    let formatted = '';

    // Authors
    if (source.authors && source.authors.length > 0) {
      if (source.authors.length === 1) {
        formatted += `${source.authors[0]}`;
      } else if (source.authors.length === 2) {
        formatted += `${source.authors[0]} & ${source.authors[1]}`;
      } else {
        formatted += `${source.authors[0]} et al.`;
      }
      formatted += '. ';
    }

    // Date
    const year = source.date ? source.date.getFullYear() : 'n.d.';
    formatted += `(${year}). `;

    // Title
    formatted += source.title;

    // For academic papers
    if (source.type === 'academic' && source.publication) {
      formatted += `. *${source.publication}*`;
    }

    // For web sources
    if (source.type !== 'academic') {
      formatted += `. `;
      if (source.publication) {
        formatted += `*${source.publication}*. `;
      }
    }

    // DOI or URL
    if (source.doi) {
      formatted += `. https://doi.org/${source.doi}`;
    } else if (source.url) {
      formatted += `. Retrieved from ${source.url}`;
    }

    return formatted;
  }

  /**
   * Format in MLA style
   */
  private formatMLA(citation: Citation): string {
    const { source } = citation;

    let formatted = '';

    // Authors (Last, First)
    if (source.authors && source.authors.length > 0) {
      const firstAuthor = source.authors[0];
      const parts = firstAuthor.split(' ');
      if (parts.length >= 2) {
        formatted += `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
      } else {
        formatted += firstAuthor;
      }

      if (source.authors.length > 1) {
        formatted += ', et al';
      }
      formatted += '. ';
    }

    // Title
    formatted += `"${source.title}." `;

    // Publication
    if (source.publication) {
      formatted += `*${source.publication}*, `;
    }

    // Date
    if (source.date) {
      formatted += `${source.date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    }

    // URL
    if (source.url) {
      formatted += `. ${source.url}`;
    }

    return formatted;
  }

  /**
   * Format in Chicago style
   */
  private formatChicago(citation: Citation): string {
    const { source } = citation;

    let formatted = '';

    // Authors
    if (source.authors && source.authors.length > 0) {
      formatted += source.authors.join(', ');
      formatted += '. ';
    }

    // Title
    formatted += `"${source.title}." `;

    // Publication
    if (source.publication) {
      formatted += `*${source.publication}* `;
    }

    // Date
    if (source.date) {
      formatted += `(${source.date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}): `;
    }

    // URL
    if (source.url) {
      formatted += source.url;
    }

    return formatted;
  }

  /**
   * Insert citations into content
   */
  insertCitations(content: string, claimCitations: Map<string, string[]>): string {
    let citedContent = content;

    for (const [claimText, citationIds] of claimCitations.entries()) {
      const markers = citationIds
        .map(id => this.generateInlineCitation(id))
        .join('');

      // Replace claim with cited version
      citedContent = citedContent.replace(claimText, `${claimText}${markers}`);
    }

    return citedContent;
  }

  /**
   * Get citation statistics
   */
  getStats() {
    const citations = Array.from(this.citations.values());

    const byType: Record<string, number> = {};
    citations.forEach(c => {
      byType[c.source.type] = (byType[c.source.type] || 0) + 1;
    });

    const withDOI = citations.filter(c => c.source.doi).length;
    const withQuotes = citations.filter(c => c.quotedText).length;

    return {
      total: citations.length,
      byType,
      withDOI,
      withQuotes,
      avgCredibility:
        citations.reduce((sum, c) => sum + c.source.credibilityScore, 0) /
        citations.length,
    };
  }

  /**
   * Export citations in BibTeX format
   */
  exportBibTeX(): string {
    const entries: string[] = [];

    for (const citation of this.citations.values()) {
      const entry = this.formatBibTeX(citation);
      entries.push(entry);
    }

    return entries.join('\n\n');
  }

  /**
   * Format single citation in BibTeX
   */
  private formatBibTeX(citation: Citation): string {
    const { source } = citation;
    const id = source.id.replace(/[^a-zA-Z0-9]/g, '');

    const type = source.type === 'academic' ? 'article' : 'misc';

    const fields: string[] = [];

    if (source.authors && source.authors.length > 0) {
      fields.push(`  author = {${source.authors.join(' and ')}}`);
    }

    fields.push(`  title = {${source.title}}`);

    if (source.publication) {
      fields.push(`  journal = {${source.publication}}`);
    }

    if (source.date) {
      fields.push(`  year = {${source.date.getFullYear()}}`);
    }

    if (source.doi) {
      fields.push(`  doi = {${source.doi}}`);
    } else if (source.url) {
      fields.push(`  url = {${source.url}}`);
    }

    return `@${type}{${id},\n${fields.join(',\n')}\n}`;
  }

  /**
   * Clear all citations
   */
  clear(): void {
    this.citations.clear();
    this.nextNumber = 1;
  }

  /**
   * Merge citations from another manager
   */
  merge(other: CitationManagerImpl): void {
    for (const [id, citation] of other.citations.entries()) {
      if (!this.citations.has(id)) {
        // Renumber to avoid conflicts
        const newCitation = {
          ...citation,
          id: `cite-${this.nextNumber}`,
          inlineMarker: `[${this.nextNumber}]`,
        };
        this.citations.set(newCitation.id, newCitation);
        this.nextNumber++;
      }
    }
  }
}

// Export factory function
export function createCitationManager(): CitationManagerImpl {
  return new CitationManagerImpl();
}
