#!/usr/bin/env node

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { claudeCode } from '../src/lib/content-pipeline/claude-code-client';
import { RealDataCollector } from '../src/lib/content-pipeline/real-data-collector';
import { RealContentProcessor } from '../src/lib/content-pipeline/real-content-processor';
import { ClaudeCodeSynthesizer } from '../src/lib/content-pipeline/claude-code-synthesizer';
import { ContentFormatter } from '../src/lib/content-pipeline/formatter';
import type { ChunkData, Source } from '../src/lib/content-pipeline/config';

type StageReport = { ok: boolean; durationMs: number; details?: any; error?: string; skipped?: boolean };
type Report = {
  meta: { timestamp: string };
  env: {
    claudeAvailable: boolean;
    dataForSeoConfigured: boolean;
    dataForSeoDisabled: boolean;
    redditConfigured: boolean;
    openaiConfigured: boolean;
    fastPipeline: boolean;
  };
  checks: {
    claudeRoundTrip: StageReport;
  };
  stages: {
    collectWeb: StageReport;
    scrape: StageReport;
    process: StageReport;
    synthesize: StageReport;
    format: StageReport;
  };
};

function parseArgs(argv: string[]) {
  const opts: any = { offline: false, fast: false, strict: false, json: false, out: '.cache/diagnostics' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--offline') opts.offline = true;
    else if (a === '--fast') opts.fast = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--out') opts.out = argv[++i];
  }
  return opts;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result?: T; error?: any; durationMs: number }> {
  const start = Date.now();
  try {
    const result = await fn();
    return { result, durationMs: Date.now() - start };
  } catch (error) {
    return { error, durationMs: Date.now() - start };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.fast) {
    process.env.FAST_PIPELINE = '1';
    process.env.DATAFORSEO_DISABLE = process.env.DATAFORSEO_DISABLE || '1';
  }

  const claudeAvailable = await claudeCode.checkAvailability();
  const dataForSeoConfigured = !!((process.env.DATAFORSEO_API_LOGIN || process.env.DATAFORSEO_USERNAME) && (process.env.DATAFORSEO_API_PASSWORD || process.env.DATAFORSEO_PASSWORD));
  const dataForSeoDisabled = process.env.DATAFORSEO_DISABLE === '1';
  const redditConfigured = !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD);
  const openaiConfigured = !!process.env.OPENAI_API_KEY;
  const fastPipeline = process.env.FAST_PIPELINE === '1';

  const report: Report = {
    meta: { timestamp: new Date().toISOString() },
    env: { claudeAvailable, dataForSeoConfigured, dataForSeoDisabled, redditConfigured, openaiConfigured, fastPipeline },
    checks: { claudeRoundTrip: { ok: false, durationMs: 0, skipped: !claudeAvailable } },
    stages: {
      collectWeb: { ok: false, durationMs: 0 },
      scrape: { ok: false, durationMs: 0 },
      process: { ok: false, durationMs: 0 },
      synthesize: { ok: false, durationMs: 0, skipped: !claudeAvailable },
      format: { ok: false, durationMs: 0 }
    }
  };

  // Quick Claude check
  if (claudeAvailable) {
    const { result, error, durationMs } = await timed(() => claudeCode.query('Return {"ok":true}', { useJson: true, model: 'haiku' }));
    report.checks.claudeRoundTrip.durationMs = durationMs;
    if (error) {
      report.checks.claudeRoundTrip.ok = false;
      report.checks.claudeRoundTrip.error = String(error);
    } else {
      report.checks.claudeRoundTrip.ok = true;
      report.checks.claudeRoundTrip.details = result;
    }
  }

  // Prepare pipeline components
  const collector = new RealDataCollector();
  const processor = new RealContentProcessor(800, 150, { embeddingBatchSize: 10, embeddingConcurrency: 2 });
  const synthesizer = new ClaudeCodeSynthesizer();
  const formatter = new ContentFormatter();

  // Stage 1: Collect
  let sources: Source[] = [];
  {
    const { result, error, durationMs } = await timed(async () => {
      if (args.offline) {
        return [
          { url: 'health://sample1', title: 'Sample 1', type: 'article', metadata: { content: 'ROI improves with training adoption above 70%.' } },
          { url: 'health://sample2', title: 'Sample 2', type: 'article', metadata: { content: 'Common pitfalls: unclear KPIs, brittle integrations, and governance gaps.' } }
        ] as Source[];
      }
      const res = await collector.searchWeb('AI ROI 2025', { limit: fastPipeline ? 3 : 6 });
      return res;
    });
    report.stages.collectWeb.durationMs = durationMs;
    if (error) {
      report.stages.collectWeb.ok = false;
      report.stages.collectWeb.error = String(error);
    } else {
      sources = (result || []).slice(0, fastPipeline ? 2 : 4);
      report.stages.collectWeb.ok = sources.length > 0;
      report.stages.collectWeb.details = { sources: sources.length };
    }
  }

  // Stage 2: Scrape
  {
    const { error, durationMs } = await timed(async () => {
      for (const s of sources) {
        if (s.metadata?.content && s.metadata.content.length > 0) continue;
        if (!/^https?:/i.test(s.url)) continue;
        try {
          s.metadata = s.metadata || ({} as any);
          s.metadata.content = await collector.scrapeUrl(s.url);
        } catch {}
      }
    });
    report.stages.scrape.durationMs = durationMs;
    const count = sources.filter(s => s.metadata?.content && s.metadata.content.length > 40).length;
    if (error) {
      report.stages.scrape.ok = false;
      report.stages.scrape.error = String(error);
    } else {
      report.stages.scrape.ok = count > 0;
      report.stages.scrape.details = { scraped: count };
    }
  }

  // Stage 3: Process
  let chunks: ChunkData[] = [];
  {
    const { error, durationMs } = await timed(async () => {
      for (const s of sources) {
        const content = s.metadata?.content || '';
        if (!content) continue;
        const ch = await processor.chunkContent(content, s);
        const emb = await processor.generateEmbeddings(ch);
        chunks.push(...emb);
      }
    });
    report.stages.process.durationMs = durationMs;
    if (error) {
      report.stages.process.ok = false;
      report.stages.process.error = String(error);
    } else {
      report.stages.process.ok = chunks.length > 0;
      report.stages.process.details = { chunks: chunks.length };
    }
  }

  // Stage 4: Synthesize (may be skipped if Claude not available)
  let synthesis: any = null;
  if (!claudeAvailable) {
    report.stages.synthesize.skipped = true;
    report.stages.synthesize.ok = false;
  } else {
    const { result, error, durationMs } = await timed(async () => {
      return synthesizer.synthesize({ keyword: 'AI ROI 2025', depth: 'quick', audience: 'executive', format: 'analysis', includeReddit: false, includeNews: false, maxSources: 3 }, chunks);
    });
    report.stages.synthesize.durationMs = durationMs;
    if (error) {
      report.stages.synthesize.ok = false;
      report.stages.synthesize.error = String(error);
    } else {
      synthesis = result;
      report.stages.synthesize.ok = !!synthesis;
    }
  }

  // Stage 5: Format
  {
    const { error, durationMs } = await timed(async () => {
      const outDir = path.join(args.out, 'health');
      fs.mkdirSync(outDir, { recursive: true });
      if (synthesis) {
        const formatted = await formatter.format(synthesis);
        fs.writeFileSync(path.join(outDir, 'health.md'), formatter.toMarkdown(formatted), 'utf-8');
        fs.writeFileSync(path.join(outDir, 'health.astro'), formatter.toAstroComponent(formatted), 'utf-8');
      }
    });
    report.stages.format.durationMs = durationMs;
    if (synthesis && !error) {
      report.stages.format.ok = true;
    } else if (!synthesis) {
      report.stages.format.ok = false;
      report.stages.format.skipped = true;
      report.stages.format.error = 'No synthesis output available';
    } else {
      report.stages.format.ok = false;
      report.stages.format.error = String(error);
    }
  }

  // Output report
  const outDir = args.out || '.cache/diagnostics';
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'health.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');

  if (args.json) {
    console.log(JSON.stringify(report));
  } else {
    console.log(`\nHealth report written to ${outPath}`);
  }

  if (args.strict) {
    const failed = !report.stages.collectWeb.ok || !report.stages.process.ok || (claudeAvailable && !report.stages.synthesize.ok);
    if (failed) process.exitCode = 1;
  }
}

main();

