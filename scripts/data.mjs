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
