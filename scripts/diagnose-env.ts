#!/usr/bin/env node

import 'dotenv/config';
import { claudeCode } from '../src/lib/content-pipeline/claude-code-client';
import { RealDataCollector } from '../src/lib/content-pipeline/real-data-collector';
import { RealContentProcessor } from '../src/lib/content-pipeline/real-content-processor';
import { ClaudeCodeSynthesizer } from '../src/lib/content-pipeline/claude-code-synthesizer';
import { ContentFormatter } from '../src/lib/content-pipeline/formatter';
import type { ChunkData, Source } from '../src/lib/content-pipeline/config';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const doSmoke = args.includes('--smoke');

  console.log('\n🔧 Environment Diagnostics');

  // Claude Code CLI check
  const claudeOk = await claudeCode.checkAvailability();
  console.log(`Claude Code CLI: ${claudeOk ? 'available ✅' : 'not found ⚠️'}`);

  // DataForSEO envs
  const dfsLogin = process.env.DATAFORSEO_API_LOGIN || process.env.DATAFORSEO_USERNAME;
  const dfsPass = process.env.DATAFORSEO_API_PASSWORD || process.env.DATAFORSEO_PASSWORD;
  const dfsDisabled = process.env.DATAFORSEO_DISABLE === '1';
  console.log(`DataForSEO: ${dfsDisabled ? 'disabled via DATAFORSEO_DISABLE=1' : (dfsLogin && dfsPass ? 'credentials present ✅' : 'missing (DuckDuckGo fallback) ⚠️')}`);

  // Reddit envs
  const redditOk = !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD);
  console.log(`Reddit API: ${redditOk ? 'credentials present ✅' : 'not configured (public JSON fallback) ⚠️'}`);

  // OpenAI
  const openaiOk = !!process.env.OPENAI_API_KEY;
  console.log(`OpenAI embeddings: ${openaiOk ? 'key present ✅' : 'not configured (will use mock embeddings) ℹ️'}`);

  // Fast mode
  const fast = process.env.FAST_PIPELINE === '1';
  console.log(`FAST_PIPELINE: ${fast ? 'enabled' : 'disabled'}`);

  // Quick Claude round-trip test
  if (claudeOk) {
    try {
      const res = await claudeCode.query('Return a JSON object {"ok": true, "model": "haiku"}.', { useJson: true, model: 'haiku' });
      const ok = !!(res && (res.ok === true || res.response));
      console.log(`Claude round-trip: ${ok ? 'success ✅' : 'unexpected response ⚠️'}`);
    } catch (e) {
      console.log('Claude round-trip: failed ❌', e);
    }
  }

  if (!doSmoke) {
    console.log('\nTip: run `npm run diagnose -- --smoke` for a quick pipeline smoke test.');
    return;
  }

  console.log('\n🚬 Running smoke test (fast, minimal external calls)...');
  // Force minimal external usage: limit search and avoid paid APIs
  process.env.DATAFORSEO_DISABLE = '1';

  const collector = new RealDataCollector();
  const processor = new RealContentProcessor(800, 150, { embeddingBatchSize: 10, embeddingConcurrency: 2 });
  const synthesizer = new ClaudeCodeSynthesizer();
  const formatter = new ContentFormatter();

  try {
    // Phase 1: Collect a couple sources
    let sources: Source[] = await collector.searchWeb('AI ROI 2025', { limit: 3 });
    if (sources.length === 0) {
      // Fallback to static in-memory sources to complete smoke test reliably
      sources = [
        {
          url: 'diagnostic://sample1',
          title: 'Sample: ROI Benchmarks',
          type: 'article',
          date: new Date().toISOString(),
          metadata: {
            content: 'Enterprises report 333% ROI within 90 days when workflows are aligned and training coverage exceeds 75%. Costs average $120k year one including data, change mgmt, and platform. Common failure: shadow AI and lack of KPIs.'
          }
        },
        {
          url: 'diagnostic://sample2',
          title: 'Sample: Failure Patterns',
          type: 'article',
          date: new Date().toISOString(),
          metadata: {
            content: 'Studies show 74% failure rate due to integration, governance, and ownership gaps. Success patterns include clear business metrics, small-scope pilots, and scale once ROI is evidenced. Typical timeline: 30-60-90 days.'
          }
        }
      ] as Source[];
    }

    // Scrape 1–2 sources
    const take = sources.slice(0, 2);
    for (const src of take) {
      if (src?.metadata?.content && src.metadata.content.length > 0) continue;
      if (!/^https?:/i.test(src.url)) continue;
      try {
        src.metadata = src.metadata || ({} as any);
        src.metadata.content = await collector.scrapeUrl(src.url);
      } catch {}
    }

    const withContent = take.filter(s => s.metadata?.content && s.metadata.content.length > 120);
    if (withContent.length === 0) throw new Error('Scraping produced no content');

    // Phase 2: Process
    const chunks: ChunkData[] = [];
    for (const s of withContent) {
      const ch = await processor.chunkContent(s.metadata!.content, s);
      const emb = await processor.generateEmbeddings(ch);
      chunks.push(...emb);
    }

    if (chunks.length === 0) throw new Error('No chunks generated');

    // Phase 3–4: Synthesize (Claude)
    const synth = await synthesizer.synthesize({ keyword: 'AI ROI 2025', depth: 'quick', audience: 'executive', format: 'analysis', includeReddit: false, includeNews: false, maxSources: 3 }, chunks);
    const out = await formatter.format(synth);

    // Phase 5: Output
    const outDir = path.join('.cache', 'diagnostics');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'smoke.md'), formatter.toMarkdown(out), 'utf-8');
    fs.writeFileSync(path.join(outDir, 'smoke.astro'), formatter.toAstroComponent(out), 'utf-8');
    console.log('✅ Smoke test complete. Outputs in .cache/diagnostics/');
  } catch (e) {
    console.error('❌ Smoke test failed:', e);
    process.exitCode = 1;
  }
}

main();
