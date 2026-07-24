# Alkimi Live Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A committed-snapshot data pipeline (`npm run data`) that renders Alkimi's public throughput data into the case study as a stat line and a Fig. 2 chart.

**Architecture:** One Node ESM script (`scripts/data.mjs`) exporting pure functions (windowing, weekly downsampling, summary, SVG rendering, MDX stamping) with I/O only in its CLI block, mirroring `scripts/stamp.mjs`. It fetches the Alkimi Community Data API, then writes three committed artifacts all-or-nothing: `content/data/alkimi-metrics.json`, `public/figs/alkimi-throughput.svg`, and stamped tokens inside `content/work/alkimi-labs.mdx`.

**Tech Stack:** Node 20+ ESM (`.mjs`), zod 4 (already a dependency), vitest, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-24-alkimi-live-data-design.md` — read it first.

## Global Constraints

- Zero client JS: nothing here may add runtime JavaScript; `scripts/stamp.mjs` strips it post-build anyway.
- `npm run data` is NOT part of the `build` script chain. `next build` never touches the network.
- Figure conventions (match `public/figs/alkimi-claim.svg`): spot ink `#0057A8` stroke-width 1.5 for data linework; secondary ink `#6A665B` for hairlines/small labels; Archivo uppercase labels; `role="img"` + `aria-label`.
- Chart: `viewBox="0 0 690 220"`; generated SVG must stay under 5 KB (it counts toward the stamped page weight).
- API truth (verified live 2026-07-24): fields are camelCase — `imprCount`, `txnCount`, `alkimiRevenueInUSD` (string), `alkimiRevenueInTokens` (can be literal string "null"). Docs show snake_case; ignore the docs. Max 31 days per request. 429 + `X-RateLimit-Reset` header on rate limit.
- `SERIES_START = '2024-01-01'` (probed: 2023 queries return empty data).
- Content confidentiality (tests/unit/content-rules.test.ts): no new `https://` URLs in content — `api.alkimi.org` may appear only as schemeless text; `docs.alkimi.org` is already allowlisted.
- All-or-nothing writes: compute every output, then write; any failure exits nonzero having written nothing.
- Stamping is idempotent: a second run with the same data produces byte-identical files.
- The repo working tree currently has unrelated modified files. `git add` explicit paths only. NEVER `git add -A` / `git add .`.
- All date math in UTC (`Date.UTC`, `T00:00:00Z` suffixes) so results don't depend on the machine's timezone.

## File Structure

- Create `scripts/data.mjs` — all pipeline logic; pure functions exported, I/O in CLI block.
- Create `scripts/data.d.mts` — hand-written declarations so TypeScript tests/builds can import the `.mjs` cleanly.
- Create `tests/unit/data.test.ts` — unit tests for every exported function.
- Modify `src/lib/llms.ts` — `mdxToMarkdown` strips MDX comments.
- Modify `tests/unit/llms.test.ts` — test for the comment strip.
- Modify `content/work/alkimi-labs.mdx` — stat markers in Context, Fig. 2 in What shipped.
- Modify `package.json` — add `"data"` script.
- Generated, committed: `content/data/alkimi-metrics.json`, `public/figs/alkimi-throughput.svg`.

---

### Task 1: Date windowing, weekly downsampling, summary

