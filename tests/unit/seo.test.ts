import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { publicRoutes } from '@/lib/routes';
// eslint-disable-next-line import/no-relative-packages
import { stampHtml } from '../../scripts/stamp.mjs';

describe('U2/U3: route manifest and sitemap correctness', () => {
  it('publicRoutes lists exactly the information architecture', () => {
    expect(publicRoutes().sort()).toEqual(
      [
        '/',
        '/work/',
        '/work/retryfi/',
        '/work/alkimi-labs/',
        '/work/credilabs/',
        '/process/',
        '/about/',
      ].sort(),
    );
  });

  it('sitemap lists every public route as an absolute URL, nothing else', () => {
    const entries = sitemap();
    const urls = entries.map((e) => new URL(e.url));
    expect(urls.length).toBe(publicRoutes().length);
    const paths = urls.map((u) => u.pathname).sort();
    expect(paths).toEqual(publicRoutes().sort());
    for (const u of urls) expect(u.protocol).toBe('https:');
  });

  it('robots allows everything and points at the sitemap', () => {
    const r = robots();
    expect(JSON.stringify(r.rules)).toContain('"allow":"/"');
    expect(r.sitemap).toMatch(/^https:\/\/.+\/sitemap\.xml$/);
  });
});

describe('U4: OG images', () => {
  it('every public route has a generated 1200x630 PNG', () => {
    for (const route of publicRoutes()) {
      const name = route === '/' ? 'home' : route.replaceAll('/', ' ').trim().replaceAll(' ', '-');
      const file = path.join(process.cwd(), 'public', 'og', `${name}.png`);
      expect(fs.existsSync(file), file).toBe(true);
      const buf = fs.readFileSync(file);
      expect(buf.subarray(1, 4).toString()).toBe('PNG');
      expect(buf.readUInt32BE(16)).toBe(1200);
      expect(buf.readUInt32BE(20)).toBe(630);
    }
  });
});

describe('footer weight stamp', () => {
  it('replaces the pending placeholder with a rounded KB figure', () => {
    const html = '<span data-page-weight="pending">·· KB</span>';
    const out = stampHtml(html, 41.4);
    expect(out).toContain('>41 KB<');
    expect(out).not.toContain('·· KB');
    expect(out).toContain('data-page-weight="41"');
  });
});
