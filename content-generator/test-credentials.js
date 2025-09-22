#!/usr/bin/env node

/**
 * Test API credentials
 */

import axios from 'axios';
import snoowrap from 'snoowrap';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

console.log(chalk.cyan.bold('\n🔐 Testing API Credentials\n'));

// Test DataForSEO
async function testDataForSEO() {
  console.log(chalk.yellow('Testing DataForSEO...'));

  const auth = {
    username: process.env.DATAFORSEO_API_LOGIN,
    password: process.env.DATAFORSEO_API_PASSWORD
  };

  console.log(chalk.dim(`  Username: ${auth.username}`));
  console.log(chalk.dim(`  Password: ${auth.password?.substring(0, 4)}****`));

  try {
    // Test with a simple ping endpoint first
    const response = await axios.get(
      'https://api.dataforseo.com/v3/appendix/user_data',
      { auth }
    );

    if (response.data.status_code === 20000) {
      console.log(chalk.green('✅ DataForSEO authenticated successfully!'));
      console.log(chalk.dim(`  Account: ${response.data.tasks?.[0]?.data?.login || 'Connected'}`));
      console.log(chalk.dim(`  Balance: $${response.data.tasks?.[0]?.data?.money?.balance || 'N/A'}`));

      // Now test a simple SERP request
      console.log(chalk.dim('  Testing SERP endpoint...'));

      const serpResponse = await axios.post(
        'https://api.dataforseo.com/v3/serp/google/organic/live/regular',
        [{
          keyword: 'test',
          location_code: 2840, // USA
          language_code: 'en'
        }],
        { auth }
      );

      if (serpResponse.data.tasks?.[0]?.status_code === 20000) {
        console.log(chalk.green('  ✅ SERP endpoint working!'));
        const results = serpResponse.data.tasks[0].result?.[0]?.items?.length || 0;
        console.log(chalk.dim(`  Results returned: ${results}`));
        return true;
      }
    }
  } catch (error) {
    console.log(chalk.red('❌ DataForSEO connection failed:'));
    if (error.response?.status === 401) {
      console.log(chalk.red('  Invalid credentials (401 Unauthorized)'));
    } else {
      console.log(chalk.red(`  ${error.message}`));
      if (error.response?.data) {
        console.log(chalk.dim(`  Response: ${JSON.stringify(error.response.data).substring(0, 200)}`));
      }
    }
    return false;
  }
}

// Test Reddit
async function testReddit() {
  console.log(chalk.yellow('\nTesting Reddit API...'));

  const creds = {
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET
  };

  console.log(chalk.dim(`  User Agent: ${creds.userAgent}`));
  console.log(chalk.dim(`  Client ID: ${creds.clientId?.substring(0, 6)}****`));
  console.log(chalk.dim(`  Client Secret: ${creds.clientSecret?.substring(0, 6)}****`));

  try {
    // Create Reddit instance with app-only auth
    const reddit = new snoowrap({
      userAgent: creds.userAgent,
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      refreshToken: '' // Empty for app-only auth
    });

    // Try to get a simple subreddit
    console.log(chalk.dim('  Testing subreddit access...'));
    const subreddit = await reddit.getSubreddit('programming').fetch();

    if (subreddit.display_name) {
      console.log(chalk.green('✅ Reddit API authenticated successfully!'));
      console.log(chalk.dim(`  Tested subreddit: r/${subreddit.display_name}`));
      console.log(chalk.dim(`  Subscribers: ${subreddit.subscribers?.toLocaleString()}`));

      // Test search
      console.log(chalk.dim('  Testing search...'));
      const searchResults = await reddit.search({
        query: 'javascript',
        limit: 5,
        sort: 'relevance'
      });

      console.log(chalk.green('  ✅ Search working!'));
      console.log(chalk.dim(`  Results returned: ${searchResults.length}`));

      return true;
    }
  } catch (error) {
    console.log(chalk.red('❌ Reddit connection failed:'));
    console.log(chalk.red(`  ${error.message}`));

    if (error.message.includes('401') || error.message.includes('403')) {
      console.log(chalk.red('  Invalid credentials or insufficient permissions'));
      console.log(chalk.dim('  Make sure your Reddit app is set up as a "script" type app'));
    }

    return false;
  }
}

// Run tests
async function main() {
  const results = {
    dataforseo: await testDataForSEO(),
    reddit: await testReddit()
  };

  console.log(chalk.cyan.bold('\n📊 Results Summary:\n'));

  if (results.dataforseo && results.reddit) {
    console.log(chalk.green.bold('✅ All APIs working correctly!'));
    console.log(chalk.green('   Your content generator is ready to use with real data.'));
  } else {
    if (!results.dataforseo) {
      console.log(chalk.yellow('⚠️  DataForSEO needs attention'));
      console.log(chalk.dim('   Check your credentials at https://app.dataforseo.com'));
    }
    if (!results.reddit) {
      console.log(chalk.yellow('⚠️  Reddit API needs attention'));
      console.log(chalk.dim('   Check your app at https://www.reddit.com/prefs/apps'));
    }
  }
}

main().catch(console.error);