**Files:**
- Create: `scripts/data.mjs`
- Create: `scripts/data.d.mts`
- Test: `tests/unit/data.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by Tasks 2, 4, 6):
  - `SERIES_START: string` — `'2024-01-01'`
  - `windows(start: string, end: string): { start: string; end: string }[]` — inclusive YYYY-MM-DD windows, each ≤ 31 days, gapless, non-overlapping
  - `downsampleWeekly(series: { date: string; imprCount: number }[]): { date: string; mean: number }[]` — consecutive 7-day buckets anchored at the series start; bucket `date` = first day; trailing partial bucket dropped; mean rounded
  - `summarize(series: { date: string; imprCount: number }[]): { trailing7DayMeanImpressions: number; display: string }` — mean of the last ≤7 entries; display like `"8.8 million"`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/data.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SERIES_START, windows, downsampleWeekly, summarize } from '../../scripts/data.mjs';

const day = (date: string, imprCount: number) => ({ date, imprCount });

describe('windows', () => {
  it('returns a single window when the range fits in 31 days', () => {
    expect(windows('2024-01-01', '2024-01-15')).toEqual([{ start: '2024-01-01', end: '2024-01-15' }]);
  });

  it('splits long ranges into inclusive 31-day windows', () => {
    expect(windows('2024-01-01', '2024-02-15')).toEqual([
      { start: '2024-01-01', end: '2024-01-31' },
      { start: '2024-02-01', end: '2024-02-15' },
    ]);
  });

  it('is gapless, non-overlapping, and covers the whole range', () => {
    const ws = windows(SERIES_START, '2024-03-05');
    expect(ws[0].start).toBe(SERIES_START);
    expect(ws[ws.length - 1].end).toBe('2024-03-05');
    for (let i = 1; i < ws.length; i++) {
      const prevEnd = new Date(`${ws[i - 1].end}T00:00:00Z`).getTime();
      const nextStart = new Date(`${ws[i].start}T00:00:00Z`).getTime();
      expect(nextStart - prevEnd).toBe(86_400_000);
    }
    for (const w of ws) {
      const days =
        (new Date(`${w.end}T00:00:00Z`).getTime() - new Date(`${w.start}T00:00:00Z`).getTime()) / 86_400_000 + 1;
      expect(days).toBeLessThanOrEqual(31);
    }
  });
});

describe('downsampleWeekly', () => {
  it('averages 7-day buckets anchored at the series start and drops the trailing partial bucket', () => {
    const series = [
      ...Array.from({ length: 7 }, (_, i) => day(`2024-01-0${i + 1}`, 100)),
      ...Array.from({ length: 7 }, (_, i) => day(`2024-01-${String(i + 8).padStart(2, '0')}`, 200)),
      day('2024-01-15', 9999), // partial bucket: dropped
    ];
    expect(downsampleWeekly(series)).toEqual([
      { date: '2024-01-01', mean: 100 },
      { date: '2024-01-08', mean: 200 },
    ]);
  });

  it('rounds means to integers', () => {
    const series = Array.from({ length: 7 }, (_, i) => day(`2024-02-0${i + 1}`, i)); // 0..6, mean 3
    expect(downsampleWeekly(series)).toEqual([{ date: '2024-02-01', mean: 3 }]);
  });
});

describe('summarize', () => {
  it('takes the mean of the trailing 7 days and formats millions to one decimal', () => {
    const series = [
      day('2026-07-16', 1), // outside the trailing window
      ...Array.from({ length: 7 }, (_, i) => day(`2026-07-${17 + i}`, 8_800_000)),
    ];
    expect(summarize(series)).toEqual({
      trailing7DayMeanImpressions: 8_800_000,
      display: '8.8 million',
    });
  });

  it('handles series shorter than 7 days', () => {
    expect(summarize([day('2024-01-01', 2_000_000)])).toEqual({
      trailing7DayMeanImpressions: 2_000_000,
      display: '2.0 million',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: FAIL — cannot resolve `../../scripts/data.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/data.mjs`:

```js
// Refreshable Alkimi throughput snapshot (spec:
// docs/superpowers/specs/2026-07-24-alkimi-live-data-design.md). Run via
// `npm run data`; deliberately NOT part of `npm run build` — the site ships
// the committed snapshot and never depends on the API being up.
export const SERIES_START = '2024-01-01';

const DAY_MS = 86_400_000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const ms = (date) => new Date(`${date}T00:00:00Z`).getTime();

/* The API caps ranges at 31 days; cover [start, end] with inclusive,
   gapless windows. */
export function windows(start, end) {
  const out = [];
  let cur = ms(start);
  const stop = ms(end);
  while (cur <= stop) {
    const winEnd = Math.min(cur + 30 * DAY_MS, stop);
    out.push({ start: iso(cur), end: iso(winEnd) });
    cur = winEnd + DAY_MS;
  }
  return out;
}

/* Consecutive 7-day buckets anchored at the series start — not ISO calendar
   weeks. The trailing partial bucket is dropped so the chart's last point
   isn't a misleading dip. */
export function downsampleWeekly(series) {
  const weekly = [];
  for (let i = 0; i + 7 <= series.length; i += 7) {
    const bucket = series.slice(i, i + 7);
    weekly.push({
      date: bucket[0].date,
      mean: Math.round(bucket.reduce((sum, row) => sum + row.imprCount, 0) / 7),
    });
  }
  return weekly;
}

