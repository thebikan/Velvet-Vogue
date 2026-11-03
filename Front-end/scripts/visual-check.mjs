import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results/visual', { recursive: true });
const browser = await chromium.launch({ channel: process.platform === 'darwin' ? 'chrome' : undefined });
for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  for (const [view, route] of [['home', '/'], ['product', '/#/product/relaxed-blazer'], ['dashboard', '/#/admin']]) {
    await page.goto('http://127.0.0.1:5173' + route);
    await page.evaluate(async () => { await document.fonts.ready; });
    for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += height) {
      await page.evaluate(y => window.scrollTo(0, y), y);
      await page.waitForTimeout(100);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/visual/${name}-${view}.png`, fullPage: true });
    const broken = await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || !image.naturalWidth).map(image => image.getAttribute('src')));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(JSON.stringify({ name, view, broken, overflow }));
  }
  await page.close();
}
await browser.close();
