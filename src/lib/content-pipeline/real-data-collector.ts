import type { Source } from './config';
import { FileCache, type CacheProvider } from './cache';

interface SearchOptions {
  limit?: number;
  freshness?: 'day' | 'week' | 'month' | 'year';
  sortBy?: 'relevance' | 'date' | 'popularity';
}

const DEFAULT_FETCH_TIMEOUT = 15000;

interface CollectorOptions {
  cache?: CacheProvider;
  serpTtlMs?: number;
  scrapeTtlMs?: number;
}

export class RealDataCollector {
  private dataForSeoAuth: string | null;
  private redditAccessToken: string | null = null;
  private redditTokenExpiry: number | null = null;
  private hasWarnedMissingDataForSeo = false;
  private cache: CacheProvider;
  private serpTtlMs: number;
  private scrapeTtlMs: number;

  constructor(options: CollectorOptions = {}) {
    // DataForSEO uses basic auth
    const login = process.env.DATAFORSEO_API_LOGIN || '';
    const password = process.env.DATAFORSEO_API_PASSWORD || '';
    if (!login || !password) {
      this.dataForSeoAuth = null;
      console.warn('DataForSEO credentials not found. Web search will rely on DuckDuckGo fallback.');
    } else {
      this.dataForSeoAuth = Buffer.from(`${login}:${password}`).toString('base64');
    }

    this.cache = options.cache || new FileCache();
    this.serpTtlMs = options.serpTtlMs ?? 1000 * 60 * 60 * 6;
    this.scrapeTtlMs = options.scrapeTtlMs ?? 1000 * 60 * 60 * 24;
  }

  async searchWeb(keyword: string, options: SearchOptions = {}): Promise<Source[]> {
    const tasks: Array<Promise<Source[]>> = [];

    if (this.dataForSeoAuth) {
      tasks.push(this.searchDataForSEO(keyword, options));
    } else if (!this.hasWarnedMissingDataForSeo) {
      this.hasWarnedMissingDataForSeo = true;
      console.warn('Skipping DataForSEO search due to missing credentials.');
    }

    tasks.push(this.searchDuckDuckGo(keyword, options));

    const settled = await Promise.allSettled(tasks);
    const merged = new Map<string, Source>();

    settled.forEach(result => {
      if (result.status === 'fulfilled') {
        result.value.forEach(source => {
          const key = source.url || `${source.title}-${source.date}`;
          if (!merged.has(key)) {
            merged.set(key, source);
          }
        });
      } else {
        console.error('Web search provider failed:', result.reason);
      }
    });

    return Array.from(merged.values());
  }

