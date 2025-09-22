/**
 * Reddit API Integration Module (Direct API Version)
 * Uses direct Reddit API calls instead of snoowrap library
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class RedditDirectAPI {
  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID;
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET;
    this.username = process.env.REDDIT_USERNAME;
    this.password = process.env.REDDIT_PASSWORD;
    this.userAgent = process.env.REDDIT_USER_AGENT;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth2 access token
   */
  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      // Use password grant for script applications
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', this.username);
      params.append('password', this.password);

      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        params,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.userAgent
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry to be safe
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Reddit access token:', error.message);
      throw error;
    }
  }

  /**
   * Make authenticated API call
   */
  async apiCall(endpoint, params = {}) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `https://oauth.reddit.com${endpoint}`,
        {
          params: {
            ...params,
            raw_json: 1
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': this.userAgent
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Reddit API call failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * Search Reddit for topic-related discussions
   */
  async searchTopic(topic, limit = 25) {
    try {
      const data = await this.apiCall('/search.json', {
        q: topic,
        sort: 'relevance',
        t: 'year',
        limit,
        type: 'link'
      });

      return this.extractInsights(data.data.children);
    } catch (error) {
      console.error('Reddit Search Error:', error.message);
      // Return empty insights on error
      return this.getEmptyInsights();
    }
  }

  /**
   * Get top posts from relevant subreddits
   */
  async getSubredditInsights(subredditNames, topic, limit = 10) {
    const allInsights = [];

    for (const subredditName of subredditNames) {
      try {
        // Search within subreddit
        const searchData = await this.apiCall(`/r/${subredditName}/search.json`, {
          q: topic,
          restrict_sr: true,
          sort: 'relevance',
          t: 'year',
          limit
        });

        // Get hot posts
        const hotData = await this.apiCall(`/r/${subredditName}/hot.json`, {
          limit: 5
        });

        allInsights.push({
          subreddit: subredditName,
          searchResults: await this.extractInsights(searchData.data.children),
          hotTopics: await this.extractInsights(hotData.data.children)
        });
      } catch (error) {
        console.error(`Error fetching from r/${subredditName}:`, error.message);
      }
    }

    return allInsights;
  }

  /**
   * Extract insights from Reddit posts
   */
  async extractInsights(posts) {
    const insights = {
      questions: [],
      painPoints: [],
      solutions: [],
      commonThemes: [],
      userLanguage: [],
      topConcerns: []
    };

    if (!posts || posts.length === 0) {
      return insights;
    }

    for (const postWrapper of posts) {
      const post = postWrapper.data;

      // Extract questions from titles
      if (this.isQuestion(post.title)) {
        insights.questions.push({
          question: post.title,
          score: post.score,
          num_comments: post.num_comments,
          url: `https://reddit.com${post.permalink}`
        });
      }

      // Analyze post content for pain points
      const painPoints = this.extractPainPoints(post.title + ' ' + (post.selftext || ''));
      insights.painPoints.push(...painPoints);

      // Get comments if available
      if (post.num_comments > 5) {
        try {
          // Fetch comments separately
          const commentsData = await this.apiCall(`${post.permalink}.json`, { limit: 5 });

          if (commentsData && commentsData[1] && commentsData[1].data) {
            const comments = commentsData[1].data.children.slice(0, 5);

            for (const commentWrapper of comments) {
              const comment = commentWrapper.data;
              if (comment.body) {
                // Extract solutions and tips
                if (this.containsSolution(comment.body)) {
                  insights.solutions.push({
                    solution: comment.body.substring(0, 500),
                    score: comment.score,
                    context: post.title
                  });
                }

                // Capture user language patterns
                const phrases = this.extractKeyPhrases(comment.body);
                insights.userLanguage.push(...phrases);
              }
            }
          }
        } catch (error) {
          // Skip if comments can't be loaded
        }
      }

      // Track common themes
      const themes = this.extractThemes(post.title);
      insights.commonThemes.push(...themes);
    }

    // Deduplicate and sort
    insights.questions = this.dedupeAndSort(insights.questions, 'question');
    insights.painPoints = this.dedupeAndSort(insights.painPoints, 'text');
    insights.solutions = this.dedupeAndSort(insights.solutions, 'solution');
    insights.commonThemes = this.countOccurrences(insights.commonThemes);
    insights.userLanguage = this.countOccurrences(insights.userLanguage);

    return insights;
  }

  /**
   * Get empty insights structure
   */
  getEmptyInsights() {
    return {
      questions: [],
      painPoints: [],
      solutions: [],
      commonThemes: [],
      userLanguage: [],
      topConcerns: []
    };
  }

  /**
   * Check if text is a question
   */
  isQuestion(text) {
    const questionPatterns = [
      /^(how|what|when|where|why|which|who|is|are|can|should|would|could|will|do|does|did)/i,
      /\?$/,
      /anyone know/i,
      /any advice/i,
      /need help/i,
      /looking for/i
    ];

    return questionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract pain points from text
   */
  extractPainPoints(text) {
    const painPointPatterns = [
      /struggling with/gi,
      /frustrated by/gi,
      /can't figure out/gi,
      /having trouble/gi,
      /doesn't work/gi,
      /confused about/gi,
      /worried about/gi,
      /concerned that/gi,
      /difficulty with/gi,
      /problem with/gi,
      /issue with/gi,
      /challenge with/gi
    ];

    const painPoints = [];
    painPointPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const index = text.indexOf(match);
          const context = text.substring(
            Math.max(0, index - 30),
            Math.min(text.length, index + 100)
          );
          painPoints.push({
            text: context.trim(),
            trigger: match
          });
        });
      }
    });

    return painPoints;
  }

  /**
   * Check if text contains a solution
   */
  containsSolution(text) {
    const solutionPatterns = [
      /here's what worked/i,
      /try this/i,
      /solution is/i,
      /fixed it by/i,
      /resolved by/i,
      /what helped me/i,
      /I recommend/i,
      /pro tip/i,
      /the trick is/i,
      /best way to/i
    ];

    return solutionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract key phrases from text
   */
  extractKeyPhrases(text) {
    const phrases = [];

    const phrasePatterns = [
      /"([^"]+)"/g,  // Quoted phrases
      /\b(\w+\s+\w+\s+\w+)\b/g  // Three-word phrases
    ];

    phrasePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phrases.push(...matches.map(m => m.replace(/"/g, '').toLowerCase()));
      }
    });

    return phrases.filter(p => p.length > 10 && p.length < 100);
  }

  /**
   * Extract themes from text
   */
  extractThemes(text) {
    const themes = [];
    const themeKeywords = {
      'pricing': ['price', 'cost', 'expensive', 'cheap', 'afford'],
      'quality': ['quality', 'good', 'bad', 'best', 'worst'],
      'comparison': ['vs', 'versus', 'compare', 'better', 'alternative'],
      'beginner': ['beginner', 'newbie', 'start', 'learn', 'tutorial'],
      'advanced': ['advanced', 'expert', 'pro', 'professional'],
      'troubleshooting': ['fix', 'solve', 'problem', 'issue', 'error'],
      'recommendation': ['recommend', 'suggest', 'advice', 'tips']
    };

    const lowerText = text.toLowerCase();
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        themes.push(theme);
      }
    });

    return themes;
  }

  /**
   * Deduplicate and sort by score
   */
  dedupeAndSort(items, keyField) {
    const seen = new Set();
    const unique = items.filter(item => {
      const key = item[keyField]?.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Count occurrences and return sorted
   */
  countOccurrences(items) {
    const counts = {};
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([item, count]) => ({ item, count }));
  }

  /**
   * Get relevant subreddits for a topic
   */
  async findRelevantSubreddits(topic, limit = 5) {
    try {
      const data = await this.apiCall('/subreddits/search.json', {
        q: topic,
        limit
      });

      return data.data.children.map(item => ({
        name: item.data.display_name,
        subscribers: item.data.subscribers,
        description: item.data.public_description
      }));
    } catch (error) {
      console.error('Subreddit search error:', error.message);
      return [];
    }
  }
}

export default RedditDirectAPI;