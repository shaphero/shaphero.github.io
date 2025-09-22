#!/usr/bin/env node

/**
 * Discover Trending Topics for Content Generation
 * Combines Reddit trends with DataForSEO keyword opportunities
 */

import RedditDirectAPI from './lib/reddit-direct.js';
import DataForSEOOptimized from './lib/dataforseo-optimized.js';
import chalk from 'chalk';

async function discoverTopics() {
  const reddit = new RedditDirectAPI();
  const dataforseo = new DataForSEOOptimized();

  console.error(chalk.cyan.bold('\n🔍 Discovering Content Opportunities\n'));

  // Target subreddits for your audience
  const targetSubreddits = [
    'SEO',
    'marketing',
    'smallbusiness',
    'Entrepreneur',
    'startups',
    'consulting',
    'FortuneFive00'
  ];

  // Base topics for your niche
  const baseTopics = [
    'AI SEO',
    'AI consulting',
    'Fortune 500 AI',
    'enterprise AI implementation',
    'marketing automation AI'
  ];

  const opportunities = [];

  // 1. Get Reddit trending topics
  console.error(chalk.yellow('Analyzing Reddit trends...'));

  for (const subreddit of targetSubreddits) {
    try {
      const hot = await reddit.apiCall(`/r/${subreddit}/hot.json`, { limit: 10 });
      const posts = hot.data.children;

      posts.forEach(post => {
        const data = post.data;

        // High engagement threshold
        if (data.score > 50 && data.num_comments > 20) {
          // Check if it's a question or discussion
          if (data.title.includes('?') ||
              data.title.toLowerCase().includes('how') ||
              data.title.toLowerCase().includes('what') ||
              data.title.toLowerCase().includes('why')) {

            opportunities.push({
              topic: data.title,
              score: data.score,
              comments: data.num_comments,
              source: `r/${subreddit}`,
              type: 'reddit_trending',
              url: `https://reddit.com${data.permalink}`,
              engagement: data.score + (data.num_comments * 2) // Weight comments higher
            });
          }
        }
      });
    } catch (error) {
      console.error(chalk.red(`Failed to fetch r/${subreddit}: ${error.message}`));
    }
  }

  // 2. Get keyword opportunities from DataForSEO
  console.error(chalk.yellow('\nAnalyzing keyword opportunities...'));

  for (const baseTopic of baseTopics) {
    try {
      const keywords = await dataforseo.getRelatedKeywords(baseTopic);

      // Find low-competition, high-volume opportunities
      keywords.forEach(kw => {
        if (kw.volume > 500 && kw.difficulty < 40) {
          opportunities.push({
            topic: kw.keyword,
            score: kw.volume,
            difficulty: kw.difficulty,
            source: 'dataforseo',
            type: 'keyword_opportunity',
            engagement: Math.round(kw.volume / (kw.difficulty + 1)) // Volume/difficulty ratio
          });
        }
      });
    } catch (error) {
      console.error(chalk.red(`Failed to get keywords for ${baseTopic}: ${error.message}`));
    }
  }

  // 3. Score and rank opportunities
  console.error(chalk.yellow('\nRanking opportunities...'));

  const scored = opportunities
    .map(opp => ({
      ...opp,
      // Composite score based on engagement and type
      finalScore: opp.engagement * (opp.type === 'reddit_trending' ? 2 : 1)
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 10); // Top 10 opportunities

  // 4. Deduplicate similar topics
  const unique = [];
  const seen = new Set();

  scored.forEach(opp => {
    const normalized = opp.topic.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(opp);
    }
  });

  // 5. Final selection (top 5)
  const selected = unique.slice(0, 5);

  // Display results
  console.error(chalk.green('\n✅ Top Content Opportunities:\n'));

  selected.forEach((opp, index) => {
    console.error(chalk.cyan(`${index + 1}. ${opp.topic}`));
    console.error(chalk.dim(`   Source: ${opp.source}`));
    console.error(chalk.dim(`   Engagement Score: ${opp.finalScore}`));
    if (opp.url) {
      console.error(chalk.dim(`   URL: ${opp.url}`));
    }
    console.error('');
  });

  // Output JSON for GitHub Actions
  const topics = selected.map(opp => opp.topic);
  console.log(JSON.stringify(topics));

  return topics;
}

// Run discovery
if (import.meta.url === `file://${process.argv[1]}`) {
  discoverTopics().catch(error => {
    console.error(chalk.red('Discovery failed:'), error);
    // Output fallback topics
    console.log(JSON.stringify(['AI SEO best practices 2025']));
    process.exit(1);
  });
}

export default discoverTopics;