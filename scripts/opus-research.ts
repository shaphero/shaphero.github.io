#!/usr/bin/env node

/**
 * Opus 4.1 Research Script
 * Uses Claude's most powerful model for deep research
 */

import { OpusPipeline } from '../src/lib/content-pipeline/opus-pipeline';
import type { ResearchRequest } from '../src/lib/content-pipeline/config';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🎭 Opus 4.1 Research Pipeline
================================
The most powerful research pipeline using Claude Opus 4.1

Usage: npm run opus-research "<topic>" [options]

Options:
  --depth      quick | standard | comprehensive (default: comprehensive)
  --audience   executive | technical | general (default: executive)
  --format     article | report | analysis (default: report)
  --output     Output directory (default: ./opus-output)
  --sources    Max sources to analyze (default: 15)
  --model      Override model (opus | sonnet)

Examples:
  npm run opus-research "AI implementation real costs 2025"
  npm run opus-research "enterprise AI ROI statistics" --depth comprehensive
  npm run opus-research "AI talent costs" --audience executive --sources 20

Features:
  ✓ Multi-stage Claude Opus 4.1 analysis
  ✓ Per-source deep summarization
  ✓ Thematic synthesis across sources
  ✓ Quality control pass
  ✓ Professional report generation
  ✓ Automatic fallback to Sonnet if needed
    `);
    return;
  }

  const keyword = args[0];
  const options = parseArgs(args.slice(1));

  // Set model if specified
  if (options.model) {
    process.env.ANTHROPIC_MODEL = options.model === 'opus'
      ? 'claude-opus-4-1-20250805'
      : 'claude-sonnet-4-20250514';
  }

  console.log(`
╔════════════════════════════════════════════╗
║         OPUS 4.1 RESEARCH PIPELINE         ║
╚════════════════════════════════════════════╝

🔬 Topic: "${keyword}"
📊 Depth: ${options.depth}
👥 Audience: ${options.audience}
📋 Format: ${options.format}
🎯 Model: ${process.env.ANTHROPIC_MODEL || 'claude-opus-4-1-20250805'}
📚 Max Sources: ${options.maxSources}
`);

  // Load environment variables
  await loadEnv();

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
    const pipeline = new OpusPipeline();
    const result = await pipeline.research(request);

    console.log('\n📝 Generating outputs...');

    // Save outputs
    const outputDir = options.output;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = slugify(keyword);

    // Generate all formats
    const astroPath = path.join(outputDir, `${baseName}.astro`);
    const astroContent = await pipeline.generateAstroPage(result);
    fs.writeFileSync(astroPath, astroContent);
    console.log(`✅ Astro page: ${astroPath}`);

    const mdPath = path.join(outputDir, `${baseName}.md`);
    const mdContent = await pipeline.generateMarkdown(result);
    fs.writeFileSync(mdPath, mdContent);
    console.log(`✅ Markdown: ${mdPath}`);

    const htmlPath = path.join(outputDir, `${baseName}.html`);
    const htmlContent = await pipeline.generateHTML(result);
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`✅ HTML: ${htmlPath}`);

    const metaPath = path.join(outputDir, `${baseName}.meta.json`);
    fs.writeFileSync(metaPath, JSON.stringify(result, null, 2));
    console.log(`✅ Metadata: ${metaPath}`);

    console.log(`
╔════════════════════════════════════════════╗
║            RESEARCH COMPLETE!              ║
╚════════════════════════════════════════════╝

🎯 Key Insights Found: ${result.insights.length}
📄 Sections Generated: ${result.sections.length}
📚 Sources Analyzed: ${result.meta.sources.length}
⏱️ Reading Time: ${result.meta.readingTime} minutes

📁 Files created in ${outputDir}/

Next Steps:
1. Review the generated report
2. Copy Astro file to src/pages/ to publish
3. Share findings with stakeholders
`);

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    process.exit(1);
  }
}

function parseArgs(args: string[]): any {
  const options: any = {
    depth: 'comprehensive',
    audience: 'executive',
    format: 'report',
    output: './opus-output',
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
      case 'model':
        options.model = value;
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
    }
  } catch (error) {
    console.warn('⚠️ Could not load .env file');
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Run
main().catch(console.error);