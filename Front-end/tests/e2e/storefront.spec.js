import { test, expect } from '@playwright/test';

test('landing page renders imagery, responds without overflow, and opens collection', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The everyday,elevated.');
  await expect(page.locator('.hero-image')).toBeVisible();
  await expect.poll(() => page.locator('.hero-image').evaluate(image => image.complete && image.naturalWidth > 0)).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.locator('.hero').getByRole('link', { name: /Explore the collection/ }).click();
  await expect(page.locator('.product-card')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('search, category and sorting work; search input is not executable HTML', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search collection', exact: true }).click();
  await page.getByLabel('Search by piece, category, or colour').fill('blazer');
  await page.getByRole('button', { name: 'Submit search' }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.locator('.filter-tabs').getByRole('link', { name: 'Men', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(0);
  await page.goto('/#/shop?sort=price-low');
  await expect(page.locator('.product-card').first()).toContainText('The Everyday Knit');
  await page.goto('/#/shop?q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');
  await expect(page.locator('.results-bar')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.results-bar img')).toHaveCount(0);
});

test('size selection, bag quantities, persistence and removal work without pretending to checkout', async ({ page }) => {
  await page.goto('/#/product/relaxed-blazer');
  await expect(page.getByRole('button', { name: 'Add to preview bag' })).toBeDisabled();
  await page.getByRole('button', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: 'Add to preview bag' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('LKR 12,900');
  await page.getByRole('button', { name: 'Increase quantity of The Relaxed Blazer' }).click();
  await expect(page.locator('.bag-summary')).toContainText('LKR 25,800');
  await expect(page.getByRole('button', { name: 'Checkout not available' })).toBeDisabled();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Open shopping bag' }).click();
  await expect(page.locator('.bag-summary')).toContainText('LKR 25,800');
  await page.getByRole('button', { name: 'Remove The Relaxed Blazer', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('A little room for something good.');
});

test('saved pieces persist and dialogs support Escape', async ({ page }) => {
  await page.goto('/#/shop');
  await page.getByRole('button', { name: 'Save The Everyday Knit', exact: true }).click();
  await page.getByRole('link', { name: 'Saved pieces', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Search collection', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('workspace shows unavailable data honestly and health checks handle dependency failures', async ({ page }) => {
  await page.route('**/api/v1/health', route => route.fulfill({ status: 200, json: { data: { status: 'alive' }, error: null } }));
  await page.route('**/api/v1/ready', route => route.fulfill({ status: 503, json: { data: null, error: { code: 'not_ready' } } }));
  await page.goto('/#/admin');
  await expect(page.locator('.metric-card').first()).toContainText('Awaiting sales connection');
  await page.getByRole('button', { name: 'Check connection' }).click();
  await expect(page.locator('#health-value')).toHaveText('Connected');
  await expect(page.locator('#ready-value')).toHaveText('Unavailable');
  await page.getByRole('button', { name: 'Year', exact: true }).click();
  await expect(page.locator('.revenue-panel')).toContainText('YEAR VIEW');
  await page.getByRole('navigation', { name: 'Dashboard navigation' }).getByRole('link', { name: 'Collection' }).click();
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('newsletter never claims a submission or stores an email', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Email address', { exact: true }).fill('preview@example.test');
  await page.getByRole('button', { name: 'Request newsletter signup' }).click();
  await expect(page.locator('#newsletter-status')).toContainText('has not been sent or saved');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('preview@example.test');
});