  private async searchDataForSEO(keyword: string, options: SearchOptions): Promise<Source[]> {
    if (!this.dataForSeoAuth) {
      throw new Error('DataForSEO credentials are not configured');
    }

    const url = 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced';
    const cacheKey = this.buildCacheKey('serp:dataforseo', keyword, options);
    const cached = await this.cache.get<Source[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const payload = [{
      keyword: keyword,
      location_code: 2840, // United States
      language_code: 'en',
      device: 'desktop',
      os: 'windows',
      depth: options.limit || 20,
      calculate_rectangles: false
    }];

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.dataForSeoAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }, DEFAULT_FETCH_TIMEOUT);

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.tasks && data.tasks[0] && data.tasks[0].result) {
        const items = data.tasks[0].result[0].items || [];

        const results = items
          .filter((item: any) => item.type === 'organic')
          .map((item: any) => ({
            url: item.url,
            title: item.title,
            type: 'article' as const,
            date: item.timestamp || new Date().toISOString(),
            score: item.rank_absolute || 0,
            metadata: {
              snippet: item.description,
              domain: item.domain,
              breadcrumb: item.breadcrumb,
              is_featured: item.is_featured_snippet || false
            }
          })) as Source[];

        await this.cache.set(cacheKey, results, { ttlMs: this.serpTtlMs });
        return results;
      }
    } catch (error) {
      console.error('DataForSEO error:', error);
    }

    return [];
  }

  private async searchDuckDuckGo(keyword: string, options: SearchOptions): Promise<Source[]> {
    // Use DuckDuckGo HTML search as backup
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`;
    const cacheKey = this.buildCacheKey('serp:duckduckgo', keyword, options);
    const cached = await this.cache.get<Source[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetchWithTimeout(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, DEFAULT_FETCH_TIMEOUT);

      const html = await response.text();

      // Parse results with regex (simplified)
      const resultPattern = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
      const results: Source[] = [];
      let match;
      let count = 0;

      while ((match = resultPattern.exec(html)) !== null && count < (options.limit || 10)) {
        const url = this.normalizeUrl(match[1]);
        if (!url) {
          continue;
        }

        results.push({
          url,
          title: match[2],
          type: 'article' as const,
          date: new Date().toISOString(),
          score: 100 - count * 10,
          metadata: {
            domain: this.safeExtractDomain(url)
          }
        });
        count++;
      }

      await this.cache.set(cacheKey, results, { ttlMs: this.serpTtlMs });
      return results;
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return [];
    }
  }

  async searchReddit(keyword: string, options: SearchOptions = {}): Promise<Source[]> {
    // Refresh token if needed
    if (!this.redditAccessToken || this.isRedditTokenExpired()) {
      await this.authenticateReddit();
    }

    if (this.redditAccessToken) {
      return this.searchRedditAuthenticated(keyword, options);
    }

    // Fallback to public JSON API
    return this.searchRedditPublic(keyword, options);
  }

  private async authenticateReddit(): Promise<void> {
    const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
    const clientId = process.env.REDDIT_CLIENT_ID || '';
    const clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    const username = process.env.REDDIT_USERNAME || '';
    const password = process.env.REDDIT_PASSWORD || '';

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': process.env.REDDIT_USER_AGENT || 'ContentPipeline/1.0'
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: username,
          password: password
        })
      });

      const data = await response.json();
      this.redditAccessToken = data.access_token || null;
      this.redditTokenExpiry = data.expires_in
        ? Date.now() + (Number(data.expires_in) - 60) * 1000
        : Date.now() + 30 * 60 * 1000;
    } catch (error) {
      console.error('Reddit auth failed:', error);
      this.redditAccessToken = null;
      this.redditTokenExpiry = null;
    }
  }

  private async searchRedditAuthenticated(keyword: string, options: SearchOptions): Promise<Source[]> {
    const searchUrl = `https://oauth.reddit.com/search.json?q=${encodeURIComponent(keyword)}&limit=${options.limit || 10}&sort=${options.sortBy || 'relevance'}`;

    try {
      const response = await this.fetchWithTimeout(searchUrl, {
        headers: {
          'Authorization': `Bearer ${this.redditAccessToken}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'ContentPipeline/1.0'
        }
      }, DEFAULT_FETCH_TIMEOUT);

      const data = await response.json();
      return this.parseRedditResults(data);
    } catch (error) {
      console.error('Reddit authenticated search failed:', error);
      return this.searchRedditPublic(keyword, options);
    }
  }

  private async searchRedditPublic(keyword: string, options: SearchOptions): Promise<Source[]> {
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&limit=${options.limit || 10}`;

    try {
      const response = await this.fetchWithTimeout(searchUrl, {
        headers: {
          'User-Agent': process.env.REDDIT_USER_AGENT || 'ContentPipeline/1.0'
        }
      }, DEFAULT_FETCH_TIMEOUT);

      const data = await response.json();
      return this.parseRedditResults(data);
    } catch (error) {
      console.error('Reddit public search failed:', error);
      return [];
    }
  }

  private parseRedditResults(data: any): Source[] {
    if (!data?.data?.children) return [];

    return data.data.children.map((child: any) => ({
      url: `https://reddit.com${child.data.permalink}`,
      title: child.data.title,
      type: 'reddit' as const,
      date: new Date(child.data.created_utc * 1000).toISOString(),
      score: child.data.score,
      metadata: {
        subreddit: child.data.subreddit,
        author: child.data.author,
        num_comments: child.data.num_comments,
        upvote_ratio: child.data.upvote_ratio,
        content: child.data.selftext || child.data.url,
        is_video: child.data.is_video,
        awards: child.data.total_awards_received
      }
    }));
  }

  async scrapeUrl(url: string): Promise<string> {
    const cacheKey = this.buildCacheKey('scrape', url);
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ContentPipeline/1.0)'
        }
      }, DEFAULT_FETCH_TIMEOUT);

      const html = await response.text();
      const content = this.extractContent(html);
      if (content) {
        await this.cache.set(cacheKey, content, { ttlMs: this.scrapeTtlMs });
      }
      return content;
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      return '';
    }
  }

  private extractContent(html: string): string {
    // Remove scripts, styles, and comments
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // Extract text from specific content tags
    const contentPatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<main[^>]*>([\s\S]*?)<\/main>/gi,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ];

    for (const pattern of contentPatterns) {
      const match = pattern.exec(content);
      if (match) {
        content = match[1];
        break;
      }
    }

    // Remove remaining HTML tags
    content = content.replace(/<[^>]+>/g, ' ');

    // Clean up whitespace
    content = content
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Limit length
    return content.substring(0, 50000);
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeUrl(rawUrl: string): string | null {
    try {
      const decoded = decodeURIComponent(rawUrl);
      const url = new URL(decoded.startsWith('http') ? decoded : `https://${decoded}`);
      return url.toString();
    } catch (error) {
      return null;
    }
  }

  private safeExtractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private isRedditTokenExpired(): boolean {
    if (!this.redditTokenExpiry) {
      return true;
    }
    return Date.now() >= this.redditTokenExpiry;
  }

  private buildCacheKey(prefix: string, value: string, options?: SearchOptions): string {
    if (options) {
      const limit = options.limit ?? 'all';
      const freshness = options.freshness ?? 'any';
      const sortBy = options.sortBy ?? 'relevance';
      return `${prefix}:${value}:${limit}:${freshness}:${sortBy}`.toLowerCase();
    }
    return `${prefix}:${value}`.toLowerCase();
  }
}