export function summarize(series) {
  const tail = series.slice(-7);
  const mean = Math.round(tail.reduce((sum, row) => sum + row.imprCount, 0) / tail.length);
  return {
    trailing7DayMeanImpressions: mean,
    display: `${(mean / 1e6).toFixed(1)} million`,
  };
}
```

Create `scripts/data.d.mts` (keeps TypeScript happy when tests import the `.mjs`; extended in later tasks):

```ts
export const SERIES_START: string;
export function windows(start: string, end: string): { start: string; end: string }[];
export function downsampleWeekly(
  series: { date: string; imprCount: number }[],
): { date: string; mean: number }[];
export function summarize(series: { date: string; imprCount: number }[]): {
  trailing7DayMeanImpressions: number;
  display: string;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/data.mjs scripts/data.d.mts tests/unit/data.test.ts
git commit -m "Alkimi data pipeline: windowing, weekly downsample, summary"
```

---

### Task 2: Chart SVG rendering

**Files:**
- Modify: `scripts/data.mjs` (append)
- Modify: `scripts/data.d.mts` (append)
- Test: `tests/unit/data.test.ts` (append)

**Interfaces:**
- Consumes: `downsampleWeekly` output shape `{ date, mean }[]` from Task 1.
- Produces (used by Tasks 3, 6):
  - `monthYear(dateStr: string): string` — `'2026-07-24'` → `'July 2026'`
  - `renderChartSvg(weekly: { date: string; mean: number }[], opts: { monthYear: string }): string` — complete SVG document text

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/data.test.ts` (add `monthYear, renderChartSvg` to the import from `../../scripts/data.mjs`):

```ts
describe('monthYear', () => {
  it('formats an ISO date as Month YYYY in UTC', () => {
    expect(monthYear('2026-07-24')).toBe('July 2026');
    expect(monthYear('2024-01-01')).toBe('January 2024');
  });
});

describe('renderChartSvg', () => {
  // Two years of weekly points ramping 100k → ~9.1M, like the real series.
  const weekly = Array.from({ length: 130 }, (_, i) => ({
    date: new Date(Date.UTC(2024, 0, 1) + i * 7 * 86_400_000).toISOString().slice(0, 10),
    mean: 100_000 + Math.round((i / 129) * 9_000_000),
  }));
  const svg = renderChartSvg(weekly, { monthYear: 'July 2026' });

  it('uses the pinned viewBox and is described for screen readers', () => {
    expect(svg).toContain('viewBox="0 0 690 220"');
    expect(svg).toContain('role="img"');
    expect(svg).toMatch(/aria-label="[^"]*January 2024 to July 2026[^"]*"/);
  });

  it('draws one spot-ink polyline with one point per week', () => {
    const points = svg.match(/<polyline[^>]*points="([^"]*)"/)?.[1] ?? '';
    expect(points.split(' ')).toHaveLength(130);
    expect(svg).toMatch(/<polyline[^>]*stroke="#0057A8"[^>]*stroke-width="1.5"/);
  });

  it('labels the y axis in compact millions up to a 5M-rounded max', () => {
    expect(svg).toContain('>10M<');
    expect(svg).toContain('>5M<');
    expect(svg).toContain('>0<');
  });

  it('ticks the x axis at January and July boundaries', () => {
    expect(svg).toContain('JAN 2025');
    expect(svg).toContain('JUL 2025');
  });

  it('stays well under the 5 KB page-weight budget', () => {
    expect(Buffer.byteLength(svg)).toBeLessThan(5000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: FAIL — `monthYear` / `renderChartSvg` not exported.

- [ ] **Step 3: Write the implementation**

Append to `scripts/data.mjs`:

```js
export function monthYear(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/* Fig. 2. Conventions follow public/figs/alkimi-claim.svg: spot ink for the
   data line, secondary-ink hairlines, Archivo labels (SVG-in-<img> falls back
   to system sans; true of every figure on the site). */
export function renderChartSvg(weekly, { monthYear: endLabel }) {
  const W = 690, H = 220, L = 46, R = 10, T = 12, B = 30;
  const innerW = W - L - R;
  const innerH = H - T - B;
  const x0 = ms(weekly[0].date);
  const x1 = ms(weekly[weekly.length - 1].date);
  const yMax = Math.max(5e6, Math.ceil(Math.max(...weekly.map((w) => w.mean)) / 5e6) * 5e6);
  const px = (t) => L + ((t - x0) / (x1 - x0)) * innerW;
  const py = (v) => T + innerH - (v / yMax) * innerH;

  const points = weekly.map((w) => `${px(ms(w.date)).toFixed(1)},${py(w.mean).toFixed(1)}`).join(' ');

  const yTicks = [];
  for (let v = 0; v <= yMax; v += 5e6) yTicks.push(v);
  const grid = yTicks.map((v) => `<path d="M${L} ${py(v).toFixed(1)}H${W - R}"/>`).join('');
  const yLabels = yTicks
    .map(
      (v) =>
        `<text x="${L - 6}" y="${(py(v) + 3).toFixed(1)}" text-anchor="end">${v === 0 ? '0' : `${v / 1e6}M`}</text>`,
    )
    .join('');

  const xTicks = [];
  for (let y = new Date(x0).getUTCFullYear(); y <= new Date(x1).getUTCFullYear(); y++) {
    for (const m of [0, 6]) {
      const t = Date.UTC(y, m, 1);
      if (t >= x0 && t <= x1) xTicks.push({ t, label: `${m === 0 ? 'JAN' : 'JUL'} ${y}` });
    }
  }
  const xMarks = xTicks.map(({ t }) => `<path d="M${px(t).toFixed(1)} ${T + innerH}v4"/>`).join('');
  const xLabels = xTicks
    .map(({ t, label }) => `<text x="${px(t).toFixed(1)}" y="${H - 10}" text-anchor="middle">${label}</text>`)
    .join('');

  return [
    `<svg viewBox="0 0 690 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Impressions settled per day on the Alkimi ad exchange, weekly means, January 2024 to ${endLabel}">`,
    `  <g fill="none" stroke="#6A665B" stroke-width="0.5">${grid}${xMarks}</g>`,
    `  <g fill="#6A665B" font-family="Archivo, sans-serif" font-size="8.5" letter-spacing="0.4">${yLabels}${xLabels}</g>`,
    `  <polyline fill="none" stroke="#0057A8" stroke-width="1.5" points="${points}"/>`,
    `</svg>`,
    ``,
  ].join('\n');
}
```

Append to `scripts/data.d.mts`:

```ts
export function monthYear(dateStr: string): string;
export function renderChartSvg(
  weekly: { date: string; mean: number }[],
  opts: { monthYear: string },
): string;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/data.mjs scripts/data.d.mts tests/unit/data.test.ts
git commit -m "Alkimi data pipeline: throughput chart SVG renderer"
```

---

### Task 3: MDX stamping

**Files:**
- Modify: `scripts/data.mjs` (append)
- Modify: `scripts/data.d.mts` (append)
- Test: `tests/unit/data.test.ts` (append)

**Interfaces:**
- Consumes: `summarize().display` (Task 1), `monthYear()` (Task 2).
- Produces (used by Task 6):
  - `stampMdx(mdx: string, opts: { display: string; monthYear: string; retrieved: string }): string` — returns the stamped document; throws on any missing marker/token, writing nothing.

The markers/tokens it targets (Task 6 adds them to the real MDX):
- Stat span: `{/*data:impr*/}` … `{/*data:end*/}` — entire span replaced with `` {/*data:impr*/}around <display> impressions settled per day as of <monthYear>{/*data:end*/} ``.
- In the `<Fig ... src="/figs/alkimi-throughput.svg" ... />` tag only: the range-end token `` to <Month> <YYYY>. `` and the retrieval token `` retrieved <YYYY-MM-DD> ``.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/data.test.ts` (add `stampMdx` to the import):

```ts
describe('stampMdx', () => {
  const fixture = [
    'alongside — {/*data:impr*/}around 1.0 million impressions settled per day as of January 2024{/*data:end*/}. It is',
    'a team product.',
    '',
    '<Fig n="2" caption="Impressions settled per day across the exchange, weekly means, January 2024 to January 2024. Source: Alkimi community data API (docs.alkimi.org), retrieved 2024-01-31. Linework prints in the spot ink." src="/figs/alkimi-throughput.svg" alt="Line chart" w="690" h="220" />',
  ].join('\n');
  const opts = { display: '8.8 million', monthYear: 'July 2026', retrieved: '2026-07-24' };

  it('rewrites the stat span and both caption tokens', () => {
    const out = stampMdx(fixture, opts);
    expect(out).toContain(
      '{/*data:impr*/}around 8.8 million impressions settled per day as of July 2026{/*data:end*/}',
    );
    expect(out).toContain('January 2024 to July 2026. Source:');
    expect(out).toContain('retrieved 2026-07-24');
    expect(out).not.toContain('2024-01-31');
  });

  it('is idempotent', () => {
    const once = stampMdx(fixture, opts);
    expect(stampMdx(once, opts)).toBe(once);
  });

  it('does not touch the fixed series start in the caption', () => {
    expect(stampMdx(fixture, opts)).toContain('weekly means, January 2024 to July 2026');
  });

  it('throws when the stat markers are missing', () => {
    expect(() => stampMdx(fixture.replace('{/*data:impr*/}', ''), opts)).toThrow(/data:impr/);
  });

  it('throws when the throughput Fig tag is missing', () => {
    expect(() => stampMdx(fixture.replace('alkimi-throughput.svg', 'other.svg'), opts)).toThrow(/Fig/);
  });

  it('throws when a caption token is missing', () => {
    expect(() => stampMdx(fixture.replace('retrieved 2024-01-31', 'retrieved sometime'), opts)).toThrow(
      /caption/,
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: FAIL — `stampMdx` not exported.

- [ ] **Step 3: Write the implementation**

Append to `scripts/data.mjs`:

```js
/* Source-level stamping, same move stamp.mjs makes post-build for page
   weight. Explicit markers, loud failures, no partial writes. */
export function stampMdx(mdx, { display, monthYear: endLabel, retrieved }) {
  const statRe = /\{\/\*data:impr\*\/\}[\s\S]*?\{\/\*data:end\*\/\}/;
  if (!statRe.test(mdx)) throw new Error('stampMdx: {/*data:impr*/}…{/*data:end*/} markers not found');

  const figRe = /<Fig\b[^>]*src="\/figs\/alkimi-throughput\.svg"[^>]*\/>/;
  const fig = mdx.match(figRe)?.[0];
  if (!fig) throw new Error('stampMdx: Fig tag for /figs/alkimi-throughput.svg not found');

  const rangeRe = /to [A-Z][a-z]+ \d{4}\. Source:/;
  const retrievedRe = /retrieved \d{4}-\d{2}-\d{2}/;
  if (!rangeRe.test(fig) || !retrievedRe.test(fig)) {
    throw new Error('stampMdx: caption tokens ("to <Month> <YYYY>. Source:" / "retrieved <date>") not found');
  }

  return mdx
    .replace(
      statRe,
      `{/*data:impr*/}around ${display} impressions settled per day as of ${endLabel}{/*data:end*/}`,
    )
    .replace(fig, fig.replace(rangeRe, `to ${endLabel}. Source:`).replace(retrievedRe, `retrieved ${retrieved}`));
}
```

Append to `scripts/data.d.mts`:

```ts
export function stampMdx(
  mdx: string,
  opts: { display: string; monthYear: string; retrieved: string },
): string;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: PASS (19 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/data.mjs scripts/data.d.mts tests/unit/data.test.ts
git commit -m "Alkimi data pipeline: idempotent MDX stamping with loud failures"
```

---

### Task 4: API fetching with validation and rate-limit retry

**Files:**
- Modify: `scripts/data.mjs` (append; add zod import at top)
- Modify: `scripts/data.d.mts` (append)
- Test: `tests/unit/data.test.ts` (append)

**Interfaces:**
- Consumes: `windows`, `SERIES_START` (Task 1).
- Produces (used by Task 6):
  - `fetchSeries(today: string, fetchImpl?: typeof fetch, sleep?: (ms: number) => Promise<void>): Promise<{ date: string; imprCount: number }[]>` — full validated series, camelCase fields only, extra API fields dropped.
- Retry policy (pinned in spec): on 429, wait until `X-RateLimit-Reset` (clamped to [1s, 60s]), max 3 retries per window, then fail.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/data.test.ts` (add `fetchSeries` to the import):

```ts
type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  headers: { get: (name: string) => string | null };
};

const okResponse = (rows: unknown[]): MockResponse => ({
  ok: true,
  status: 200,
  json: async () => ({ status: 'Success', data: rows }),
  headers: { get: () => null },
});

const rateLimited: MockResponse = {
  ok: false,
  status: 429,
  json: async () => ({ code: 'ALK1010' }),
  headers: { get: (name) => (name === 'x-ratelimit-reset' ? String(Math.floor(Date.now() / 1000) + 2) : null) },
};

describe('fetchSeries', () => {
  it('walks 31-day windows and concatenates validated camelCase rows', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string) => {
      calls.push(url);
      const { startDate } = Object.fromEntries(new URL(url).searchParams);
      // Real API rows carry extra fields; only date + imprCount survive.
      return okResponse([
        { date: startDate, imprCount: 5, txnCount: 5, alkimiRevenueInUSD: '1.00', alkimiRevenueInTokens: 'null' },
      ]);
    }) as unknown as typeof fetch;

    const series = await fetchSeries('2024-02-15', fetchImpl);
    expect(calls).toEqual([
      'https://api.alkimi.org/api/v1/public/data?startDate=2024-01-01&endDate=2024-01-31',
      'https://api.alkimi.org/api/v1/public/data?startDate=2024-02-01&endDate=2024-02-15',
    ]);
    expect(series).toEqual([
      { date: '2024-01-01', imprCount: 5 },
      { date: '2024-02-01', imprCount: 5 },
    ]);
  });

  it('retries a 429 after sleeping, then succeeds', async () => {
    const naps: number[] = [];
    const responses = [rateLimited, okResponse([{ date: '2024-01-01', imprCount: 1 }])];
    const fetchImpl = (async () => responses.shift()) as unknown as typeof fetch;
    const series = await fetchSeries('2024-01-01', fetchImpl, async (ms) => void naps.push(ms));
    expect(series).toEqual([{ date: '2024-01-01', imprCount: 1 }]);
    expect(naps).toHaveLength(1);
    expect(naps[0]).toBeGreaterThanOrEqual(1000);
    expect(naps[0]).toBeLessThanOrEqual(60_000);
  });

  it('gives up after 3 retries on persistent 429', async () => {
    const fetchImpl = (async () => rateLimited) as unknown as typeof fetch;
    await expect(fetchSeries('2024-01-01', fetchImpl, async () => {})).rejects.toThrow(/429/);
  });

  it('throws on non-OK responses', async () => {
    const fetchImpl = (async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
      headers: { get: () => null },
    })) as unknown as typeof fetch;
    await expect(fetchSeries('2024-01-01', fetchImpl)).rejects.toThrow(/500/);
  });

  it('throws on schema drift', async () => {
    const fetchImpl = (async () => okResponse([{ date: '2024-01-01', impr_count: 5 }])) as unknown as typeof fetch;
    await expect(fetchSeries('2024-01-01', fetchImpl)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: FAIL — `fetchSeries` not exported.

- [ ] **Step 3: Write the implementation**

Add to the top of `scripts/data.mjs` (below the header comment):

```js
import { z } from 'zod';
```

Append to `scripts/data.mjs`:

```js
const API = 'https://api.alkimi.org/api/v1/public/data';

/* Live API shape (verified 2026-07-24): camelCase, unlike the snake_case in
   docs.alkimi.org. Unlisted fields (txnCount, alkimiRevenueInUSD, …) are
   tolerated and dropped by zod's default strip behavior. */
const ApiRow = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  imprCount: z.number().int().nonnegative(),
});
const ApiResponse = z.object({ status: z.literal('Success'), data: z.array(ApiRow) });

const defaultSleep = (napMs) => new Promise((resolve) => setTimeout(resolve, napMs));

async function fetchWindow(win, fetchImpl, sleep) {
  const url = `${API}?startDate=${win.start}&endDate=${win.end}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(url);
    if (res.status === 429 && attempt < 3) {
      const resetMs = Number(res.headers.get('x-ratelimit-reset')) * 1000 - Date.now();
      await sleep(Math.min(Math.max(resetMs, 1000), 60_000));
      continue;
    }
    if (!res.ok) throw new Error(`alkimi api: ${url} returned HTTP ${res.status}`);
    return ApiResponse.parse(await res.json()).data.map(({ date, imprCount }) => ({ date, imprCount }));
  }
}

export async function fetchSeries(today, fetchImpl = fetch, sleep = defaultSleep) {
  const series = [];
  for (const win of windows(SERIES_START, today)) {
    series.push(...(await fetchWindow(win, fetchImpl, sleep)));
  }
  return series;
}
```

Append to `scripts/data.d.mts`:

```ts
export function fetchSeries(
  today: string,
  fetchImpl?: typeof fetch,
  sleep?: (ms: number) => Promise<void>,
): Promise<{ date: string; imprCount: number }[]>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: PASS (24 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/data.mjs scripts/data.d.mts tests/unit/data.test.ts
git commit -m "Alkimi data pipeline: windowed fetch with zod validation and 429 backoff"
```

---

### Task 5: Strip MDX comments in llms text extraction

**Files:**
- Modify: `src/lib/llms.ts:22-37` (`mdxToMarkdown`)
- Test: `tests/unit/llms.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `mdxToMarkdown` (existing export, same signature) now also removes `{/* … */}` comments, so the Task 6 markers never leak into `llms-full.txt`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/llms.test.ts` (ensure `mdxToMarkdown` is in the existing import from `@/lib/llms`):

```ts
describe('mdxToMarkdown: MDX comments', () => {
  it('strips {/* */} comments, keeping surrounding prose intact', () => {
    expect(
      mdxToMarkdown('alongside — {/*data:impr*/}around 8.8 million impressions{/*data:end*/}. It is'),
    ).toBe('alongside — around 8.8 million impressions. It is');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/llms.test.ts`
Expected: FAIL — output still contains `{/*data:impr*/}`.

- [ ] **Step 3: Update the implementation**

In `src/lib/llms.ts`, update `mdxToMarkdown`'s doc comment and add the comment-strip as the first replace in the chain:

```ts
/** Rewrite the MDX document grammar (<Fig>, <Data>, <Note>, <Warning>,
    {/* comments *\/}) as plain Markdown. Captions survive; tags and
    comments do not. */
export function mdxToMarkdown(body: string): string {
  const attr = (attrs: string, name: string) =>
    attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '';
  return body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/<Fig\b([\s\S]*?)\/>/g, (_m, attrs: string) => {
      return `Figure ${attr(attrs, 'n')}: ${attr(attrs, 'caption')}`;
    })
    .replace(/<Data\b([\s\S]*?)>([\s\S]*?)<\/Data>/g, (_m, attrs: string, inner: string) => {
      return `Table ${attr(attrs, 'n')}: ${attr(attrs, 'caption')}\n\n${tableToMarkdown(inner)}`;
    })
    .replace(/<\/?(?:Note|Warning)>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/llms.test.ts`
Expected: PASS (all, including pre-existing tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/llms.ts tests/unit/llms.test.ts
git commit -m "llms: strip MDX comments from extracted case-study text"
```

---

### Task 6: Content changes, CLI wiring, first real run

**Files:**
- Modify: `content/work/alkimi-labs.mdx` (stat markers in Context; Fig. 2 in What shipped)
- Modify: `package.json` (add `data` script)
- Modify: `scripts/data.mjs` (append CLI block)
- Generated: `content/data/alkimi-metrics.json`, `public/figs/alkimi-throughput.svg`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: `npm run data`; the committed snapshot artifacts; JSON shape `{ retrieved: string, series: { date: string, imprCount: number }[], summary: { trailing7DayMeanImpressions: number, display: string } }`.

- [ ] **Step 1: Add the stat span to the Context section**

In `content/work/alkimi-labs.mdx`, the Context paragraph currently reads:

```
… follow the token unlock schedule; an explorer surfaces the ad exchange's auction activity alongside. It is a team product, and a live one: real balances move through it every day.
```

Replace that sentence boundary so it reads:

```
… follow the token unlock schedule; an explorer surfaces the ad exchange's auction activity alongside — {/*data:impr*/}around 8.8 million impressions settled per day as of July 2026{/*data:end*/}. It is a team product, and a live one: real balances move through it every day.
```

(The literal numbers are placeholders in form only — `npm run data` in Step 5 restamps them from the API; the markers are what matters.)

- [ ] **Step 2: Add Fig. 2 to the What shipped section**

In the same file, between the "What shipped" paragraph ending `…the token unlock visualization, and the dual-signature migration form.` and the paragraph starting `The test suite runs about 515 cases…`, insert (blank line before and after):

```
<Fig n="2" caption="Impressions settled per day across the exchange, weekly means, January 2024 to July 2026. Source: Alkimi community data API (docs.alkimi.org), retrieved 2026-07-24. Linework prints in the spot ink." src="/figs/alkimi-throughput.svg" alt="Line chart of impressions settled per day, rising from tens of thousands in early 2024 to millions by mid-2026" w="690" h="220" />
```

Constraint checks baked into that line: `docs.alkimi.org` is allowlisted; no `https://` URL; the caption carries both stampable tokens (`to July 2026. Source:` and `retrieved 2026-07-24`).

- [ ] **Step 3: Add the npm script**

In `package.json`, after the `"og"` line, add:

```json
"data": "node scripts/data.mjs",
```

- [ ] **Step 4: Append the CLI block**

Append to `scripts/data.mjs` (add `fs`/`path`/`fileURLToPath` imports at the top, next to the zod import):

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
```

```js
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const retrieved = new Date().toISOString().slice(0, 10);
  const series = await fetchSeries(retrieved);
  if (series.length === 0) throw new Error('alkimi api returned an empty series');
  const summary = summarize(series);
  const label = monthYear(series[series.length - 1].date);
  const svg = renderChartSvg(downsampleWeekly(series), { monthYear: label });
  const mdxPath = path.join(root, 'content', 'work', 'alkimi-labs.mdx');
  const stamped = stampMdx(fs.readFileSync(mdxPath, 'utf8'), { display: summary.display, monthYear: label, retrieved });
  // Everything computed and validated; only now touch the tree (all-or-nothing).
  fs.mkdirSync(path.join(root, 'content', 'data'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'content', 'data', 'alkimi-metrics.json'),
    JSON.stringify({ retrieved, series, summary }, null, 2) + '\n',
  );
  fs.writeFileSync(path.join(root, 'public', 'figs', 'alkimi-throughput.svg'), svg);
  fs.writeFileSync(mdxPath, stamped);
  console.log(
    `alkimi data: ${series.length} days through ${series[series.length - 1].date}; stat "${summary.display}"`,
  );
}
```

Note `label` derives from the last data date, not the retrieval date — if the API's latest day lags the calendar, the caption stays honest.

- [ ] **Step 5: Run the pipeline for real**

Run: `npm run data`
Expected: exits 0; logs roughly `alkimi data: ~930 days through <yesterday or today>; stat "8.8 million"` (the number will be whatever the API says today).

- [ ] **Step 6: Inspect the outputs**

```bash
git diff --stat content/work/alkimi-labs.mdx   # only stat/caption token changes, if any
node -e "const j=require('./content/data/alkimi-metrics.json'); console.log(j.retrieved, j.series.length, j.summary.display)"
ls -la public/figs/alkimi-throughput.svg        # expect < 5000 bytes
```

Open `public/figs/alkimi-throughput.svg` in a browser tab and confirm: blue polyline rising left to right, y labels 0/5M/10M, JAN/JUL ticks.

- [ ] **Step 7: Run the full unit suite**

Run: `npm test`
Expected: PASS — including content rules (allowlist, markers) against the now-stamped MDX.

- [ ] **Step 8: Commit**

```bash
git add scripts/data.mjs content/work/alkimi-labs.mdx package.json content/data/alkimi-metrics.json public/figs/alkimi-throughput.svg
git commit -m "Case study: live Alkimi throughput stat and Fig. 2 from committed snapshot"
```

---

### Task 7: End-to-end verification

**Files:** none created; verification only.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: og generation, `next build`, and page-weight stamping all succeed.

- [ ] **Step 2: Verify the built page and llms mirrors**

```bash
grep -c "figs/alkimi-throughput.svg" out/work/alkimi-labs/index.html   # ≥ 1
grep -o "million impressions settled per day as of [A-Z][a-z]* [0-9]*" out/work/alkimi-labs/index.html
grep -o "Figure 2: Impressions settled per day" out/llms-full.txt
grep -c "data:impr" out/llms-full.txt && echo "MARKER LEAKED" || echo "clean"
```

Expected: the figure and stat render in the HTML; Figure 2 caption appears in `llms-full.txt`; final check prints `clean`.

- [ ] **Step 3: Run e2e suites against the build**

Run: `npx playwright test tests/e2e/smoke.spec.ts tests/e2e/a11y.spec.ts`
Expected: PASS (the new `<img>` gets its alt from the Fig props; a11y should not regress). If the a11y run flags the figure, fix the alt/caption wording in `content/work/alkimi-labs.mdx` and re-run from Task 6 Step 5.

- [ ] **Step 4: Confirm page weight stayed sane**

```bash
grep -o 'data-page-weight="[0-9]*"' out/work/alkimi-labs/index.html
```

Expected: within a few KB of the pre-change value (the SVG is < 5 KB).

- [ ] **Step 5: Commit (only if fixes were needed)**

If Steps 1–4 required changes, commit them with scoped `git add` as in prior tasks. Otherwise nothing to commit — verification leaves no artifacts (`out/` is gitignored).
