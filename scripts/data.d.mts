export const SERIES_START: string;
export function windows(start: string, end: string): { start: string; end: string }[];
export function downsampleWeekly(
  series: { date: string; imprCount: number }[],
): { date: string; mean: number }[];
export function summarize(series: { date: string; imprCount: number }[]): {
  trailing7DayMeanImpressions: number;
  display: string;
};
export function monthYear(dateStr: string): string;
export function renderChartSvg(
  weekly: { date: string; mean: number }[],
  opts: { monthYear: string },
): string;
export function stampMdx(
  mdx: string,
  opts: { display: string; monthYear: string; retrieved: string },
): string;
