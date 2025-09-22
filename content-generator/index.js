#!/usr/bin/env node

/**
 * Comprehensive Content Generator
 * Main orchestrator that combines all modules
 */

import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { marked } from 'marked';

import DataForSEO from './lib/dataforseo.js';
import RedditInsights from './lib/reddit.js';
import ClaudeCLI from './lib/claude-cli.js';
import ContentAnalyzer from './lib/content-analyzer.js';

class ContentGenerator {
  constructor() {
    this.dataforseo = new DataForSEO();
    this.reddit = new RedditInsights();
    this.claude = new ClaudeCLI();
    this.analyzer = new ContentAnalyzer();
    this.outputDir = './generated-content';
    fs.ensureDirSync(this.outputDir);
  }

  /**
   * Main generation flow
   */
  async generate() {
    console.log(chalk.cyan.bold('\n🚀 Comprehensive Content Generator\n'));

    // Get topic from user
    const { topic, style, depth } = await this.getUserInput();

    // Phase 1: Research
    console.log(chalk.yellow('\n📊 Phase 1: Research & Analysis\n'));
    const research = await this.conductResearch(topic);

    // Phase 2: Analysis
    console.log(chalk.yellow('\n🔍 Phase 2: Content Gap Analysis\n'));
    const analysis = await this.analyzeContent(research);

    // Phase 3: Outline Generation
    console.log(chalk.yellow('\n📝 Phase 3: Comprehensive Outline Generation\n'));
    const outline = await this.generateOutline(topic, research, analysis);

    // Phase 4: Content Generation
    console.log(chalk.yellow('\n✍️  Phase 4: Content Generation\n'));
    const content = await this.generateContent(outline, research, style);

    // Phase 5: Optimization
    console.log(chalk.yellow('\n⚡ Phase 5: AIO/GEO Optimization\n'));
    const optimized = await this.optimizeContent(content, topic, research);

    // Phase 6: Finalization
    console.log(chalk.yellow('\n✅ Phase 6: Finalization\n'));
    const final = await this.finalizeContent(optimized, topic, analysis);

    // Save output
    await this.saveContent(final, topic);

    console.log(chalk.green.bold('\n✨ Content generation complete!\n'));
    return final;
  }

  /**
   * Get user input
   */
  async getUserInput() {
    const response = await prompts([
      {
        type: 'text',
        name: 'topic',
        message: 'What topic would you like to create comprehensive content for?',
        validate: value => value.length > 0 || 'Please enter a topic'
      },
      {
        type: 'select',
        name: 'style',
        message: 'Select content style:',
        choices: [
          { title: 'Informative', value: 'informative', description: 'Factual and educational' },
          { title: 'Conversational', value: 'conversational', description: 'Friendly and engaging' },
          { title: 'Technical', value: 'technical', description: 'Detailed and precise' },
          { title: 'Persuasive', value: 'persuasive', description: 'Compelling and convincing' }
        ]
      },
      {
        type: 'select',
        name: 'depth',
        message: 'Select content depth:',
        choices: [
          { title: 'Standard (2000-3000 words)', value: 'standard' },
          { title: 'Comprehensive (3000-5000 words)', value: 'comprehensive' },
          { title: 'Ultimate Guide (5000+ words)', value: 'ultimate' }
        ]
      }
    ]);

    return response;
  }

