// Refreshable Alkimi throughput snapshot (spec:
// docs/superpowers/specs/2026-07-24-alkimi-live-data-design.md). Run via
// `npm run data`; deliberately NOT part of `npm run build` — the site ships
// the committed snapshot and never depends on the API being up.
import { z } from 'zod';

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
