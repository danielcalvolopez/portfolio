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
