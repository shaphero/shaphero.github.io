#!/usr/bin/env node

/**
 * Test Reddit API with username/password authentication
 */

import axios from 'axios';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

console.log(chalk.cyan.bold('\n🔍 Testing Reddit Password Authentication\n'));

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const USERNAME = process.env.REDDIT_USERNAME;
const PASSWORD = process.env.REDDIT_PASSWORD;
const USER_AGENT = process.env.REDDIT_USER_AGENT;

console.log(chalk.yellow('Credentials:'));
console.log(`  Client ID: ${CLIENT_ID}`);
console.log(`  Client Secret: ${CLIENT_SECRET?.substring(0, 10)}...`);
console.log(`  Username: ${USERNAME}`);
console.log(`  Password: ${PASSWORD ? '****' : 'Not provided'}`);
console.log(`  User Agent: ${USER_AGENT}\n`);

async function testPasswordAuth() {
  console.log(chalk.yellow('Testing password authentication...\n'));

  try {
    // Use password grant type for script applications
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', USERNAME);
    params.append('password', PASSWORD);

    console.log(chalk.dim('Sending authentication request...'));

    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      params,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT
        }
      }
    );

    console.log(chalk.green('✅ Authentication successful!'));
    console.log(chalk.dim(`  Token type: ${response.data.token_type}`));
    console.log(chalk.dim(`  Expires in: ${response.data.expires_in} seconds`));
    console.log(chalk.dim(`  Scope: ${response.data.scope || 'all'}`));

    return response.data.access_token;

  } catch (error) {
    console.log(chalk.red('❌ Authentication failed:'));
    console.log(chalk.red(`  Status: ${error.response?.status}`));
    console.log(chalk.red(`  Error: ${error.response?.data?.error || error.message}`));

    if (error.response?.data) {
      console.log(chalk.dim('\nFull error response:'));
      console.log(chalk.dim(JSON.stringify(error.response.data, null, 2)));
    }

    if (error.response?.status === 401) {
      console.log(chalk.yellow('\nPossible causes:'));
      console.log(chalk.yellow('  1. Wrong username or password'));
      console.log(chalk.yellow('  2. App not configured as "script" type'));
      console.log(chalk.yellow('  3. Client ID/Secret mismatch'));
    }

    return null;
  }
}

async function testAPI(token) {
  if (!token) return;

  console.log(chalk.yellow('\nTesting Reddit API with token...\n'));

  try {
    // Test getting user info
    console.log(chalk.dim('Getting user info...'));
    const userResponse = await axios.get(
      'https://oauth.reddit.com/api/v1/me',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': USER_AGENT
        }
      }
    );

    console.log(chalk.green('✅ User info retrieved!'));
    console.log(chalk.dim(`  Username: ${userResponse.data.name}`));
    console.log(chalk.dim(`  Karma: ${userResponse.data.link_karma + userResponse.data.comment_karma}`));

    // Test search
    console.log(chalk.dim('\nTesting search functionality...'));
    const searchResponse = await axios.get(
      'https://oauth.reddit.com/search.json',
      {
        params: {
          q: 'AI content optimization',
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

    return true;

  } catch (error) {
    console.log(chalk.red('❌ API call failed:'));
    console.log(chalk.red(`  Status: ${error.response?.status}`));
    console.log(chalk.red(`  Error: ${error.message}`));
    return false;
  }
}

// Main execution
async function main() {
  const token = await testPasswordAuth();
  const apiWorks = await testAPI(token);

  console.log(chalk.cyan.bold('\n📊 Summary:\n'));

  if (token && apiWorks) {
    console.log(chalk.green('✅ Reddit authentication working!'));
    console.log(chalk.green('✅ API calls successful!'));
    console.log(chalk.cyan('\nYour Reddit integration is ready to use.'));
  } else if (token) {
    console.log(chalk.yellow('⚠️  Authentication works but API calls failed'));
  } else {
    console.log(chalk.red('❌ Authentication failed'));
    console.log(chalk.yellow('\nTroubleshooting steps:'));
    console.log(chalk.yellow('1. Verify your app type is "script" at https://www.reddit.com/prefs/apps'));
    console.log(chalk.yellow('2. Check that Client ID is from "personal use script" field'));
    console.log(chalk.yellow('3. Verify Client Secret is correct'));
    console.log(chalk.yellow('4. Confirm username and password are correct'));
  }
}

main().catch(console.error);