#!/usr/bin/env node

import { ClaudeResearchAgent } from '../src/lib/content-pipeline/claude-research-agent';
import type { ResearchRequest } from '../src/lib/content-pipeline/config';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📚 Content Research Pipeline
Usage: npm run research "<keyword>" [options]

Options:
  --depth      quick | standard | comprehensive (default: standard)
  --audience   executive | technical | general (default: general)
  --format     article | report | analysis (default: article)
  --output     Output directory (default: ./generated)
  --sources    Max number of sources (default: 10)

Examples:
  npm run research "AI adoption strategies"
  npm run research "synthetic data 2025" --depth comprehensive --audience technical
  npm run research "SEO trends" --format report --sources 20
    `);
    return;
  }

  const keyword = args[0];
  const options = parseArgs(args.slice(1));

  console.log(`\n🔍 Starting research for: "${keyword}"`);
  console.log(`   Depth: ${options.depth}`);
  console.log(`   Audience: ${options.audience}`);
  console.log(`   Format: ${options.format}`);
  console.log(`   Max Sources: ${options.maxSources}\n`);

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
    // Load environment variables
    await loadEnv();

    const agent = new ClaudeResearchAgent();

    console.log('🚀 Initiating Claude-powered research pipeline...\n');
    const result = await agent.research(request);

    console.log('\n📝 Generating output formats...');

    // Generate Astro page
    const astroContent = await agent.generateAstroPage(result);
    const astroPath = path.join(options.output, `${slugify(keyword)}.astro`);
    await saveFile(astroPath, astroContent);
    console.log(`✅ Astro page saved to: ${astroPath}`);

    // Generate Markdown
    const markdownContent = await agent.generateMarkdown(result);
    const markdownPath = path.join(options.output, `${slugify(keyword)}.md`);
    await saveFile(markdownPath, markdownContent);
    console.log(`✅ Markdown saved to: ${markdownPath}`);

    // Generate HTML
    const htmlContent = await agent.generateHTML(result);
    const htmlPath = path.join(options.output, `${slugify(keyword)}.html`);
    await saveFile(htmlPath, htmlContent);
    console.log(`✅ HTML saved to: ${htmlPath}`);

    // Save metadata
    const metaPath = path.join(options.output, `${slugify(keyword)}.meta.json`);
    await saveFile(metaPath, JSON.stringify(result, null, 2));
    console.log(`✅ Metadata saved to: ${metaPath}`);

    console.log('\n🎉 Research complete! Generated files:');
    console.log(`   - ${astroPath} (ready for site integration)`);
    console.log(`   - ${markdownPath} (for documentation)`);
    console.log(`   - ${htmlPath} (standalone preview)`);
    console.log(`   - ${metaPath} (raw research data)`);

    console.log('\n💡 Next steps:');
    console.log(`   1. Review generated content`);
    console.log(`   2. Copy Astro file to src/pages/ to publish`);
    console.log(`   3. Customize styling and CTAs as needed`);

  } catch (error) {
    console.error('\n❌ Research failed:', error);
    process.exit(1);
  }
}

function parseArgs(args: string[]): any {
  const options: any = {
    depth: 'standard',
    audience: 'general',
    format: 'article',
    output: './generated',
    maxSources: 10
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
        options.maxSources = parseInt(value) || 10;
        break;
    }
  }

  return options;
}

async function loadEnv(): Promise<void> {
  // Load environment variables from .env file
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
      console.log('✅ Environment variables loaded\n');
    }
  } catch (error) {
    console.warn('⚠️ Could not load .env file, using system environment\n');
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

async function saveFile(filepath: string, content: string): Promise<void> {
  const dir = path.dirname(filepath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filepath, content, 'utf-8');
}

// Run if executed directly
main().catch(console.error);