  /**
   * Conduct comprehensive research
   */
  async conductResearch(topic) {
    const research = {
      serp: {},
      paa: [],
      reddit: {},
      competitors: [],
      relatedSearches: []
    };

    // DataForSEO Research
    const serpSpinner = ora('Analyzing SERP results...').start();
    try {
      research.competitors = await this.dataforseo.analyzeCompetitorContent(topic);
      research.serp = research.competitors;
      serpSpinner.succeed('SERP analysis complete');
    } catch (error) {
      serpSpinner.fail('SERP analysis failed');
      console.error(error.message);
    }

    const paaSpinner = ora('Extracting People Also Ask questions...').start();
    try {
      research.paa = await this.dataforseo.getPAAQuestions(topic);
      paaSpinner.succeed(`Found ${research.paa.length} PAA questions`);
    } catch (error) {
      paaSpinner.fail('PAA extraction failed');
    }

    const relatedSpinner = ora('Finding related searches...').start();
    try {
      research.relatedSearches = await this.dataforseo.getRelatedSearches(topic);
      relatedSpinner.succeed(`Found ${research.relatedSearches.length} related searches`);
    } catch (error) {
      relatedSpinner.fail('Related searches failed');
    }

    // Reddit Research
    const redditSpinner = ora('Analyzing Reddit discussions...').start();
    try {
      research.reddit = await this.reddit.searchTopic(topic);

      // Find relevant subreddits
      const subreddits = await this.reddit.findRelevantSubreddits(topic);
      if (subreddits.length > 0) {
        const subredditNames = subreddits.slice(0, 3).map(s => s.name);
        const subredditInsights = await this.reddit.getSubredditInsights(subredditNames, topic);
        research.reddit.subredditInsights = subredditInsights;
      }

      redditSpinner.succeed('Reddit analysis complete');
    } catch (error) {
      redditSpinner.fail('Reddit analysis failed');
      console.error(error.message);
    }

    return research;
  }

  /**
   * Analyze content gaps and opportunities
   */
  async analyzeContent(research) {
    const spinner = ora('Analyzing content gaps...').start();

    const analysis = this.analyzer.analyzeComprehensiveness(
      research.competitors.competitors || [],
      research.paa || [],
      research.reddit || {}
    );

    spinner.succeed(`Found ${analysis.gaps.length} content gaps`);

    // Display analysis summary
    console.log(chalk.dim('\n📈 Analysis Summary:'));
    console.log(chalk.dim(`  • Depth Score: ${analysis.depthScore}/100`));
    console.log(chalk.dim(`  • Breadth Score: ${analysis.breadthScore}/100`));
    console.log(chalk.dim(`  • Unanswered Questions: ${analysis.questionsUnanswered.length}`));
    console.log(chalk.dim(`  • Content Gaps: ${analysis.gaps.length}`));
    console.log(chalk.dim(`  • Opportunities: ${analysis.opportunities.length}\n`));

    return analysis;
  }

  /**
   * Generate comprehensive outline
   */
  async generateOutline(topic, research, analysis) {
    const spinner = ora('Generating comprehensive outline...').start();

    const outlineText = await this.claude.generateOutline(topic, {
      competitors: research.competitors.competitors?.slice(0, 5),
      paa: research.paa?.slice(0, 10),
      reddit: {
        questions: research.reddit.questions?.slice(0, 5),
        painPoints: research.reddit.painPoints?.slice(0, 5),
        themes: research.reddit.commonThemes?.slice(0, 5)
      },
      gaps: analysis.gaps,
      opportunities: analysis.opportunities
    });

    // Parse outline into structured format
    const outline = this.parseOutline(outlineText);

    spinner.succeed(`Generated outline with ${outline.sections.length} main sections`);

    return outline;
  }

  /**
   * Generate content for each section
   */
  async generateContent(outline, research, style) {
    const spinner = ora('Generating comprehensive content...').start();

    const sections = await this.claude.generateLongFormContent(
      outline,
      research,
      { style }
    );

    spinner.succeed('Content generation complete');

    // Combine sections
    const fullContent = sections.map(s =>
      `## ${s.title}\n\n${s.content}`
    ).join('\n\n');

    return fullContent;
  }

  /**
   * Optimize content for AIO/GEO
   */
  async optimizeContent(content, topic, research) {
    const spinner = ora('Optimizing for AIO/GEO...').start();

    // Extract keywords
    const keywords = [
      topic,
      ...research.relatedSearches?.slice(0, 5) || []
    ];

    const optimized = await this.claude.optimizeForAIOGEO(content, keywords);

    spinner.succeed('AIO/GEO optimization complete');

    return optimized;
  }

