export const SERIES_START: string;
export function windows(start: string, end: string): { start: string; end: string }[];
export function downsampleWeekly(
  series: { date: string; imprCount: number }[],
): { date: string; mean: number }[];
export function summarize(series: { date: string; imprCount: number }[]): {
  trailing7DayMeanImpressions: number;
  display: string;
};
