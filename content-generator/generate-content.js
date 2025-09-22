#!/usr/bin/env node

/**
 * Simplified Content Generator
 * Works with DataForSEO only (Reddit optional)
 */

import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import DataForSEO from './lib/dataforseo.js';
import ClaudeCLI from './lib/claude-cli.js';
import ContentAnalyzer from './lib/content-analyzer.js';

console.log(chalk.cyan.bold('\n🚀 AI Content Generator\n'));

// Get topic from user
const { topic } = await prompts({
  type: 'text',
  name: 'topic',
  message: 'What topic would you like to create content about?',
  initial: 'AI content optimization strategies for 2025'
});

if (!topic) {
  console.log(chalk.red('No topic provided. Exiting.'));
  process.exit(0);
}

console.log(chalk.green(`\n✅ Generating comprehensive content for: "${topic}"\n`));

// Phase 1: DataForSEO Research
console.log(chalk.yellow('📊 Phase 1: SERP Analysis & Research\n'));

let spinner = ora('Analyzing competitor content...').start();

const dataforseo = new DataForSEO();
const research = {
  competitors: [],
  paa: [],
  relatedSearches: [],
  reddit: {
    questions: [],
    painPoints: [],
    solutions: [],
    commonThemes: [],
    userLanguage: [],
    topConcerns: []
  }
};

try {
  // Get competitor analysis
  research.competitors = await dataforseo.analyzeCompetitorContent(topic);
  spinner.succeed(`Analyzed ${research.competitors.length} competitor pages`);

  // Get PAA questions
  spinner = ora('Extracting People Also Ask questions...').start();
  research.paa = await dataforseo.getPAAQuestions(topic);
  spinner.succeed(`Found ${research.paa.length} PAA questions`);

  // Get related searches
  spinner = ora('Finding related searches...').start();
  research.relatedSearches = await dataforseo.getRelatedSearches(topic);
  spinner.succeed(`Found ${research.relatedSearches.length} related searches`);

} catch (error) {
  spinner.fail('DataForSEO error - using demo data');
  console.log(chalk.yellow('  Using demo data for demonstration purposes'));

  // Use demo data if API fails
  research.competitors = [
    {
      url: "https://example.com/ai-content-guide",
      title: "AI Content Optimization: Complete Guide",
      description: "Learn how to optimize content for AI systems with proven strategies."
    }
  ];
  research.paa = [
    { question: "What is AI content optimization?", answer: "AI content optimization is the practice of structuring content for AI systems." },
    { question: "How does GEO differ from SEO?", answer: "GEO focuses on generative engines while SEO targets search engines." }
  ];
  research.relatedSearches = ["AI SEO", "generative engine optimization", "ChatGPT optimization"];
}

// Phase 2: Reddit User Insights (if available)
let redditInsights = null;

if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
  spinner = ora('Gathering Reddit user insights...').start();

  try {
    // Try direct API implementation since snoowrap has issues
    const RedditDirectAPI = (await import('./lib/reddit-direct.js')).default;
    const reddit = new RedditDirectAPI();
    redditInsights = await reddit.searchTopic(topic, 20);

    spinner.succeed('Reddit insights gathered');
    console.log(chalk.dim(`  • Questions: ${redditInsights.questions.length}`));
    console.log(chalk.dim(`  • Pain points: ${redditInsights.painPoints.length}`));
    console.log(chalk.dim(`  • Solutions: ${redditInsights.solutions.length}`));
  } catch (error) {
    spinner.warn('Reddit API unavailable - continuing without user insights');
    console.log(chalk.yellow(`  Note: Reddit authentication failed. Check your app credentials.`));
    console.log(chalk.yellow(`  The generator will continue using DataForSEO data only.`));

    // Create empty insights structure
    redditInsights = {
      questions: [],
      painPoints: [],
      solutions: [],
      commonThemes: [],
      userLanguage: [],
      topConcerns: []
    };
  }
} else {
  console.log(chalk.yellow('ℹ️  No Reddit credentials found - skipping user insights'));
  redditInsights = {
    questions: [],
    painPoints: [],
    solutions: [],
    commonThemes: [],
    userLanguage: [],
    topConcerns: []
  };
}

// Phase 3: Content Analysis
console.log(chalk.yellow('\n🔍 Phase 3: Content Gap Analysis\n'));

spinner = ora('Analyzing content gaps and opportunities...').start();

const analyzer = new ContentAnalyzer();
const analysis = analyzer.analyzeComprehensiveness(
  research.competitors,
  research.paa,
  redditInsights
);

