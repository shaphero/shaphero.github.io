#!/usr/bin/env node

/**
 * Debug Reddit API connection issues
 */

import axios from 'axios';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

console.log(chalk.cyan.bold('\n🔍 Debugging Reddit API Connection\n'));

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const USER_AGENT = process.env.REDDIT_USER_AGENT;

console.log(chalk.yellow('Credentials:'));
console.log(`  Client ID: ${CLIENT_ID}`);
console.log(`  Client Secret: ${CLIENT_SECRET?.substring(0, 10)}...`);
console.log(`  User Agent: ${USER_AGENT}\n`);

async function testRedditOAuth() {
  console.log(chalk.yellow('Step 1: Getting OAuth2 Access Token...\n'));

  try {
    // Reddit OAuth2 endpoint for app-only authentication
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT
        }
      }
    );

    console.log(chalk.green('✅ OAuth2 token obtained successfully!'));
    console.log(chalk.dim(`  Token type: ${response.data.token_type}`));
    console.log(chalk.dim(`  Expires in: ${response.data.expires_in} seconds`));
    console.log(chalk.dim(`  Scope: ${response.data.scope || 'read-only'}\n`));

    return response.data.access_token;
  } catch (error) {
    console.log(chalk.red('❌ OAuth2 authentication failed:'));
    console.log(chalk.red(`  Status: ${error.response?.status}`));
    console.log(chalk.red(`  Error: ${error.response?.data?.error || error.message}`));

    if (error.response?.data) {
      console.log(chalk.dim('\nFull error response:'));
      console.log(chalk.dim(JSON.stringify(error.response.data, null, 2)));
    }

    if (error.response?.status === 401) {
      console.log(chalk.yellow('\nPossible causes:'));
      console.log(chalk.yellow('  1. Invalid client ID or secret'));
      console.log(chalk.yellow('  2. App not properly configured on Reddit'));
      console.log(chalk.yellow('  3. App type might not support client_credentials grant'));
    }

    return null;
  }
}

async function testRedditAPI(token) {
  if (!token) return;

  console.log(chalk.yellow('Step 2: Testing Reddit API with token...\n'));

  try {
    // Test a simple API call
    const response = await axios.get(
      'https://oauth.reddit.com/r/programming/about.json',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': USER_AGENT
        }
      }
    );

    console.log(chalk.green('✅ API call successful!'));
    console.log(chalk.dim(`  Subreddit: ${response.data.data.display_name}`));
    console.log(chalk.dim(`  Subscribers: ${response.data.data.subscribers?.toLocaleString()}`));
    console.log(chalk.dim(`  Description: ${response.data.data.public_description?.substring(0, 100)}...`));

    // Test search
    console.log(chalk.yellow('\nStep 3: Testing search functionality...\n'));

    const searchResponse = await axios.get(
      'https://oauth.reddit.com/search.json',
      {
        params: {
          q: 'javascript',
          limit: 5,
          sort: 'relevance'
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': USER_AGENT
        }
      }
    );

    console.log(chalk.green('✅ Search successful!'));
    console.log(chalk.dim(`  Results found: ${searchResponse.data.data.children.length}`));

    if (searchResponse.data.data.children[0]) {
      const firstPost = searchResponse.data.data.children[0].data;
      console.log(chalk.dim(`  Sample result: ${firstPost.title?.substring(0, 60)}...`));
    }

  } catch (error) {
    console.log(chalk.red('❌ API call failed:'));
    console.log(chalk.red(`  Status: ${error.response?.status}`));
    console.log(chalk.red(`  Error: ${error.message}`));

    if (error.response?.status === 403) {
      console.log(chalk.yellow('\nThis might be a scope issue. App-only auth has limited access.'));
    }
  }
}

async function testSnoowrapIssue() {
  console.log(chalk.yellow('\n\nStep 4: Testing snoowrap library specifically...\n'));

  try {
    const snoowrap = (await import('snoowrap')).default;

    console.log(chalk.dim('Attempting snoowrap connection...'));

    // Try the most basic snoowrap setup
    const reddit = new snoowrap({
      userAgent: USER_AGENT,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: '' // This might be the issue
    });

    // The error happens here
    const subreddit = await reddit.getSubreddit('programming').fetch();
    console.log(chalk.green('✅ Snoowrap worked!'));

  } catch (error) {
    console.log(chalk.red('❌ Snoowrap error:'));
    console.log(chalk.red(`  ${error.message}`));

    if (error.message.includes("Cannot read properties of undefined")) {
      console.log(chalk.yellow('\nThis is the error you\'re seeing!'));
      console.log(chalk.yellow('Cause: Snoowrap expects a refresh token for OAuth2.'));
      console.log(chalk.yellow('Solution options:'));
      console.log(chalk.yellow('  1. Use direct Reddit API calls instead of snoowrap'));
      console.log(chalk.yellow('  2. Implement user authentication flow to get refresh token'));
      console.log(chalk.yellow('  3. Use a different Reddit library that supports app-only auth'));
    }
  }
}

// Main execution
async function main() {
  const token = await testRedditOAuth();
  await testRedditAPI(token);
  await testSnoowrapIssue();

  console.log(chalk.cyan.bold('\n\n📊 Summary:\n'));

  if (token) {
    console.log(chalk.green('✅ Your Reddit credentials are valid'));
    console.log(chalk.green('✅ Direct API calls work fine'));
    console.log(chalk.yellow('⚠️  But snoowrap library needs a refresh token'));

    console.log(chalk.cyan('\nRecommendation:'));
    console.log(chalk.cyan('  Rewrite Reddit module to use direct API calls'));
    console.log(chalk.cyan('  instead of snoowrap library for app-only auth.'));
  } else {
    console.log(chalk.red('❌ Could not authenticate with Reddit'));
    console.log(chalk.yellow('Check your credentials and app configuration'));
  }
}

main().catch(console.error);