import { describe, it, expect } from 'vitest';
import { SERIES_START, windows, downsampleWeekly, summarize, monthYear, renderChartSvg, stampMdx, fetchSeries } from '../../scripts/data.mjs';

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