spinner.succeed('Analysis complete');
console.log(chalk.dim(`  • Depth Score: ${analysis.depthScore}/100`));
console.log(chalk.dim(`  • Breadth Score: ${analysis.breadthScore}/100`));
console.log(chalk.dim(`  • Content Gaps: ${analysis.gaps.length}`));
console.log(chalk.dim(`  • Opportunities: ${analysis.opportunities.length}`));

// Phase 4: Claude CLI Generation
console.log(chalk.yellow('\n✍️  Phase 4: AI Content Generation\n'));

const claude = new ClaudeCLI();

// Check if Claude is available
if (!claude.isAvailable()) {
  console.log(chalk.yellow('⚠️  Claude CLI not detected - showing outline only\n'));

  // Generate outline manually
  const outline = {
    title: `${topic}: The Ultimate Guide (2025)`,
    sections: [
      {
        title: 'Introduction & Overview',
        points: ['Definition and importance', 'Current landscape', 'Why it matters now']
      },
      {
        title: 'Core Concepts & Fundamentals',
        points: research.paa.slice(0, 3).map(q => q.question)
      },
      {
        title: 'Advanced Strategies',
        points: analysis.opportunities.slice(0, 3).map(o => o.type)
      },
      {
        title: 'Implementation Guide',
        points: ['Step-by-step process', 'Tools and resources', 'Common mistakes']
      },
      {
        title: 'Case Studies & Results',
        points: ['Success stories', 'Metrics and KPIs', 'Lessons learned']
      },
      {
        title: 'FAQ & Troubleshooting',
        points: research.paa.slice(3, 6).map(q => q.question)
      }
    ]
  };

  console.log(chalk.cyan(`📝 Content Outline: ${outline.title}\n`));
  outline.sections.forEach((section, index) => {
    console.log(chalk.green(`${index + 1}. ${section.title}`));
    section.points.forEach(point => {
      console.log(chalk.dim(`   • ${point}`));
    });
    console.log('');
  });

  console.log(chalk.yellow('To generate full content, install Claude CLI:'));
  console.log(chalk.cyan('  https://github.com/anthropics/claude-cli'));

} else {
  spinner = ora('Generating comprehensive content with Claude...').start();

  try {
    // Generate outline
    const outlineText = await claude.generateOutline(topic, {
      competitors: research.competitors.slice(0, 5),
      paa: research.paa.slice(0, 10),
      reddit: redditInsights,
      gaps: analysis.gaps,
      opportunities: analysis.opportunities
    });

    spinner.succeed('Outline generated');

    // Generate content
    spinner = ora('Writing detailed content...').start();
    const content = await claude.generateLongFormContent(
      { sections: parseOutline(outlineText) },
      research,
      { style: 'informative' }
    );

    spinner.succeed('Content generated');

    // Optimize for AIO/GEO
    spinner = ora('Optimizing for AI systems...').start();
    const keywords = [topic, ...research.relatedSearches.slice(0, 5)];
    const optimized = await claude.optimizeForAIOGEO(
      content.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n'),
      keywords
    );

    spinner.succeed('Optimization complete');

    // Save content
    const outputDir = './generated-content';
    fs.ensureDirSync(outputDir);

    const filename = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const timestamp = new Date().toISOString().split('T')[0];
    const outputPath = path.join(outputDir, `${filename}-${timestamp}.md`);

    const wordCount = optimized.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const fullDocument = `---
title: ${topic}: The Ultimate Guide (2025)
wordCount: ${wordCount}
readingTime: ${readingTime} minutes
generated: ${new Date().toISOString()}
---

# ${topic}: The Ultimate Guide (2025)

${optimized}

---

*Generated with AI-powered research and optimization combining SERP analysis, user insights, and AIO/GEO strategies.*`;

    await fs.writeFile(outputPath, fullDocument);

    console.log(chalk.green(`\n✅ Content saved to: ${outputPath}`));
    console.log(chalk.dim(`   • Word Count: ${wordCount.toLocaleString()}`));
    console.log(chalk.dim(`   • Reading Time: ${readingTime} minutes`));

  } catch (error) {
    spinner.fail('Claude generation failed');
    console.log(chalk.red(`Error: ${error.message}`));
    console.log(chalk.yellow('\nPlease check that Claude CLI is properly configured.'));
  }
}

console.log(chalk.green.bold('\n✨ Generation complete!\n'));

// Helper function to parse outline
function parseOutline(outlineText) {
  const sections = [];
  const lines = outlineText.split('\n');

  let currentSection = null;

  lines.forEach(line => {
    if (line.match(/^##\s+(?!#)/)) {
      currentSection = {
        title: line.replace(/^##\s+/, '').trim(),
        points: []
      };
      sections.push(currentSection);
    } else if (line.match(/^[-•*]\s+/) && currentSection) {
      currentSection.points.push(line.replace(/^[-•*]\s+/, '').trim());
    }
  });

  return sections;
}