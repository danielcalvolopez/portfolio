import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// E2: axe on every route, zero violations at WCAG AA.
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
  test(`a11y ${route}: zero axe violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

for (const route of ROUTES) {
  test(`E5 ${route}: nothing animates under prefers-reduced-motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const running = await page.evaluate(() => document.getAnimations().length);
    expect(running).toBe(0);
  });
}

test('E6: skip link is the first tabbable element and focus is visible', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveClass(/skip/);
  await expect(focused).toBeVisible();
});
