import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadCaseStudies, loadCaseStudy } from '@/lib/content';

const WORK_DIR = path.join(process.cwd(), 'content', 'work');

describe('U1: case-study frontmatter', () => {
  it('loads every content/work/*.mdx and validates against the schema', () => {
    const files = fs.readdirSync(WORK_DIR).filter((f) => f.endsWith('.mdx'));
    const studies = loadCaseStudies();
    expect(studies.length).toBe(files.length);
  });

  it('has exactly 3 case studies in v1', () => {
    expect(loadCaseStudies().length).toBe(3);
  });

  it('slugs are unique and match their filenames', () => {
    const studies = loadCaseStudies();
    const slugs = studies.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(fs.existsSync(path.join(WORK_DIR, `${slug}.mdx`))).toBe(true);
    }
  });

  it('features 2-3 case studies for the home page', () => {
    const featured = loadCaseStudies().filter((s) => s.featured);
    expect(featured.length).toBeGreaterThanOrEqual(2);
    expect(featured.length).toBeLessThanOrEqual(3);
  });

  it('orders are consecutive starting at 1, and studies come back sorted', () => {
    const studies = loadCaseStudies();
    expect(studies.map((s) => s.order)).toEqual(
      Array.from({ length: studies.length }, (_, i) => i + 1),
    );
  });

  it('every link is a well-formed https URL', () => {
    for (const study of loadCaseStudies()) {
      expect(study.links.length).toBeGreaterThanOrEqual(1);
      for (const link of study.links) {
        expect(link.url.startsWith('https://')).toBe(true);
      }
    }
  });

  it('loadCaseStudy returns frontmatter plus MDX body', () => {
    const study = loadCaseStudy('retryfi');
    expect(study.title.length).toBeGreaterThan(0);
    expect(study.body.length).toBeGreaterThan(0);
  });

  it('loadCaseStudy throws on an unknown slug', () => {
    expect(() => loadCaseStudy('does-not-exist')).toThrow();
  });

  it('RetryFi is the only full-ownership role claim (SPEC ownership accuracy)', () => {
    for (const study of loadCaseStudies()) {
      if (study.slug === 'retryfi') {
        expect(study.role.toLowerCase()).toContain('solo founder');
      } else {
        expect(study.role.toLowerCase()).not.toContain('solo');
        expect(study.role.toLowerCase()).not.toContain('full stack');
      }
    }
  });
});
