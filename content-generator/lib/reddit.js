/**
 * Reddit API Integration Module
 * Extracts user questions, pain points, and discussion insights
 */

import snoowrap from 'snoowrap';
import dotenv from 'dotenv';

dotenv.config();

class RedditInsights {
  constructor() {
    // Use proper OAuth2 for app-only authentication
    this.reddit = new snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT,
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      username: undefined,
      password: undefined
    });

    // Configure for read-only mode
    this.reddit.config({
      requestDelay: 1000,
      warnings: false,
      continueAfterRatelimitError: false
    });
  }

  /**
   * Search Reddit for topic-related discussions
   */
  async searchTopic(topic, limit = 25) {
    try {
      const results = await this.reddit.search({
        query: topic,
        sort: 'relevance',
        time: 'year',
        limit,
        type: 'link'
      });

      return this.extractInsights(results);
    } catch (error) {
      console.error('Reddit Search Error:', error.message);
      throw error;
    }
  }

  /**
   * Get top posts from relevant subreddits
   */
  async getSubredditInsights(subredditNames, topic, limit = 10) {
    const allInsights = [];

    for (const subredditName of subredditNames) {
      try {
        const subreddit = this.reddit.getSubreddit(subredditName);

        // Search within subreddit
        const searchResults = await subreddit.search({
          query: topic,
          sort: 'relevance',
          time: 'year',
          limit
        });

        // Get hot posts
        const hotPosts = await subreddit.getHot({ limit: 5 });

        allInsights.push({
          subreddit: subredditName,
          searchResults: await this.extractInsights(searchResults),
          hotTopics: await this.extractInsights(hotPosts)
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

    for (const post of posts) {
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

      // Get top comments for additional insights
      if (post.num_comments > 5) {
        try {
          await post.expandReplies({ limit: 5, depth: 1 });
          const topComments = post.comments.slice(0, 5);

          for (const comment of topComments) {
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
        // Get context around the match
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

    // Common phrases patterns
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
      const results = await this.reddit.searchSubreddits({
        query: topic,
        limit
      });

      return results.map(sub => ({
        name: sub.display_name,
        subscribers: sub.subscribers,
        description: sub.public_description
      }));
    } catch (error) {
      console.error('Subreddit search error:', error.message);
      return [];
    }
  }
}

export default RedditInsights;