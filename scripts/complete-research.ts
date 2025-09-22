#!/usr/bin/env node

/**
 * Complete Research Pipeline Script
 * Uses Claude Code CLI as AI backend with your Max Pro subscription
 */

import { CompletePipeline } from '../src/lib/content-pipeline/complete-pipeline';
import type { ResearchRequest } from '../src/lib/content-pipeline/config';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🚀 COMPLETE RESEARCH PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This pipeline combines:
✓ DataForSEO for real search data
✓ Reddit API for community insights
✓ Web scraping for full content
✓ OpenAI embeddings for semantic search
✓ Claude Code for AI synthesis (your Max Pro)
✓ Multi-format output generation

Usage: npm run complete-research "<topic>" [options]

Options:
  --depth      quick | standard | comprehensive (default: standard)
  --audience   executive | technical | general (default: general)
  --format     article | report | analysis (default: article)
  --output     Output directory (default: ./research-output)
  --sources    Max number of sources (default: 15)

Examples:
  npm run complete-research "AI implementation costs 2025"
  npm run complete-research "enterprise AI ROI" --depth comprehensive
  npm run complete-research "AI talent shortage" --audience executive

Output:
  - Astro component (.astro) for your website
  - Markdown report (.md) for documentation
  - HTML file (.html) for standalone viewing
  - Metadata (.meta.json) with all research data
  - Quality score (.score.json) with analysis metrics

Requirements:
  ✓ Claude Code CLI installed (for synthesis)
  ✓ .env file with API keys (DataForSEO, Reddit, OpenAI)
    `);
    return;
  }

  const keyword = args[0];
  const options = parseArgs(args.slice(1));

  console.log(`
🔬 STARTING COMPLETE RESEARCH PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Topic: "${keyword}"
Depth: ${options.depth}
Audience: ${options.audience}
Format: ${options.format}
Max Sources: ${options.maxSources}
Output: ${options.output}
`);

  // Load environment variables
  await loadEnv();

  // Verify API keys
  verifyEnvironment();

  const request: ResearchRequest = {
    keyword,
    depth: options.depth,
    audience: options.audience,
    format: options.format,
    maxSources: options.maxSources,
    includeReddit: true,
    includeNews: options.depth !== 'quick'
  };

  try {
    const startTime = Date.now();
    const pipeline = new CompletePipeline();

    // Run the complete pipeline
    const result = await pipeline.research(request);

    // Generate quality score
    const qualityScore = pipeline.generateQualityScore(result);

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 GENERATING OUTPUT FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    // Create output directory
    const outputDir = options.output;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = slugify(keyword);

    // Generate all output formats
    const outputs = [
      {
        name: 'Astro Component',
        path: path.join(outputDir, `${baseName}.astro`),
        content: await pipeline.generateAstroPage(result)
      },
      {
        name: 'Markdown Report',
        path: path.join(outputDir, `${baseName}.md`),
        content: await pipeline.generateMarkdown(result)
      },
      {
        name: 'HTML Document',
        path: path.join(outputDir, `${baseName}.html`),
        content: await pipeline.generateHTML(result)
      },
      {
        name: 'Research Metadata',
        path: path.join(outputDir, `${baseName}.meta.json`),
        content: JSON.stringify(result, null, 2)
      },
      {
        name: 'Quality Score',
        path: path.join(outputDir, `${baseName}.score.json`),
        content: JSON.stringify(qualityScore, null, 2)
      }
    ];

    // Save all files
    outputs.forEach(output => {
      fs.writeFileSync(output.path, output.content);
      console.log(`✅ ${output.name}: ${output.path}`);
    });

    const elapsedTime = Math.round((Date.now() - startTime) / 1000);

    console.log(`
╔════════════════════════════════════════════════════╗
║              RESEARCH COMPLETE! 🎉                 ║
╚════════════════════════════════════════════════════╝

📊 RESEARCH METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quality Score: ${qualityScore.score}/100
Sources Analyzed: ${result.meta.sources.length}
Insights Extracted: ${result.insights.length}
Sections Generated: ${result.sections.length}
Citations: ${result.citations.length}
Reading Time: ${result.meta.readingTime} minutes
Processing Time: ${elapsedTime} seconds

📁 OUTPUT FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All files saved to: ${outputDir}/

🎯 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Review the generated report for accuracy
2. Copy .astro file to src/pages/ to publish
3. Use insights for decision making
4. Share findings with stakeholders

💡 TIP: Open ${baseName}.html in your browser for immediate preview!
`);

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check your .env file has all required API keys');
    console.error('2. Ensure Claude Code CLI is installed (npm install -g @anthropic-ai/claude-cli)');
    console.error('3. Verify internet connection for API calls');
    process.exit(1);
  }
}

function parseArgs(args: string[]): any {
  const options: any = {
    depth: 'standard',
    audience: 'general',
    format: 'article',
    output: './research-output',
    maxSources: 15
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];

    switch (key) {
      case 'depth':
        if (['quick', 'standard', 'comprehensive'].includes(value)) {
          options.depth = value;
        }
        break;
      case 'audience':
        if (['executive', 'technical', 'general'].includes(value)) {
          options.audience = value;
        }
        break;
      case 'format':
        if (['article', 'report', 'analysis'].includes(value)) {
          options.format = value;
        }
        break;
      case 'output':
        options.output = value;
        break;
      case 'sources':
        options.maxSources = parseInt(value) || 15;
        break;
    }
  }

  return options;
}

async function loadEnv(): Promise<void> {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
      console.log('✅ Environment variables loaded');
    }
  } catch (error) {
    console.warn('⚠️ Could not load .env file');
  }
}

function verifyEnvironment(): void {
  const required = {
    'DataForSEO': ['DATAFORSEO_API_LOGIN', 'DATAFORSEO_API_PASSWORD'],
    'Reddit': ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
    'OpenAI': ['OPENAI_API_KEY']
  };

  console.log('\n🔑 API Configuration:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  Object.entries(required).forEach(([name, keys]) => {
    const configured = keys.every(key => process.env[key]);
    console.log(`${configured ? '✅' : '⚠️'} ${name}: ${configured ? 'Configured' : 'Missing (will use fallback)'}`);
  });

  console.log('');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Run the pipeline
main().catch(console.error);