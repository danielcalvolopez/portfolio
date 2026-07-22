import { test, expect } from '@playwright/test';

// E3: visual regression on the three key pages at the three key widths.
const PAGES = ['/', '/work/retryfi/', '/process/'];
const WIDTHS = [320, 768, 1440];

for (const route of PAGES) {
  for (const width of WIDTHS) {
    test(`visual ${route} @ ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1200 });
      // font-display: optional races the screenshot (a late font is never
      // applied, by design). For visual tests only, rewrite it to `block` so
      // the true typefaces always render; production markup is untouched.
      await page.route('**/*', async (r) => {
        if (r.request().resourceType() !== 'document') return r.continue();
        const resp = await r.fetch();
        const body = (await resp.text()).replaceAll('font-display:optional', 'font-display:block');
        await r.fulfill({ response: resp, body });
      });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(
        `${route === '/' ? 'home' : route.replaceAll('/', ' ').trim().replaceAll(' ', '-')}-${width}.png`,
        { fullPage: true, maxDiffPixelRatio: 0.001 },
      );
    });
  }
}
