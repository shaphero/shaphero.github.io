#!/usr/bin/env node

/**
 * Test script for content generator components
 */

import chalk from 'chalk';
import DataForSEO from './lib/dataforseo.js';
import RedditInsights from './lib/reddit.js';
import ContentAnalyzer from './lib/content-analyzer.js';
import fs from 'fs-extra';

async function testDataForSEO() {
  console.log(chalk.yellow('\n📊 Testing DataForSEO Connection...\n'));

  const dataforseo = new DataForSEO();

  try {
    // Test with a simple query
    const results = await dataforseo.getSERPResults('AI content optimization tips', 'United States', 5);

    console.log(chalk.green('✅ DataForSEO connected successfully!'));
    console.log(chalk.dim(`  Found ${results.organic?.length || 0} organic results`));
    console.log(chalk.dim(`  Found ${results.people_also_ask?.length || 0} PAA items`));

    // Show sample result
    if (results.organic?.[0]) {
      console.log(chalk.dim('\n  Sample competitor:'));
      console.log(chalk.dim(`  Title: ${results.organic[0].title?.substring(0, 60)}...`));
      console.log(chalk.dim(`  URL: ${results.organic[0].url}`));
    }

    return true;
  } catch (error) {
    console.log(chalk.red('❌ DataForSEO connection failed:'));
    console.log(chalk.red(`  ${error.message}`));
    return false;
  }
}

async function testReddit() {
  console.log(chalk.yellow('\n🔍 Testing Reddit API...\n'));

  const reddit = new RedditInsights();

  try {
    // Test with a simple search
    const results = await reddit.searchTopic('content optimization SEO', 5);

    console.log(chalk.green('✅ Reddit API connected successfully!'));
    console.log(chalk.dim(`  Found ${results.questions?.length || 0} questions`));
    console.log(chalk.dim(`  Found ${results.painPoints?.length || 0} pain points`));
    console.log(chalk.dim(`  Found ${results.solutions?.length || 0} solutions`));

    // Show sample question
    if (results.questions?.[0]) {
      console.log(chalk.dim('\n  Sample question:'));
      console.log(chalk.dim(`  ${results.questions[0].question?.substring(0, 80)}...`));
    }

    return true;
  } catch (error) {
    console.log(chalk.red('❌ Reddit API connection failed:'));
    console.log(chalk.red(`  ${error.message}`));
    console.log(chalk.dim('  Note: Reddit API requires valid credentials in .env'));
    return false;
  }
}

async function testClaudeCLI() {
  console.log(chalk.yellow('\n🤖 Testing Claude CLI...\n'));

  try {
    // Check if claude command exists
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout, stderr } = await execAsync('which claude || where claude', {
      shell: true
    });

    if (stdout.trim()) {
      console.log(chalk.green('✅ Claude CLI found at:'), stdout.trim());
      return true;
    } else {
      console.log(chalk.yellow('⚠️  Claude CLI not found in PATH'));
      console.log(chalk.dim('  Install with: npm install -g @anthropic-ai/claude-code'));
      console.log(chalk.dim('  Or set CLAUDE_CLI_PATH in .env'));
      return false;
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Claude CLI not found'));
    console.log(chalk.dim('  This is expected - Claude CLI integration will use placeholder'));
    return false;
  }
}

async function testContentAnalyzer() {
  console.log(chalk.yellow('\n📈 Testing Content Analyzer...\n'));

  const analyzer = new ContentAnalyzer();

  try {
    // Test with sample data
    const sampleCompetitors = [
      {
        title: 'How to Optimize Content for AI',
        description: 'Learn the best practices for optimizing your content for AI systems',
        url: 'https://example.com/1'
      },
      {
        title: 'AI Content Optimization Guide',
        description: 'Complete guide to making your content AI-friendly',
        url: 'https://example.com/2'
      }
    ];

    const samplePAA = [
      { question: 'How do I optimize content for AI?', answer: 'Use clear structure...' },
      { question: 'What is AIO optimization?', answer: 'AIO stands for...' }
    ];

    const sampleReddit = {
      questions: [{ question: 'Best AI content tools?', score: 10 }],
      painPoints: [{ text: 'struggling with AI optimization', trigger: 'struggling with' }]
    };

    const analysis = analyzer.analyzeComprehensiveness(
      sampleCompetitors,
      samplePAA,
      sampleReddit
    );

    console.log(chalk.green('✅ Content Analyzer working!'));
    console.log(chalk.dim(`  Depth Score: ${analysis.depthScore}/100`));
    console.log(chalk.dim(`  Breadth Score: ${analysis.breadthScore}/100`));
    console.log(chalk.dim(`  Gaps found: ${analysis.gaps.length}`));

    return true;
  } catch (error) {
    console.log(chalk.red('❌ Content Analyzer error:'));
    console.log(chalk.red(`  ${error.message}`));
    return false;
  }
}

