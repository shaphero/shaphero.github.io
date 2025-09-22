/**
 * Optimized DataForSEO Integration
 * Fixes timeout issues and implements best practices from 2025 research
 */

import axios from 'axios';
import dotenv from 'dotenv';
import pRetry from 'p-retry';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

class DataForSEOOptimized {
  constructor() {
    this.auth = {
      username: process.env.DATAFORSEO_API_LOGIN,
      password: process.env.DATAFORSEO_API_PASSWORD
    };

    // Configure axios with proper timeouts
    this.client = axios.create({
      baseURL: 'https://api.dataforseo.com/v3',
      timeout: 30000, // 30 seconds instead of default
      auth: this.auth,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Cache directory for responses
    this.cacheDir = './cache/dataforseo';
    fs.ensureDirSync(this.cacheDir);
  }

  /**
   * Make API request with retry logic and caching
   */
  async apiRequest(endpoint, data = [], useCache = true) {
    const cacheKey = `${endpoint.replace(/\//g, '_')}_${JSON.stringify(data).substring(0, 50)}.json`;
    const cachePath = path.join(this.cacheDir, cacheKey);

    // Check cache first (1 hour expiry)
    if (useCache && fs.existsSync(cachePath)) {
      const cached = await fs.readJSON(cachePath);
      const cacheAge = Date.now() - cached.timestamp;
      if (cacheAge < 3600000) { // 1 hour
        console.log(`Using cached data for ${endpoint}`);
        return cached.data;
      }
    }

    // Make request with retry
    const response = await pRetry(
      async () => {
        const result = await this.client.post(`/${endpoint}`, data);

        if (result.data.status_code !== 20000 && result.data.status_message !== 'Ok') {
          throw new Error(`DataForSEO API error: ${result.data.status_message}`);
        }

        return result.data;
      },
      {
        retries: 3,
        onFailedAttempt: error => {
          console.log(`Attempt ${error.attemptNumber} failed. Retrying...`);
        }
      }
    );

    // Cache successful response
    if (useCache) {
      await fs.writeJSON(cachePath, {
        timestamp: Date.now(),
        data: response
      });
    }

    return response;
  }

  /**
   * Complete SERP Analysis (All features)
   */
  async analyzeSERP(keyword, location_code = 2840) {
    console.log(`Analyzing SERP for: ${keyword}`);

    try {
      // Create task first
      const taskResponse = await this.apiRequest('serp/google/organic/task_post', [{
        keyword,
        location_code,
        language_code: 'en',
        device: 'desktop',
        depth: 10
      }]);

      // Get task ID
      const taskId = taskResponse.tasks?.[0]?.id;
      if (!taskId) {
        throw new Error('Failed to create SERP task');
      }

      // Wait for task completion
      await this.waitForTask(taskId);

      // Get results
      const results = await this.apiRequest(`serp/google/organic/task_get/regular/${taskId}`);

      return this.parseSERPResults(results);

    } catch (error) {
      console.error('SERP analysis failed:', error.message);

      // Return mock data as fallback
      return this.getMockSERPData(keyword);
    }
  }

  /**
   * Get People Also Ask questions
   */
  async getPAAQuestions(keyword, location_code = 2840) {
    console.log(`Getting PAA for: ${keyword}`);

    try {
      const response = await this.apiRequest('serp/google/organic/live/regular', [{
        keyword,
        location_code,
        language_code: 'en',
        depth: 100
      }]);

      const paaQuestions = [];
      const items = response.tasks?.[0]?.result?.[0]?.items || [];

      items.forEach(item => {
        if (item.type === 'people_also_ask') {
          item.items?.forEach(question => {
            paaQuestions.push({
              question: question.title,
              answer: question.expanded_element?.[0]?.description || ''
            });
          });
        }
      });

      return paaQuestions;

    } catch (error) {
      console.error('PAA extraction failed:', error.message);
      return [];
    }
  }

  /**
   * Get Related Keywords with search volume
   */
  async getRelatedKeywords(keyword) {
    console.log(`Getting related keywords for: ${keyword}`);

    try {
      const response = await this.apiRequest('dataforseo_labs/google/related_keywords/live', [{
        keyword,
        location_code: 2840,
        language_code: 'en',
        limit: 20
      }]);

      const keywords = response.tasks?.[0]?.result?.[0]?.items || [];

      return keywords.map(item => ({
        keyword: item.keyword_data.keyword,
        volume: item.keyword_data.keyword_info.search_volume,
        difficulty: item.keyword_data.keyword_info.competition,
        cpc: item.keyword_data.keyword_info.cpc
      }));

    } catch (error) {
      console.error('Related keywords failed:', error.message);
      return [];
    }
  }

  /**
   * Generate Content using DataForSEO Content Generation API
   */
  async generateContent(topic, keywords = [], wordCount = 2000) {
    console.log(`Generating content for: ${topic}`);

    try {
      const response = await this.apiRequest('content_generation/generate', [{
        topic,
        word_count: wordCount,
        sub_topics: keywords.slice(0, 10),
        creativity_index: 0.7,
        include_conclusion: true
      }]);

      return response.tasks?.[0]?.result?.[0]?.content || '';

    } catch (error) {
      console.error('Content generation failed:', error.message);
      return null;
    }
  }

  /**
   * Generate Meta Tags
   */
  async generateMetaTags(content) {
    try {
      const response = await this.apiRequest('content_generation/generate_meta_tags', [{
        text: content.substring(0, 5000) // API limit
      }]);

      return {
        title: response.tasks?.[0]?.result?.[0]?.title || '',
        description: response.tasks?.[0]?.result?.[0]?.description || ''
      };

    } catch (error) {
      console.error('Meta tags generation failed:', error.message);
      return { title: '', description: '' };
    }
  }

  /**
   * Wait for task completion
   */
  async waitForTask(taskId, maxWait = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const response = await this.apiRequest(`serp/google/organic/tasks_ready`);
      const ready = response.tasks?.[0]?.result?.find(t => t.id === taskId);

      if (ready) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Task timeout');
  }

  /**
   * Parse SERP results
   */
  parseSERPResults(response) {
    const items = response.tasks?.[0]?.result?.[0]?.items || [];

    return {
      organic: items.filter(i => i.type === 'organic').slice(0, 10),
      featuredSnippet: items.find(i => i.type === 'featured_snippet'),
      paa: items.filter(i => i.type === 'people_also_ask'),
      relatedSearches: items.filter(i => i.type === 'related_searches'),
      aiOverview: items.find(i => i.type === 'ai_overview')
    };
  }

  /**
   * Get mock SERP data (fallback)
   */
  getMockSERPData(keyword) {
    return {
      organic: [
        {
          title: `Complete Guide to ${keyword}`,
          url: 'https://example.com/guide',
          description: `Learn everything about ${keyword} in this comprehensive guide.`
        }
      ],
      featuredSnippet: null,
      paa: [],
      relatedSearches: [],
      aiOverview: null
    };
  }

  /**
   * Complete content research pipeline
   */
  async researchTopic(topic) {
    console.log(`\n🔍 Researching: ${topic}\n`);

    // Parallel requests for speed
    const [serp, paa, keywords] = await Promise.all([
      this.analyzeSERP(topic),
      this.getPAAQuestions(topic),
      this.getRelatedKeywords(topic)
    ]);

    // Analyze competition
    const topCompetitors = serp.organic.slice(0, 5).map(item => ({
      url: item.url,
      title: item.title,
      description: item.description
    }));

    // Find content opportunities
    const opportunities = this.findOpportunities(serp, paa, keywords);

    return {
      topic,
      competitors: topCompetitors,
      questions: paa,
      keywords: keywords.slice(0, 10),
      opportunities,
      featuredSnippet: serp.featuredSnippet,
      aiOverview: serp.aiOverview
    };
  }

  /**
   * Find content opportunities
   */
  findOpportunities(serp, paa, keywords) {
    const opportunities = [];

    // Featured snippet opportunity
    if (!serp.featuredSnippet) {
      opportunities.push({
        type: 'featured_snippet',
        priority: 'high',
        action: 'Structure content with clear definition in first paragraph'
      });
    }

    // High-volume keywords with low competition
    keywords.forEach(kw => {
      if (kw.volume > 1000 && kw.difficulty < 30) {
        opportunities.push({
          type: 'keyword_opportunity',
          keyword: kw.keyword,
          volume: kw.volume,
          priority: 'medium'
        });
      }
    });

    // Unanswered PAA questions
    if (paa.length > 10) {
      opportunities.push({
        type: 'comprehensive_faq',
        priority: 'high',
        action: `Answer all ${paa.length} PAA questions`
      });
    }

    return opportunities;
  }
}

export default DataForSEOOptimized;