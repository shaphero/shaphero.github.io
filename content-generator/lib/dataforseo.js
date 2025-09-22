/**
 * DataForSEO API Integration Module
 * Handles SERP analysis, PAA extraction, and competitor content analysis
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class DataForSEO {
  constructor() {
    this.baseURL = 'https://api.dataforseo.com/v3';
    this.auth = {
      username: process.env.DATAFORSEO_API_LOGIN,
      password: process.env.DATAFORSEO_API_PASSWORD
    };
  }

  /**
   * Get SERP results for a keyword
   */
  async getSERPResults(keyword, location = 'United States', depth = 10) {
    try {
      // First, post the task
      const taskResponse = await axios.post(
        `${this.baseURL}/serp/google/organic/task_post`,
        [{
          keyword,
          location_name: location,
          language_code: 'en',
          depth,
          load_html: false,
          calculate_rectangles: false
        }],
        { auth: this.auth }
      );

      if (!taskResponse.data.tasks?.[0]?.id) {
        throw new Error('Failed to create SERP task');
      }

      const taskId = taskResponse.data.tasks[0].id;

      // Wait for task completion
      await this.waitForTask(taskId);

      // Get results
      const resultsResponse = await axios.get(
        `${this.baseURL}/serp/google/organic/task_get/regular/${taskId}`,
        { auth: this.auth }
      );

      return this.parseSERPResults(resultsResponse.data);
    } catch (error) {
      console.error('SERP API Error:', error.message);
      throw error;
    }
  }

  /**
   * Get People Also Ask questions
   */
  async getPAAQuestions(keyword, location = 'United States') {
    try {
      const response = await axios.post(
        `${this.baseURL}/serp/google/organic/live/advanced`,
        [{
          keyword,
          location_name: location,
          language_code: 'en',
          depth: 100,
          people_also_ask_click_depth: 2 // Expand PAA up to 2 levels
        }],
        { auth: this.auth }
      );

      return this.extractPAAQuestions(response.data);
    } catch (error) {
      console.error('PAA API Error:', error.message);
      throw error;
    }
  }

  /**
   * Get related searches
   */
  async getRelatedSearches(keyword, location = 'United States') {
    try {
      const response = await axios.post(
        `${this.baseURL}/serp/google/organic/live/advanced`,
        [{
          keyword,
          location_name: location,
          language_code: 'en',
          depth: 10
        }],
        { auth: this.auth }
      );

      return this.extractRelatedSearches(response.data);
    } catch (error) {
      console.error('Related Searches API Error:', error.message);
      throw error;
    }
  }

  /**
   * Extract competitor content topics from SERP
   */
  async analyzeCompetitorContent(keyword) {
    const serpResults = await this.getSERPResults(keyword, 'United States', 10);
    const competitors = [];

    for (const result of serpResults.organic || []) {
      competitors.push({
        url: result.url,
        title: result.title,
        description: result.description,
        breadcrumb: result.breadcrumb,
        highlighted: result.highlighted,
        links: result.links,
        about_this_result: result.about_this_result
      });
    }

    return {
      competitors,
      featured_snippet: serpResults.featured_snippet,
      knowledge_graph: serpResults.knowledge_graph,
      top_stories: serpResults.top_stories,
      video_results: serpResults.video,
      shopping_results: serpResults.shopping
    };
  }

  /**
   * Wait for task completion
   */
  async waitForTask(taskId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const response = await axios.get(
        `${this.baseURL}/serp/google/organic/tasks_ready`,
        { auth: this.auth }
      );

      const readyTasks = response.data.tasks || [];
      if (readyTasks.some(task => task.id === taskId)) {
        return true;
      }
    }
    throw new Error('Task timeout');
  }

  /**
   * Parse SERP results
   */
  parseSERPResults(data) {
    const results = data.tasks?.[0]?.result?.[0] || {};

    return {
      organic: results.items?.filter(item => item.type === 'organic') || [],
      featured_snippet: results.items?.find(item => item.type === 'featured_snippet'),
      people_also_ask: results.items?.filter(item => item.type === 'people_also_ask') || [],
      related_searches: results.items?.filter(item => item.type === 'related_searches') || [],
      knowledge_graph: results.items?.find(item => item.type === 'knowledge_graph'),
      top_stories: results.items?.filter(item => item.type === 'top_stories') || [],
      video: results.items?.filter(item => item.type === 'video') || [],
      shopping: results.items?.filter(item => item.type === 'shopping') || [],
      total_results: results.se_results_count,
      keyword_difficulty: results.keyword_info
    };
  }

  /**
   * Extract PAA questions from response
   */
  extractPAAQuestions(data) {
    const questions = [];
    const items = data.tasks?.[0]?.result?.[0]?.items || [];

    items.forEach(item => {
      if (item.type === 'people_also_ask') {
        item.items?.forEach(paaItem => {
          questions.push({
            question: paaItem.title,
            answer: paaItem.expanded_element?.description,
            source_url: paaItem.expanded_element?.url,
            source_title: paaItem.expanded_element?.title
          });

          // Get nested questions if available
          if (paaItem.expanded_element?.items) {
            paaItem.expanded_element.items.forEach(nestedItem => {
              questions.push({
                question: nestedItem.title,
                answer: nestedItem.expanded_element?.description,
                source_url: nestedItem.expanded_element?.url,
                source_title: nestedItem.expanded_element?.title,
                is_nested: true
              });
            });
          }
        });
      }
    });

    return questions;
  }

  /**
   * Extract related searches
   */
  extractRelatedSearches(data) {
    const searches = [];
    const items = data.tasks?.[0]?.result?.[0]?.items || [];

    items.forEach(item => {
      if (item.type === 'related_searches') {
        item.items?.forEach(searchItem => {
          searches.push(searchItem.title);
        });
      }
    });

    return searches;
  }
}

export default DataForSEO;