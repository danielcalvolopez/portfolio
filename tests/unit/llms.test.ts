import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { buildLlmsTxt, buildLlmsFullTxt } from '@/lib/llms';
import { canonicalFor } from '@/lib/seo';
import { loadCaseStudies } from '@/lib/content';
import { GET as getLlms } from '@/app/llms.txt/route';
import { GET as getLlmsFull } from '@/app/llms-full.txt/route';

describe('U10: llms.txt index', () => {
  const txt = buildLlmsTxt();

  it('opens with the H1 and a one-line blockquote summary (llmstxt.org shape)', () => {
    const lines = txt.split('\n');
    expect(lines[0]).toBe('# Dani Calvo');
    expect(lines.some((l) => l.startsWith('> '))).toBe(true);
  });

  it('links every case study by absolute URL with its summary', () => {
    for (const study of loadCaseStudies()) {
      const url = canonicalFor(`/work/${study.slug}/`);
      expect(txt).toContain(`[${study.title}](${url})`);
      expect(txt).toContain(study.summary);
    }
  });

  it('links the work index, process, and about pages', () => {
    for (const route of ['/work/', '/process/', '/about/']) {
      expect(txt).toContain(canonicalFor(route));
    }
  });

  it('points at llms-full.txt for the full text', () => {
    expect(txt).toContain(canonicalFor('/llms-full.txt'));
  });
});

describe('U10: llms-full.txt full content', () => {
  const txt = buildLlmsFullTxt();

  it('carries every case study with its front matter and body', () => {
    for (const study of loadCaseStudies()) {
      expect(txt).toContain(`# ${study.title}`);
      expect(txt).toContain(`Role: ${study.role}`);
      expect(txt).toContain(study.abstract);
      expect(txt).toContain(`Stack: ${study.stack.join(', ')}`);
    }
  });

  it('translates MDX components into prose: captions kept, tags gone', () => {
    expect(txt).toContain('Figure 1:');
    expect(txt).toContain('Table 1:');
    for (const tag of ['<Fig', '<Data', '</Data>', '<Warning>', '</Warning>', '<Note>', '</Note>']) {
      expect(txt).not.toContain(tag);
    }
  });
});

describe('U10: text routes', () => {
  it('GET /llms.txt serves the index as UTF-8 plain text', async () => {
    const res = getLlms();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe(buildLlmsTxt());
  });

  it('GET /llms-full.txt serves the full text as UTF-8 plain text', async () => {
    const res = getLlmsFull();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe(buildLlmsFullTxt());
  });
});

const OUT_DIR = path.join(process.cwd(), 'out');

describe.skipIf(!fs.existsSync(OUT_DIR))('U10: exported artifacts', () => {
  it('the export contains llms.txt and llms-full.txt matching the builders', () => {
    expect(fs.readFileSync(path.join(OUT_DIR, 'llms.txt'), 'utf8')).toBe(buildLlmsTxt());
    expect(fs.readFileSync(path.join(OUT_DIR, 'llms-full.txt'), 'utf8')).toBe(buildLlmsFullTxt());
  });
});