  /**
   * Finalize content with FAQ, meta, etc.
   */
  async finalizeContent(content, topic, analysis) {
    const spinner = ora('Finalizing content...').start();

    let finalContent = content;

    // Add FAQ section
    if (analysis.questionsUnanswered?.length > 0) {
      const faq = await this.claude.generateFAQ(
        topic,
        analysis.questionsUnanswered.slice(0, 10)
      );
      finalContent += `\n\n${faq}`;
    }

    // Generate meta description
    const metaDescription = await this.claude.generateMetaDescription(topic, content);

    // Add content metadata
    const metadata = {
      title: this.generateTitle(topic),
      metaDescription,
      wordCount: this.countWords(finalContent),
      readingTime: Math.ceil(this.countWords(finalContent) / 200),
      lastUpdated: new Date().toISOString(),
      keywords: this.extractMainKeywords(finalContent)
    };

    spinner.succeed('Content finalized');

    return {
      content: finalContent,
      metadata
    };
  }

  /**
   * Save generated content
   */
  async saveContent(final, topic) {
    const spinner = ora('Saving content...').start();

    const filename = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const timestamp = new Date().toISOString().split('T')[0];
    const outputPath = path.join(this.outputDir, `${filename}-${timestamp}.md`);

    // Create full document
    const fullDocument = `---
title: ${final.metadata.title}
description: ${final.metadata.metaDescription}
wordCount: ${final.metadata.wordCount}
readingTime: ${final.metadata.readingTime} minutes
keywords: ${final.metadata.keywords.join(', ')}
generated: ${final.metadata.lastUpdated}
---

# ${final.metadata.title}

${final.content}

---

*This comprehensive content was generated using AI-powered research and optimization techniques, combining SERP analysis, user insights, and AIO/GEO optimization strategies.*`;

    await fs.writeFile(outputPath, fullDocument);

    // Also save HTML version
    const htmlPath = outputPath.replace('.md', '.html');
    const htmlContent = marked(fullDocument);
    const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${final.metadata.title}</title>
  <meta name="description" content="${final.metadata.metaDescription}">
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 20px; color: #666; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    await fs.writeFile(htmlPath, htmlDocument);

    spinner.succeed(`Content saved to ${outputPath}`);

    console.log(chalk.dim(`\n📊 Content Statistics:`));
    console.log(chalk.dim(`  • Word Count: ${final.metadata.wordCount.toLocaleString()}`));
    console.log(chalk.dim(`  • Reading Time: ${final.metadata.readingTime} minutes`));
    console.log(chalk.dim(`  • Keywords: ${final.metadata.keywords.length}`));
  }

  /**
   * Parse outline text into structured format
   */
  parseOutline(outlineText) {
    const sections = [];
    const lines = outlineText.split('\n');

    let currentSection = null;
    let currentSubsection = null;

    lines.forEach(line => {
      // Main section (H2)
      if (line.match(/^##\s+(?!#)/)) {
        currentSection = {
          title: line.replace(/^##\s+/, '').trim(),
          subsections: [],
          points: []
        };
        sections.push(currentSection);
        currentSubsection = null;
      }
      // Subsection (H3)
      else if (line.match(/^###\s+/)) {
        currentSubsection = {
          title: line.replace(/^###\s+/, '').trim(),
          points: []
        };
        if (currentSection) {
          currentSection.subsections.push(currentSubsection);
        }
      }
      // Bullet points
      else if (line.match(/^[-•*]\s+/)) {
        const point = line.replace(/^[-•*]\s+/, '').trim();
        if (currentSubsection) {
          currentSubsection.points.push(point);
        } else if (currentSection) {
          currentSection.points.push(point);
        }
      }
    });

    return { sections };
  }

  /**
   * Generate optimized title
   */
  generateTitle(topic) {
    // Create compelling, SEO-friendly title
    const year = new Date().getFullYear();
    const templates = [
      `${topic}: The Complete Guide (${year})`,
      `Ultimate ${topic} Guide: Everything You Need to Know`,
      `${topic} Explained: Comprehensive Analysis & Best Practices`,
      `Master ${topic}: Expert Strategies and Insights (${year})`,
      `The Definitive ${topic} Resource: Research-Backed Guide`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Count words in content
   */
  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract main keywords
   */
  extractMainKeywords(content) {
    // Simple keyword extraction
    const words = content.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4);

    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ContentGenerator();
  generator.generate().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  });
}

export default ContentGenerator;