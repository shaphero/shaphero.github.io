/**
 * CORE API Client - Access to millions of open access research papers
 * https://core.ac.uk/documentation/api
 */

import type { Source, CoreApiResponse, CorePaper } from './types.js';
import type { SourceType } from './types.js';

export class CoreApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.core.ac.uk/v3') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Search for academic papers on a topic
   */
  async searchPapers(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      minCitations?: number;
      yearFrom?: number;
      yearTo?: number;
    } = {}
  ): Promise<Source[]> {
    const {
      limit = 10,
      offset = 0,
      minCitations = 0,
      yearFrom,
      yearTo,
    } = options;

    try {
      // Build query with year filters if specified
      let fullQuery = query;
      if (yearFrom) {
        fullQuery += ` AND yearPublished>=${yearFrom}`;
      }
      if (yearTo) {
        fullQuery += ` AND yearPublished<=${yearTo}`;
      }

      // CORE API v3 uses GET with query parameters (note the trailing slash)
      const params = new URLSearchParams({
        q: fullQuery,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const searchUrl = `${this.baseUrl}/search/works/?${params}`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CORE API error (${response.status}): ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();

      // Check if the response has the expected structure
      if (!data || !data.results || !Array.isArray(data.results)) {
        console.log('Unexpected CORE API response structure:', JSON.stringify(data).substring(0, 200));
        return [];
      }

      // Convert CORE papers to our Source format
      const sources = data.results
        .filter((paper: any) => !minCitations || (paper.citationCount && paper.citationCount >= minCitations))
        .map((paper: any) => this.paperToSource(paper));

      return sources;
    } catch (error) {
      console.error('Error searching CORE API:', error);
      return [];
    }
  }

  /**
   * Get a specific paper by ID
   */
  async getPaper(paperId: string): Promise<Source | null> {
    try {
      const url = `${this.baseUrl}/works/${paperId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`CORE API error: ${response.statusText}`);
      }

      const paper: CorePaper = await response.json();
      return this.paperToSource(paper);
    } catch (error) {
      console.error('Error fetching paper from CORE:', error);
      return null;
    }
  }

  /**
   * Get similar papers to a given paper
   */
  async getSimilarPapers(
    paperId: string,
    limit: number = 5
  ): Promise<Source[]> {
    try {
      const url = `${this.baseUrl}/works/${paperId}/similar`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit }),
      });

      if (!response.ok) {
        throw new Error(`CORE API error: ${response.statusText}`);
      }

      const data: CoreApiResponse = await response.json();
      return data.data.map(paper => this.paperToSource(paper));
    } catch (error) {
      console.error('Error fetching similar papers:', error);
      return [];
    }
  }

  /**
   * Search for papers by specific authors
   */
  async searchByAuthor(
    authorName: string,
    limit: number = 10
  ): Promise<Source[]> {
    try {
      const query = `author:"${authorName}"`;
      return await this.searchPapers(query, { limit });
    } catch (error) {
      console.error('Error searching by author:', error);
      return [];
    }
  }

  /**
   * Get papers from specific journals or publishers
   */
  async searchByJournal(
    journalName: string,
    query?: string,
    limit: number = 10
  ): Promise<Source[]> {
    try {
      const searchQuery = query
        ? `${query} AND publisher:"${journalName}"`
        : `publisher:"${journalName}"`;

      return await this.searchPapers(searchQuery, { limit });
    } catch (error) {
      console.error('Error searching by journal:', error);
      return [];
    }
  }

  /**
   * Get highly cited papers on a topic
   */
  async getHighlyCitedPapers(
    query: string,
    minCitations: number = 50,
    limit: number = 10
  ): Promise<Source[]> {
    try {
      const papers = await this.searchPapers(query, {
        limit: limit * 3, // Get more, then filter
        minCitations,
      });

      // Sort by citation count descending
      return papers
        .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching highly cited papers:', error);
      return [];
    }
  }

  /**
   * Get recent papers (last 2 years)
   */
  async getRecentPapers(
    query: string,
    limit: number = 10
  ): Promise<Source[]> {
    const currentYear = new Date().getFullYear();
    return await this.searchPapers(query, {
      limit,
      yearFrom: currentYear - 2,
      yearTo: currentYear,
    });
  }

  /**
   * Convert CORE paper to our Source format
   */
  private paperToSource(paper: any): Source {
    // Extract authors - CORE v3 returns authors as array of objects with 'name' property
    const authors = paper.authors?.map((a: any) => a.name || a) || [];

    // Parse publish date
    const publishDate = paper.publishedDate
      ? new Date(paper.publishedDate)
      : paper.yearPublished
      ? new Date(paper.yearPublished, 0, 1)
      : undefined;

    // Get download URL from links or downloadUrl field
    const downloadUrl = paper.downloadUrl ||
                       paper.links?.find((l: any) => l.type === 'download')?.url ||
                       paper.links?.find((l: any) => l.type === 'display')?.url;

    return {
      id: `core-${paper.id}`,
      url: downloadUrl || `https://core.ac.uk/works/${paper.id}`,
      title: paper.title || 'Untitled',
      type: 'academic' as SourceType,
      date: publishDate,
      authors: authors,
      publication: paper.publisher || paper.journals?.[0]?.title,
      doi: paper.doi,
      citationCount: paper.citationCount || 0,

      // Placeholder scores (will be calculated by CredibilityScorer)
      credibilityScore: 0,
      credibilityBreakdown: {
        authority: 0,
        recency: 0,
        citations: 0,
        methodology: 0,
        bias: 0,
      },

      hasMethodology: true, // Academic papers typically have methodology

      metadata: {
        abstract: paper.abstract,
        subjects: paper.fieldOfStudy ? [paper.fieldOfStudy] : [],
        yearPublished: paper.yearPublished,
        coreId: paper.id.toString(),
        downloadUrl: downloadUrl,
        language: paper.language?.name,
        documentType: paper.documentType,
      },
    };
  }

  /**
   * Extract key information from abstract
   */
  extractMethodology(abstract: string): {
    hasMethodology: boolean;
    sampleSize?: string;
    methods?: string[];
  } {
    const methodKeywords = [
      'methodology', 'methods', 'approach', 'technique', 'analysis',
      'experiment', 'study', 'survey', 'interview', 'observation',
      'sample', 'participants', 'dataset', 'model', 'algorithm'
    ];

    const hasMethodology = methodKeywords.some(keyword =>
      abstract.toLowerCase().includes(keyword)
    );

    // Try to extract sample size
    const sampleMatch = abstract.match(/n\s*=\s*(\d+)|sample.*?(\d+)/i);
    const sampleSize = sampleMatch ? sampleMatch[1] || sampleMatch[2] : undefined;

    // Extract mentioned methods
    const methods: string[] = [];
    if (abstract.toLowerCase().includes('machine learning')) methods.push('Machine Learning');
    if (abstract.toLowerCase().includes('survey')) methods.push('Survey');
    if (abstract.toLowerCase().includes('experiment')) methods.push('Experimental');
    if (abstract.toLowerCase().includes('meta-analysis')) methods.push('Meta-Analysis');
    if (abstract.toLowerCase().includes('systematic review')) methods.push('Systematic Review');

    return {
      hasMethodology,
      sampleSize,
      methods: methods.length > 0 ? methods : undefined,
    };
  }

  /**
   * Batch search for multiple queries
   */
  async batchSearch(
    queries: string[],
    limitPerQuery: number = 5
  ): Promise<Map<string, Source[]>> {
    const results = new Map<string, Source[]>();

    // Use Promise.all for parallel requests
    await Promise.all(
      queries.map(async query => {
        const sources = await this.searchPapers(query, { limit: limitPerQuery });
        results.set(query, sources);
      })
    );

    return results;
  }

  /**
   * Get aggregated stats for search results
   */
  async getSearchStats(query: string) {
    const papers = await this.searchPapers(query, { limit: 100 });

    if (papers.length === 0) {
      return {
        totalPapers: 0,
        avgCitations: 0,
        yearRange: { min: 0, max: 0 },
        topAuthors: [],
        topPublishers: [],
      };
    }

    const years = papers
      .map(p => p.date ? p.date.getFullYear() : 0)
      .filter(y => y > 0);

    const citations = papers
      .map(p => p.citationCount || 0);

    const authors = papers
      .flatMap(p => p.authors || [])
      .reduce((acc, author) => {
        acc[author] = (acc[author] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const publishers = papers
      .map(p => p.publication || 'Unknown')
      .reduce((acc, pub) => {
        acc[pub] = (acc[pub] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalPapers: papers.length,
      avgCitations: citations.reduce((sum, c) => sum + c, 0) / citations.length,
      yearRange: {
        min: Math.min(...years),
        max: Math.max(...years),
      },
      topAuthors: Object.entries(authors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, papers: count })),
      topPublishers: Object.entries(publishers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, papers: count })),
    };
  }
}

/**
 * Helper function to create CORE client from env
 */
export function createCoreClient(): CoreApiClient | null {
  const apiKey = process.env.CORE_API_KEY;

  if (!apiKey) {
    console.warn('CORE_API_KEY not found in environment variables');
    return null;
  }

  return new CoreApiClient(apiKey);
}
