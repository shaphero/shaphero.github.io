#!/usr/bin/env node
/**
 * Screenshot utility for visually inspecting pages
 * Usage: node scripts/screenshot.js <url> [output-path]
 * Example: node scripts/screenshot.js http://localhost:4322/ai-roi-analysis/
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function takeScreenshot(url, outputPath) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // Retina display
  });

  const page = await context.newPage();

  console.log(`📸 Loading ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait a bit for animations
  await page.waitForTimeout(1000);

  // Take full page screenshot
  const screenshotPath = outputPath || join(__dirname, '..', 'screenshots', `screenshot-${Date.now()}.png`);

  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  console.log(`✅ Screenshot saved to: ${screenshotPath}`);

  await browser.close();
  return screenshotPath;
}

// Get URL from command line
const url = process.argv[2];
const outputPath = process.argv[3];

if (!url) {
  console.error('❌ Usage: node scripts/screenshot.js <url> [output-path]');
  process.exit(1);
}

takeScreenshot(url, outputPath).catch(console.error);