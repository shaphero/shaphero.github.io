#!/usr/bin/env node

/**
 * Content Workshop System
 *
 * Philosophy: AI collects raw materials, human crafts the masterpiece
 *
 * Usage:
 *   npm run workshop "enterprise AI ROI 2025" --audience executive
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { RealDataCollector } from '../src/lib/content-pipeline/real-data-collector';
import { claudeCode } from '../src/lib/content-pipeline/claude-code-client';
import type { Source } from '../src/lib/content-pipeline/config';

interface WorkshopConfig {
  keyword: string;
  audience: 'executive' | 'technical' | 'general';
  sourceCount: number;
  outputDir: string;
  cacheDir: string;
}

interface ThematicData {
  statistics: Array<{ value: string; context: string; source: string }>;
  caseStudies: Array<{ company: string; outcome: string; metrics: string; source: string }>;
  insights: Array<{ theme: string; findings: string[]; sources: string[] }>;
  quotes: Array<{ text: string; attribution: string; source: string }>;
}

class ContentWorkshop {
  private config: WorkshopConfig;
  private collector: RealDataCollector;
  private rl: readline.Interface;

  constructor(config: WorkshopConfig) {
    this.config = config;
    this.collector = new RealDataCollector();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run(): Promise<void> {
    console.log(`
╔════════════════════════════════════════════════════╗
║           CONTENT WORKSHOP SESSION                 ║
║   AI-Assisted Human Synthesis for Great Content   ║
╚════════════════════════════════════════════════════╝

📋 Topic: ${this.config.keyword}
🎯 Audience: ${this.config.audience}
📊 Target Sources: ${this.config.sourceCount}

`);

    // Phase 1: Data Collection
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 PHASE 1: DATA COLLECTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sources = await this.collectSources();
    console.log(`✅ Collected ${sources.length} sources\n`);

    // Phase 2: Data Organization
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗂️  PHASE 2: DATA ORGANIZATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const organizedData = await this.organizeData(sources);
    console.log('✅ Organized into thematic categories\n');

    // Phase 3: Interactive Workshop
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✍️  PHASE 3: INTERACTIVE CONTENT WORKSHOP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await this.runWorkshop(organizedData);

    console.log('\n✅ Workshop session complete!\n');
    this.rl.close();
  }

  /**
   * Phase 1: Collect sources and cache locally
   */
  private async collectSources(): Promise<Source[]> {
    const cacheFile = path.join(this.config.cacheDir, `${this.slugify(this.config.keyword)}-sources.json`);

    // Check cache first
    if (fs.existsSync(cacheFile)) {
      const answer = await this.prompt('Found cached sources. Use cache? (y/n): ');
      if (answer.toLowerCase() === 'y') {
        console.log('Loading from cache...');
        return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      }
    }

    console.log('Searching for sources...');
    const sources: Source[] = [];

    // Generate search queries
    const queries = this.generateSearchQueries();
    console.log(`Generated ${queries.length} search variations\n`);

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`[${i + 1}/${queries.length}] Searching: "${query}"`);

      try {
        const results = await this.collector.searchWeb(query, {
          limit: Math.ceil(this.config.sourceCount / queries.length)
        });
        sources.push(...results);
        console.log(`  Found ${results.length} results`);
      } catch (error) {
        console.warn(`  Failed: ${error}`);
      }
    }

    // Deduplicate by URL
    const uniqueSources = Array.from(
      new Map(sources.map(s => [s.url, s])).values()
    ).slice(0, this.config.sourceCount);

    // Scrape content
    console.log(`\nScraping ${uniqueSources.length} sources...`);
    for (let i = 0; i < uniqueSources.length; i++) {
      const source = uniqueSources[i];
      console.log(`[${i + 1}/${uniqueSources.length}] ${source.url?.substring(0, 60)}...`);

      try {
        const content = await this.collector.scrapeUrl(source.url);
        if (content && content.length > 200) {
          source.metadata = { ...source.metadata, content };
          console.log(`  ✓ Scraped (${content.length} chars)`);
        } else {
          console.log(`  ✗ Content too short, skipping`);
        }
      } catch (error) {
        console.log(`  ✗ Failed to scrape`);
      }
    }

    // Filter to only sources with content
    const validSources = uniqueSources.filter(s => s.metadata?.content && s.metadata.content.length > 200);

    // Cache results
    fs.mkdirSync(this.config.cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(validSources, null, 2));
    console.log(`Cached ${validSources.length} sources`);

    return validSources;
  }

  /**
   * Phase 2: Organize data into thematic categories
   */
  private async organizeData(sources: Source[]): Promise<ThematicData> {
    const cacheFile = path.join(this.config.cacheDir, `${this.slugify(this.config.keyword)}-organized.json`);

    // Check cache
    if (fs.existsSync(cacheFile)) {
      console.log('Loading organized data from cache...');
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    }

    console.log('Analyzing sources with Claude...\n');

    const organized: ThematicData = {
      statistics: [],
      caseStudies: [],
      insights: [],
      quotes: []
    };

    // Process sources in batches
    const batchSize = 3;
    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, Math.min(i + batchSize, sources.length));
      console.log(`Processing sources ${i + 1}-${Math.min(i + batchSize, sources.length)}...`);

      for (const source of batch) {
        const content = source.metadata?.content || '';
        if (!content) continue;

        const prompt = `Extract key data from this source about "${this.config.keyword}".

Source: ${source.title}
URL: ${source.url}

Return JSON with:
{
  "statistics": [{"value": "X%", "context": "what it measures"}],
  "caseStudies": [{"company": "Name", "outcome": "what happened", "metrics": "specific numbers"}],
  "insights": [{"theme": "category", "finding": "key takeaway"}],
  "quotes": [{"text": "exact quote", "attribution": "speaker/source"}]
}

Only include items with SPECIFIC numbers, company names, or concrete examples.`;

        try {
          const result = await claudeCode.queryWithInput(
            content.substring(0, 8000),
            prompt,
            { useJson: true, model: 'haiku' }
          );

          // Merge results
          if (result.statistics) {
            organized.statistics.push(...result.statistics.map((s: any) => ({ ...s, source: source.url })));
          }
          if (result.caseStudies) {
            organized.caseStudies.push(...result.caseStudies.map((c: any) => ({ ...c, source: source.url })));
          }
          if (result.insights) {
            result.insights.forEach((insight: any) => {
              const existing = organized.insights.find(i => i.theme === insight.theme);
              if (existing) {
                existing.findings.push(insight.finding);
                existing.sources.push(source.url);
              } else {
                organized.insights.push({
                  theme: insight.theme,
                  findings: [insight.finding],
                  sources: [source.url]
                });
              }
            });
          }
          if (result.quotes) {
            organized.quotes.push(...result.quotes.map((q: any) => ({ ...q, source: source.url })));
          }

          console.log(`  ✓ Extracted data from ${source.title?.substring(0, 40)}...`);
        } catch (error) {
          console.warn(`  ✗ Failed to analyze: ${error}`);
        }
      }
    }

    // Cache organized data
    fs.writeFileSync(cacheFile, JSON.stringify(organized, null, 2));

    console.log(`\nExtracted:
  - ${organized.statistics.length} statistics
  - ${organized.caseStudies.length} case studies
  - ${organized.insights.length} insight themes
  - ${organized.quotes.length} quotes`);

    return organized;
  }

  /**
   * Phase 3: Interactive workshop session
   */
  private async runWorkshop(data: ThematicData): Promise<void> {
    console.log(`
Welcome to the interactive workshop! I'll help you craft authority content.

Available commands:
  stats      - Review all statistics
  cases      - Review case studies
  insights   - Review key insights
  quotes     - Review quotes
  draft      - Draft a specific section
  scaffold   - Generate complete article structure
  save       - Save current work
  done       - Finish workshop

`);

    let done = false;
    const workInProgress: any = {
      sections: [],
      hook: '',
      title: ''
    };

    while (!done) {
      const command = await this.prompt('workshop> ');

      switch (command.trim().toLowerCase()) {
        case 'stats':
          await this.showStatistics(data);
          break;
        case 'cases':
          await this.showCaseStudies(data);
          break;
        case 'insights':
          await this.showInsights(data);
          break;
        case 'quotes':
          await this.showQuotes(data);
          break;
        case 'draft':
          await this.draftSection(data, workInProgress);
          break;
        case 'scaffold':
          await this.generateScaffold(data, workInProgress);
          break;
        case 'save':
          await this.saveWork(workInProgress);
          break;
        case 'done':
          done = true;
          break;
        case 'help':
          console.log('Commands: stats, cases, insights, quotes, draft, scaffold, save, done');
          break;
        default:
          console.log('Unknown command. Type "help" for available commands.');
      }
    }
  }

  // Workshop command handlers

  private async showStatistics(data: ThematicData): Promise<void> {
    console.log('\n📊 STATISTICS:\n');
    data.statistics.slice(0, 20).forEach((stat, i) => {
      console.log(`${i + 1}. ${stat.value} - ${stat.context}`);
      console.log(`   Source: ${stat.source}\n`);
    });
  }

  private async showCaseStudies(data: ThematicData): Promise<void> {
    console.log('\n🏢 CASE STUDIES:\n');
    data.caseStudies.forEach((cs, i) => {
      console.log(`${i + 1}. ${cs.company}`);
      console.log(`   Outcome: ${cs.outcome}`);
      console.log(`   Metrics: ${cs.metrics}`);
      console.log(`   Source: ${cs.source}\n`);
    });
  }

  private async showInsights(data: ThematicData): Promise<void> {
    console.log('\n💡 KEY INSIGHTS:\n');
    data.insights.forEach((insight, i) => {
      console.log(`${i + 1}. Theme: ${insight.theme}`);
      insight.findings.slice(0, 3).forEach(finding => {
        console.log(`   - ${finding}`);
      });
      console.log(`   Sources: ${insight.sources.length}\n`);
    });
  }

  private async showQuotes(data: ThematicData): Promise<void> {
    console.log('\n💬 QUOTES:\n');
    data.quotes.forEach((quote, i) => {
      console.log(`${i + 1}. "${quote.text}"`);
      console.log(`   - ${quote.attribution}`);
      console.log(`   Source: ${quote.source}\n`);
    });
  }

  private async draftSection(data: ThematicData, wip: any): Promise<void> {
    const section = await this.prompt('Which section? (hook/stakes/discovery/proof/method/payoff): ');

    console.log(`\nDrafting "${section}" section with Claude...\n`);

    const templates: Record<string, string> = {
      hook: `Draft a compelling 2-3 sentence hook for an article about "${this.config.keyword}".

Requirements:
- Start with a surprising stat or contrarian take
- Make the ${this.config.audience} reader NEED to keep reading
- Use specific numbers from the data

Available data:
Statistics: ${JSON.stringify(data.statistics.slice(0, 10), null, 2)}
Case studies: ${JSON.stringify(data.caseStudies.slice(0, 5), null, 2)}

Write the hook:`,

      stakes: `Draft a "Stakes" section explaining why "${this.config.keyword}" matters NOW for ${this.config.audience} audience.

Requirements:
- Cost of inaction with specific numbers
- Competitive pressure with company names
- Why timing is critical

Available data:
${JSON.stringify(data, null, 2)}

Write 2-3 compelling paragraphs:`,

      discovery: `Draft a "Discovery" section revealing your unique insight about "${this.config.keyword}".

Requirements:
- Present data in a way no one else has
- Create an "aha!" moment
- Back it up with evidence

Available data:
${JSON.stringify(data, null, 2)}

Write 3-4 paragraphs with a clear insight:`,

      proof: `Draft a "Proof" section with 3-5 company case studies about "${this.config.keyword}".

Requirements:
- Specific company names
- Exact dollar amounts/percentages
- Clear before/after metrics

Available case studies:
${JSON.stringify(data.caseStudies, null, 2)}

Write detailed case study descriptions:`,

      method: `Draft a "Method" section explaining how to apply insights about "${this.config.keyword}".

Requirements:
- Step-by-step playbook
- Common mistakes to avoid
- Tools/resources needed

Available insights:
${JSON.stringify(data.insights, null, 2)}

Write a clear, actionable guide:`,

      payoff: `Draft a "Payoff" section describing success outcomes for "${this.config.keyword}".

Requirements:
- Specific outcomes they'll achieve
- Timeline for results
- Success metrics to track

Available data:
${JSON.stringify(data.statistics, null, 2)}

Write an inspiring outcomes section:`
    };

    const prompt = templates[section.toLowerCase()];
    if (!prompt) {
      console.log('Unknown section type. Use: hook, stakes, discovery, proof, method, or payoff');
      return;
    }

    try {
      const draft = await claudeCode.query(prompt, { useJson: false, model: 'sonnet' });
      console.log('\n' + '='.repeat(60));
      console.log(draft);
      console.log('='.repeat(60) + '\n');

      wip.sections.push({ type: section, content: draft });
    } catch (error) {
      console.error('Failed to draft section:', error);
    }
  }

  private async generateScaffold(data: ThematicData, wip: any): Promise<void> {
    console.log('\nGenerating article scaffold...\n');

    const prompt = `Create a complete article outline for "${this.config.keyword}" targeting ${this.config.audience} audience.

Available data:
- ${data.statistics.length} statistics
- ${data.caseStudies.length} case studies
- ${data.insights.length} insight themes
- ${data.quotes.length} quotes

Top statistics: ${JSON.stringify(data.statistics.slice(0, 5))}
Top case studies: ${JSON.stringify(data.caseStudies.slice(0, 3))}

Return JSON structure:
{
  "title": "Compelling headline with number",
  "hook": "2-3 sentence opening",
  "sections": [
    {"heading": "Section Title", "keyPoints": ["point 1", "point 2"], "dataToInclude": ["specific stats/cases to reference"]}
  ]
}

Follow this structure:
1. Hook (surprising stat)
2. The Stakes (why now)
3. The Discovery (unique insight)
4. The Proof (case studies)
5. The Method (how-to)
6. The Payoff (outcomes)
7. CTA

Make it SPECIFIC and data-driven.`;

    try {
      const scaffold = await claudeCode.query(prompt, { useJson: true, model: 'sonnet' });

      console.log('\n' + '='.repeat(60));
      console.log('ARTICLE SCAFFOLD:\n');
      console.log(`Title: ${scaffold.title}\n`);
      console.log(`Hook: ${scaffold.hook}\n`);

      if (scaffold.sections) {
        scaffold.sections.forEach((section: any, i: number) => {
          console.log(`${i + 1}. ${section.heading}`);
          if (section.keyPoints) {
            section.keyPoints.forEach((point: string) => {
              console.log(`   - ${point}`);
            });
          }
          console.log();
        });
      }
      console.log('='.repeat(60) + '\n');

      wip.scaffold = scaffold;
    } catch (error) {
      console.error('Failed to generate scaffold:', error);
    }
  }

  private async saveWork(wip: any): Promise<void> {
    const filename = `${this.slugify(this.config.keyword)}-wip.json`;
    const filepath = path.join(this.config.outputDir, filename);

    fs.mkdirSync(this.config.outputDir, { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(wip, null, 2));

    console.log(`\n✅ Saved work to: ${filepath}\n`);
  }

  // Utility methods

  private generateSearchQueries(): string[] {
    const base = this.config.keyword;
    return [
      base,
      `${base} case studies 2025`,
      `${base} statistics data`,
      `${base} ROI metrics enterprise`,
      `${base} success stories companies`,
      `${base} implementation costs`
    ];
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private prompt(question: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(question, resolve);
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📝 Content Workshop - AI-Assisted Human Synthesis

Usage: npm run workshop "<keyword>" [options]

Options:
  --audience    executive | technical | general (default: executive)
  --sources     Number of sources to collect (default: 15)
  --output      Output directory (default: ./workshop-output)
  --cache       Cache directory (default: ./.cache/workshop)

Example:
  npm run workshop "enterprise AI ROI 2025" --audience executive --sources 20
`);
    return;
  }

  const keyword = args[0];
  const config: WorkshopConfig = {
    keyword,
    audience: 'executive',
    sourceCount: 15,
    outputDir: './workshop-output',
    cacheDir: './.cache/workshop'
  };

  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];

    switch (key) {
      case 'audience':
        if (['executive', 'technical', 'general'].includes(value)) {
          config.audience = value as any;
        }
        break;
      case 'sources':
        config.sourceCount = parseInt(value) || 15;
        break;
      case 'output':
        config.outputDir = value;
        break;
      case 'cache':
        config.cacheDir = value;
        break;
    }
  }

  const workshop = new ContentWorkshop(config);
  await workshop.run();
}

main().catch(console.error);