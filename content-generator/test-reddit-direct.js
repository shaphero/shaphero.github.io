#!/usr/bin/env node

/**
 * Test the new Reddit Direct API implementation
 */

import RedditDirectAPI from './lib/reddit-direct.js';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🔍 Testing Reddit Direct API Implementation\n'));

async function testRedditDirect() {
  const reddit = new RedditDirectAPI();

  try {
    // Test 1: Get access token
    console.log(chalk.yellow('Test 1: Getting OAuth2 Access Token...'));
    const token = await reddit.getAccessToken();
    console.log(chalk.green('✅ Token obtained successfully!'));
    console.log(chalk.dim(`  Token: ${token.substring(0, 10)}...`));

    // Test 2: Search for a topic
    console.log(chalk.yellow('\nTest 2: Searching for "AI content optimization"...'));
    const searchResults = await reddit.searchTopic('AI content optimization', 10);

    console.log(chalk.green('✅ Search successful!'));
    console.log(chalk.dim(`  Questions found: ${searchResults.questions.length}`));
    console.log(chalk.dim(`  Pain points: ${searchResults.painPoints.length}`));
    console.log(chalk.dim(`  Solutions: ${searchResults.solutions.length}`));

    if (searchResults.questions.length > 0) {
      console.log(chalk.cyan('\n  Sample questions:'));
      searchResults.questions.slice(0, 3).forEach(q => {
        console.log(chalk.dim(`    • ${q.question.substring(0, 80)}...`));
        console.log(chalk.dim(`      Score: ${q.score}, Comments: ${q.num_comments}`));
      });
    }

    // Test 3: Get subreddit insights
    console.log(chalk.yellow('\nTest 3: Getting insights from r/SEO and r/marketing...'));
    const subredditInsights = await reddit.getSubredditInsights(
      ['SEO', 'marketing'],
      'AI optimization',
      5
    );

    console.log(chalk.green('✅ Subreddit insights retrieved!'));
    subredditInsights.forEach(insight => {
      console.log(chalk.cyan(`\n  r/${insight.subreddit}:`));
      console.log(chalk.dim(`    Search results: ${insight.searchResults.questions.length} questions`));
      console.log(chalk.dim(`    Hot topics: ${insight.hotTopics.questions.length} questions`));
    });

    // Test 4: Find relevant subreddits
    console.log(chalk.yellow('\nTest 4: Finding relevant subreddits for "artificial intelligence"...'));
    const relevantSubs = await reddit.findRelevantSubreddits('artificial intelligence', 5);

    console.log(chalk.green('✅ Found relevant subreddits!'));
    relevantSubs.forEach(sub => {
      console.log(chalk.dim(`  • r/${sub.name} - ${sub.subscribers?.toLocaleString()} subscribers`));
    });

    return true;

  } catch (error) {
    console.log(chalk.red('\n❌ Error during testing:'));
    console.log(chalk.red(`  ${error.message}`));

    if (error.response) {
      console.log(chalk.red(`  Status: ${error.response.status}`));
      console.log(chalk.red(`  Data: ${JSON.stringify(error.response.data).substring(0, 200)}`));
    }

    return false;
  }
}

// Main execution
async function main() {
  const success = await testRedditDirect();

  console.log(chalk.cyan.bold('\n📊 Test Summary:\n'));

  if (success) {
    console.log(chalk.green.bold('✅ All tests passed!'));
    console.log(chalk.green('The Direct Reddit API implementation is working correctly.'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.cyan('  1. Update index.js to use RedditDirectAPI instead of RedditInsights'));
    console.log(chalk.cyan('  2. Run the full content generator with: npm start'));
  } else {
    console.log(chalk.red.bold('❌ Tests failed'));
    console.log(chalk.yellow('Please check your Reddit credentials:'));
    console.log(chalk.yellow('  1. Ensure your app is created at https://www.reddit.com/prefs/apps'));
    console.log(chalk.yellow('  2. App type should be "script" or "personal use script"'));
    console.log(chalk.yellow('  3. Update .env with correct CLIENT_ID and CLIENT_SECRET'));
  }
}

main().catch(console.error);