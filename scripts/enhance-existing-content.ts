#!/usr/bin/env node

import { ClaudeResearchAgent } from '../src/lib/content-pipeline/claude-research-agent';
import { ContentFormatter } from '../src/lib/content-pipeline/formatter';
import { FileCache } from '../src/lib/content-pipeline/cache';
import { VectorStore } from '../src/lib/content-pipeline/vector-store';
import type { PipelineConfig } from '../src/lib/content-pipeline/config';
import { RealDataCollector } from '../src/lib/content-pipeline/real-data-collector';
import * as fs from 'fs';
import * as path from 'path';

/**
 * This script enhances existing content pages with fresh research
 * It analyzes current pages and enriches them with new data
 */

async function enhanceContent() {
  const pagesToEnhance = [
    {
      path: 'src/pages/ai-roi-analysis.astro',
      keyword: 'AI ROI measurement 2025',
      focus: 'Latest benchmarks, case studies, and measurement frameworks'
    },
    {
      path: 'src/pages/best-ai-coding.astro',
      keyword: 'AI coding tools benchmarks GPT-5 Claude',
      focus: 'Latest model performance, adoption strategies, security concerns'
    },
    {
      path: 'src/pages/ai-replacing-jobs.astro',
      keyword: 'AI job automation 2025 workforce impact',
      focus: 'Latest studies, industry data, reskilling strategies'
    }
  ];

  console.log('🚀 Content Enhancement Pipeline\n');
  console.log('This will research and generate enhanced versions of existing pages.\n');

  const pipelineConfig = loadConfig();

  for (const page of pagesToEnhance) {
    console.log(`\n📄 Enhancing: ${page.path}`);
    console.log(`   Research focus: ${page.focus}`);

    try {
      const agent = createResearchAgent(pipelineConfig);
      const result = await agent.research({
        keyword: page.keyword,
        depth: 'comprehensive',
        audience: 'technical',
        format: 'article',
        maxSources: 15,
        includeReddit: true,
        includeNews: true
      });

      const formatter = new ContentFormatter();
      const enhancedContent = formatter.toAstroComponent(result);
      const outputPath = page.path.replace('.astro', '-enhanced.astro');
      fs.writeFileSync(outputPath, enhancedContent, 'utf-8');
      console.log(`   ✅ Enhanced version saved to: ${outputPath}`);

      const insightsMarkdown = formatter.toMarkdown(result);
      const insightsPath = page.path.replace('.astro', '-insights.md');
      fs.writeFileSync(insightsPath, insightsMarkdown, 'utf-8');
      console.log(`   📊 Insights report saved to: ${insightsPath}`);

    } catch (error) {
      console.error(`   ❌ Failed to enhance ${page.path}:`, error);
    }
  }

  console.log('\n✨ Enhancement complete!');
  console.log('\nNext steps:');
  console.log('1. Review the -enhanced.astro files');
  console.log('2. Merge valuable insights into original pages');
  console.log('3. Update data tables and statistics');
  console.log('4. Add new citations and sources');
}

function loadConfig(): PipelineConfig | undefined {
  const configPath = path.resolve('content-generator/config.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw) as PipelineConfig;
    } catch (error) {
      console.warn('⚠️ Failed to parse config.json:', error);
    }
  }
  return undefined;
}

function createResearchAgent(config?: PipelineConfig) {
  const dependencies: {
    collector?: RealDataCollector;
    vectorStore?: VectorStore;
  } = {};

  if (config?.cache) {
    dependencies.collector = new RealDataCollector({
      cache: config.cache.baseDir ? new FileCache(config.cache.baseDir) : undefined,
      serpTtlMs: config.cache.serpTtlMs,
      scrapeTtlMs: config.cache.scrapeTtlMs
    });
  }

  if (config?.vectorDb) {
    dependencies.vectorStore = new VectorStore(config.vectorDb);
  }

  return new ClaudeResearchAgent(dependencies);
}

enhanceContent();