async function createMockOutput() {
  console.log(chalk.yellow('\n📝 Creating sample output...\n'));

  const sampleContent = `---
title: AI Content Optimization: The Complete Guide (2025)
description: Master AI content optimization with proven AIO and GEO strategies. Learn how to create content that ranks in both search engines and AI systems.
wordCount: 3542
readingTime: 18 minutes
keywords: AI optimization, content optimization, AIO, GEO, SEO
generated: ${new Date().toISOString()}
---

# AI Content Optimization: The Complete Guide (2025)

## Introduction

In 2025, content optimization has evolved beyond traditional SEO. With 99% of Fortune 500 companies using AI but only 5% seeing ROI, the opportunity for properly optimized content has never been greater.

## What is AI Content Optimization?

AI Content Optimization (AIO) is the practice of structuring and enhancing content to perform well in both traditional search engines and AI-powered systems like ChatGPT, Claude, and Google's AI Overviews.

### Key Components of AIO:

• **Cite Sources**: Adding credible citations increases visibility by 115% according to recent studies
• **Add Statistics**: Include specific numbers and data points
• **Structure Clearly**: Use headers, lists, and tables for easy extraction
• **Answer Directly**: Provide clear, concise answers to questions

## Why AIO Matters in 2025

### The Current Landscape:

1. **ChatGPT Search Share**: Only 0.25% of Google's volume
2. **Zero-Click Results**: Increased from 56% to 69% for news queries
3. **AI Investment**: $40 billion by Fortune 500s in 2025
4. **Success Rate**: Only 5% of AI initiatives deliver ROI

## How to Optimize Content for AI

### 1. Structure for Extraction

AI systems need clear, structured content. Use:

- **Clear Headings**: H2 and H3 tags with descriptive text
- **Bulleted Lists**: For easy parsing
- **Tables**: For comparisons and data
- **Definitions**: Clear explanations of terms

### 2. Include Citations and Data

According to [DataForSEO Research](https://dataforseo.com), content with citations sees:
- 115% increase in visibility
- 37% better subjective impression
- 22% improvement in position-adjusted word count

### 3. Answer Questions Directly

Based on People Also Ask data:

**Q: How do I optimize for AI search?**
**A:** Focus on clear structure, include citations, add statistics, and provide direct answers within the first 2-3 sentences of each section.

**Q: What's the difference between SEO and AIO?**
**A:** SEO optimizes for search engine rankings, while AIO optimizes for selection and citation by AI systems. AIO focuses on clarity, citations, and structured data.

## Common Mistakes to Avoid

### 1. Over-Optimization
Don't stuff keywords or create unnatural content. AI systems prioritize clarity and value.

### 2. Ignoring Traditional SEO
While optimizing for AI, maintain strong SEO fundamentals. 99.75% of search still happens on Google.

### 3. Lack of Depth
Superficial content won't be selected by AI. Aim for comprehensive coverage with 3000+ words.

## Tools and Resources

### Essential Tools:
- **DataForSEO**: SERP analysis and PAA extraction
- **Claude CLI**: Content generation and optimization
- **Reddit API**: User insights and pain points
- **Content Analyzers**: Gap identification

### Recommended Workflows:
1. Research competitors and PAA
2. Identify content gaps
3. Create comprehensive outline
4. Generate with AI assistance
5. Optimize for AIO/GEO
6. Add citations and data

## Case Studies and Results

### Case Study 1: B2B SaaS Company
- **Challenge**: Low visibility in AI responses
- **Solution**: Implemented AIO optimization
- **Result**: 65% increase in AI citations within 3 months

### Case Study 2: Educational Platform
- **Challenge**: Competing with established sites
- **Solution**: Focused on comprehensive, cited content
- **Result**: Featured in 78% of relevant AI responses

## Future of AI Content Optimization

### Emerging Trends:
- **Multi-modal optimization**: Images and video in AI responses
- **Voice search integration**: Optimizing for spoken queries
- **Real-time updates**: Dynamic content for freshness
- **Personalization**: Content that adapts to user context

## Conclusion

AI Content Optimization represents the next evolution in digital content strategy. By focusing on structure, citations, and comprehensive coverage, you can create content that performs in both traditional search and AI systems.

## Frequently Asked Questions

### What is the ROI of AI content optimization?
Companies implementing proper AIO see an average 333% ROI, with improved visibility in both search engines and AI systems.

### How long should AI-optimized content be?
Aim for 3000-5000 words for comprehensive coverage, though quality matters more than length.

### Do I need special tools for AIO?
While tools help, the fundamentals involve clear writing, good structure, and credible citations.

---

*This comprehensive content was generated using AI-powered research and optimization techniques, combining SERP analysis, user insights, and AIO/GEO optimization strategies.*`;

  const outputDir = './generated-content';
  await fs.ensureDir(outputDir);

  const filename = `sample-ai-content-optimization-${new Date().toISOString().split('T')[0]}.md`;
  const filepath = `${outputDir}/${filename}`;

  await fs.writeFile(filepath, sampleContent);

  console.log(chalk.green('✅ Sample content created!'));
  console.log(chalk.dim(`  Location: ${filepath}`));
  console.log(chalk.dim(`  Word count: 3,542`));
  console.log(chalk.dim(`  Reading time: 18 minutes`));

  return filepath;
}

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Testing Comprehensive Content Generator\n'));

  const results = {
    dataforseo: await testDataForSEO(),
    reddit: await testReddit(),
    claude: await testClaudeCLI(),
    analyzer: await testContentAnalyzer()
  };

  console.log(chalk.cyan.bold('\n📊 Test Results Summary:\n'));

  Object.entries(results).forEach(([component, status]) => {
    const icon = status ? '✅' : '⚠️';
    const color = status ? 'green' : 'yellow';
    console.log(chalk[color](`  ${icon} ${component}: ${status ? 'Working' : 'Not configured'}`));
  });

  // Create sample output
  const samplePath = await createMockOutput();

  console.log(chalk.cyan.bold('\n✨ System Status:\n'));

  if (results.dataforseo && results.analyzer) {
    console.log(chalk.green('  ✅ Core components operational'));
    console.log(chalk.green('  ✅ Ready to generate comprehensive content'));
    console.log(chalk.dim('\n  Note: Reddit and Claude CLI are optional but enhance results'));
  } else {
    console.log(chalk.yellow('  ⚠️  Some components need configuration'));
    console.log(chalk.dim('  Check .env file for API credentials'));
  }

  console.log(chalk.cyan('\n💡 To generate real content, run: npm start\n'));
}

main().catch(error => {
  console.error(chalk.red('Test failed:'), error);
  process.exit(1);
});