import { describe, it, expect } from 'vitest';
import { loadCaseStudies, loadSecondary } from '@/lib/content';

const stripTodos = (s: string) => s.replace(/\[TODO:[^\]]*\]/g, '');

describe('U7: copy register (DESIGN.md author rules)', () => {
  it('body copy contains no em-dashes outside TODO markers', () => {
    for (const study of loadCaseStudies()) {
      expect(stripTodos(study.body)).not.toContain('—');
    }
  });

  it('body copy contains no exclamation marks', () => {
    for (const study of loadCaseStudies()) {
      expect(stripTodos(study.body)).not.toContain('!');
    }
  });

  it('banned marketing register appears nowhere', () => {
    const banned = [/crafting digital/i, /turning ideas into/i, /passionate about/i];
    for (const study of loadCaseStudies()) {
      for (const pattern of banned) {
        expect(study.body).not.toMatch(pattern);
        expect(study.abstract).not.toMatch(pattern);
      }
    }
  });
});

describe('U8: document grammar', () => {
  it('every case study contains exactly one Warning block, in the differently section', () => {
    for (const study of loadCaseStudies()) {
      const warnings = study.body.match(/<Warning>/g) ?? [];
      expect(warnings, study.slug).toHaveLength(1);
      const differentlyIdx = study.body.indexOf("## What I'd do differently");
      expect(differentlyIdx, study.slug).toBeGreaterThan(-1);
      expect(study.body.indexOf('<Warning>'), study.slug).toBeGreaterThan(differentlyIdx);
    }
  });
});

describe('U6: CrediLabs ownership accuracy (SPEC confidentiality rules)', () => {
  it('role wording scopes ownership to the frontend, inside a team', () => {
    const credi = loadCaseStudies().find((s) => s.slug === 'credilabs');
    expect(credi?.role).toBe(
      'Frontend owner (architecture + implementation) in a cross-functional team',
    );
  });

  it('credilabs copy is past tense: no ongoing-engagement language', () => {
    const credi = loadCaseStudies().find((s) => s.slug === 'credilabs');
    const text = `${credi?.abstract} ${stripTodos(credi?.body ?? '')}`.toLowerCase();
    for (const banned of ['currently', 'ongoing', 'to this day', 'we continue']) {
      expect(text, banned).not.toContain(banned);
    }
  });

  it('nobody but RetryFi claims UI/UX design', () => {
    for (const study of loadCaseStudies()) {
      if (study.slug === 'retryfi') continue;
      const text = `${study.abstract} ${study.body}`.toLowerCase();
      for (const banned of ['designed the ui', 'designed the ux', 'visual design was mine']) {
        expect(text, `${study.slug}: ${banned}`).not.toContain(banned);
      }
    }
  });
});

describe('U1b: secondary work entries', () => {
  it('validates all secondary entries against the schema', () => {
    const entries = loadSecondary();
    expect(entries.length).toBe(3);
    for (const e of entries) {
      expect(e.line.length).toBeLessThanOrEqual(160);
    }
  });

  it('secondary entries never claim visual design or full ownership (SPEC)', () => {
    for (const e of loadSecondary()) {
      expect(e.line.toLowerCase()).not.toMatch(/designed the ui|visual design|owned the platform/);
    }
  });
});
