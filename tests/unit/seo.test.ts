import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { publicRoutes } from '@/lib/routes';
import { SITE_URL } from '@/lib/site';
import { canonicalFor, seoMeta, siteGraph, caseStudyJsonLd, jsonLdScript } from '@/lib/seo';
import { loadCaseStudy } from '@/lib/content';
// eslint-disable-next-line import/no-relative-packages
import { stampHtml, stripRuntime } from '../../scripts/stamp.mjs';

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

describe('U9: canonical URLs and per-page OpenGraph', () => {
  it('canonicalFor resolves a route absolutely against SITE_URL, trailing slash kept', () => {
    expect(canonicalFor('/')).toBe(new URL('/', SITE_URL).toString());
    expect(canonicalFor('/work/retryfi/')).toBe(new URL('/work/retryfi/', SITE_URL).toString());
  });

  it('seoMeta emits canonical, og url/type/siteName, and the route og image', () => {
    const meta = seoMeta('/work/retryfi/', 'article');
    expect(meta.alternates?.canonical).toBe(canonicalFor('/work/retryfi/'));
    expect(meta.openGraph?.url).toBe(canonicalFor('/work/retryfi/'));
    expect(meta.openGraph && 'type' in meta.openGraph && meta.openGraph.type).toBe('article');
    expect(meta.openGraph?.siteName).toBeTruthy();
    expect(meta.openGraph?.images).toEqual(['/og/work-retryfi.png']);
  });

  it('seoMeta defaults to og type website', () => {
    const meta = seoMeta('/about/');
    expect(meta.openGraph && 'type' in meta.openGraph && meta.openGraph.type).toBe('website');
    expect(meta.openGraph?.images).toEqual(['/og/about.png']);
  });
});

describe('U9: JSON-LD structured data', () => {
  it('site graph declares the Person (profiles, employer) and the WebSite naming them', () => {
    const graph = siteGraph()['@graph'];
    const person = graph.find((n) => n['@type'] === 'Person');
    expect(person?.name).toBe('Dani Calvo');
    expect(person?.jobTitle).toBe('Software engineer');
    expect(person?.worksFor?.name).toBe('Alkimi');
    for (const profile of [
      'https://x.com/danicalvo89',
      'https://github.com/danielcalvolopez',
      'https://www.linkedin.com/in/daniel-calvo-lopez-97607187/',
    ]) {
      expect(person?.sameAs).toContain(profile);
    }
    const site = graph.find((n) => n['@type'] === 'WebSite');
    expect(site?.url).toBe(canonicalFor('/'));
    expect(site?.author?.['@id']).toBe(person?.['@id']);
  });

  it('caseStudyJsonLd maps frontmatter onto a TechArticle', () => {
    const study = loadCaseStudy('retryfi');
    const article = caseStudyJsonLd(study);
    expect(article['@type']).toBe('TechArticle');
    expect(article.headline).toBe(study.title);
    expect(article.description).toBe(study.summary);
    expect(article.abstract).toBe(study.abstract);
    expect(article.keywords).toBe(study.indexTerms.join(', '));
    expect(article.url).toBe(canonicalFor('/work/retryfi/'));
    expect(article.image).toBe(new URL('/og/work-retryfi.png', SITE_URL).toString());
    expect(article.author?.['@id']).toBeTruthy();
    expect(article.inLanguage).toBe('en');
  });

  it('jsonLdScript escapes < so content cannot break out of the script tag', () => {
    const out = jsonLdScript({ name: '</script><script>alert(1)' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out.replaceAll('\\u003c', '<')).name).toBe('</script><script>alert(1)');
  });

  it('stripRuntime keeps application/ld+json scripts while stripping the runtime', () => {
    const html = [
      '<script src="/_next/static/chunks/main.js"></script>',
      '<script type="application/ld+json">{"@context":"https://schema.org"}</script>',
      '<script>self.__next_f=[]</script>',
    ].join('');
    const out = stripRuntime(html);
    expect(out).toContain('application/ld+json');
    expect(out).toContain('"@context":"https://schema.org"');
    expect(out).not.toContain('/_next/static/chunks/main.js');
    expect(out).not.toContain('__next_f');
  });

  it('stripRuntime drops flight chunks that merely mention ld+json in their payload', () => {
    // The RSC flight data serializes the JSON-LD element's props, so the
    // keep-check must read the type attribute, not the script content.
    const flight =
      '<script>self.__next_f.push([1,"[\\"script\\",{\\"type\\":\\"application/ld+json\\"}]"])</script>';
    expect(stripRuntime(flight)).toBe('');
  });
});

const OUT_DIR = path.join(process.cwd(), 'out');

describe.skipIf(!fs.existsSync(OUT_DIR))('U9: exported HTML carries the SEO layer', () => {
  const pageFile = (route: string) => path.join(OUT_DIR, ...route.split('/').filter(Boolean), 'index.html');

  it('every public route has exactly one canonical link, pointing at itself', () => {
    for (const route of publicRoutes()) {
      const html = fs.readFileSync(pageFile(route), 'utf8');
      const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
      expect(canonicals, route).toHaveLength(1);
      expect(canonicals[0][1], route).toBe(canonicalFor(route));
    }
  });

  it('every public route embeds parseable JSON-LD; case studies add a TechArticle', () => {
    for (const route of publicRoutes()) {
      const html = fs.readFileSync(pageFile(route), 'utf8');
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      expect(blocks.length, route).toBeGreaterThan(0);
      const types = blocks.flatMap((b) => {
        const parsed = JSON.parse(b[1]);
        return (parsed['@graph'] ?? [parsed]).map((n: { '@type': string }) => n['@type']);
      });
      expect(types, route).toContain('Person');
      expect(types, route).toContain('WebSite');
      if (/^\/work\/.+/.test(route)) expect(types, route).toContain('TechArticle');
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
