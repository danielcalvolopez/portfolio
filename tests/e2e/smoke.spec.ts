import { test, expect } from '@playwright/test';

// E1: the full information architecture.
const ROUTES = [
  '/',
  '/work/',
  '/work/retryfi/',
  '/work/alkimi-labs/',
  '/work/credilabs/',
  '/process/',
  '/about/',
];

for (const route of ROUTES) {
  test(`smoke ${route}: 200, one h1, running head, footer line, no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    const resp = await page.goto(route);
    expect(resp?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('header.running-head')).toContainText(/Calvo/i);
    await expect(page.locator('footer')).toContainText(/KB/);
    expect(errors).toEqual([]);
  });
}

test('home: contents list links every featured case study and the process page', async ({ page }) => {
  await page.goto('/');
  const contents = page.locator('[data-testid="contents"]');
  await expect(contents.locator('a[href*="/work/retryfi"]')).toHaveCount(1);
  await expect(contents.locator('a[href*="/work/alkimi-labs"]')).toHaveCount(1);
  await expect(contents.locator('a[href*="/work/credilabs"]')).toHaveCount(1);
  await expect(contents.locator('a[href*="/process"]')).toHaveCount(1);
});

test('E4 (partial): zero third-party requests on home', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost:3006')) external.push(r.url());
  });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  expect(external).toEqual([]);
});
