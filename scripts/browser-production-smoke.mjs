import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Read-only real-browser rendering checks. No AI calls or learner evidence writes.
const browser = await chromium.launch();
await mkdir('test-results/production', { recursive: true });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['/agent', '/personal-paths', '/ai-quality']) {
      const response = await page.goto('https://fahim-ai-egypt.vercel.app' + route, { waitUntil: 'networkidle', timeout: 30_000 });
      assert.equal(response.status(), 200);
      await page.locator('h1').first().waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${route} overflows at ${viewport.width}px`);
      assert.equal(errors.length, 0, `${route} runtime errors: ${errors.join('; ')}`);
      await page.screenshot({ path: `test-results/production/${route.slice(1)}-${viewport.width}.png`, fullPage: true });
      results.push({ route, viewport: viewport.width, status: response.status(), overflow, runtimeErrors: errors.length });
    }
    await context.close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify({ checks: results, liveAiMeasured: false, humanParticipants: 0 }));
