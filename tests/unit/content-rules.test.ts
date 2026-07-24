import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadCaseStudies, loadSecondary } from '@/lib/content';

const stripTodos = (s: string) => s.replace(/\[TODO:[^\]]*\]/g, '');

/* U5. The one project that must never be named cannot be tested for by name
   (the test would contain it); that rule stays a review gate. Everything
   mechanical about confidentiality is enforced here. */
const ALLOWED_HOSTS = new Set([
  'retryfi.com',
  'credilabs.io',
  'alkimi.org',
  'www.alkimi.org',
  'labs.alkimi.org',
  'docs.alkimi.org',
  'x.com',
  'github.com',
  'linkedin.com',
  'www.linkedin.com',
  'example.invalid', // SITE_URL placeholder until the domain is set at deploy
]);
const INTERNAL_MARKERS = [/kensaltensi/i, /atlassian/i, /ALKIMILABS-\d/, /CRED-\d/, /\.vercel\.app/i];
const OUT_DIR = path.join(process.cwd(), 'out');

function collectHtmlFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return collectHtmlFiles(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}

describe('U5: confidentiality (SPEC allowlist + internal markers)', () => {
  it('every external URL in content resolves to an allowlisted host', () => {
    for (const study of loadCaseStudies()) {
      const urls = [
        ...study.links.map((l) => l.url),
        ...(`${study.abstract} ${study.body}`.match(/https?:\/\/[^\s)"'<]+/g) ?? []),
      ];
      for (const url of urls) {
        expect(ALLOWED_HOSTS.has(new URL(url).hostname), `${study.slug}: ${url}`).toBe(true);
      }
    }
    for (const entry of loadSecondary()) {
      if (entry.url) {
        expect(ALLOWED_HOSTS.has(new URL(entry.url).hostname), entry.title).toBe(true);
      }
    }
  });

  it('no internal markers in content', () => {
    for (const study of loadCaseStudies()) {
      const text = `${study.abstract} ${study.body}`;
      for (const marker of INTERNAL_MARKERS) {
        expect(text, `${study.slug}: ${marker}`).not.toMatch(marker);
      }
    }
  });

  describe.skipIf(!fs.existsSync(OUT_DIR))('built HTML', () => {
    it('every href in the export is internal, allowlisted, or mailto', () => {
      for (const file of collectHtmlFiles(OUT_DIR)) {
        const html = fs.readFileSync(file, 'utf8');
        for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
          expect(ALLOWED_HOSTS.has(new URL(m[1]).hostname), `${file}: ${m[1]}`).toBe(true);
        }
        for (const marker of INTERNAL_MARKERS) {
          expect(html, `${file}: ${marker}`).not.toMatch(marker);
        }
      }
    });
  });
});

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
