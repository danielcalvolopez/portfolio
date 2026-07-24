# Alkimi live data in the case study — design

Date: 2026-07-24
Status: approved pending user review
Scope: one refreshable data snapshot feeding a stat line and a Fig. 2 chart in `content/work/alkimi-labs.mdx`.

## Goal

Ground the Alkimi Labs case study's "real balances move through it every day" claim in
verifiable public data: a growth chart of impressions settled per day and one sourced
stat in the prose, both derived from Alkimi's public Community Data API and refreshed
by a single script. The site remains a zero-JS static export; "live" means "as of a
stated retrieval date," which the figure caption declares the way a journal dates its
figures.

## Verified facts (probed 2026-07-24)

- Endpoint: `GET https://api.alkimi.org/api/v1/public/data?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`.
  No auth. Max 31-day range per request. Rate limited (`X-RateLimit-Remaining`,
  `X-RateLimit-Reset`, `X-Daily-Quota-Remaining` response headers; 429 + code `ALK1010`
  when exceeded).
- Live response fields are camelCase — `txnCount`, `imprCount`, `alkimiRevenueInUSD`,
  `alkimiRevenueInTokens` — although docs.alkimi.org shows snake_case. Code targets the
  live shape.
- Series starts in January 2024 (2024-01-01 ≈ 66K impressions/day; mid-2023 queries
  return an empty array). July 2026 ≈ 8.8M impressions/day. ~130× growth over the
  full series.
- `alkimiRevenueInUSD` is a string; `alkimiRevenueInTokens` can be the literal string
  `"null"`. Neither is rendered (impressions only), but the zod schema must tolerate
  them.

## Decisions (settled during brainstorming)

1. **Scope:** chart + stat line. No table, no revenue figures, no Sui RPC staking data
   (possible later iteration, out of scope here).
2. **Freshness:** committed snapshot. `npm run data` fetches and regenerates artifacts;
   the results are committed. `next build` never touches the network. The script is not
   part of the `build` chain.
3. **Chart:** impressions settled per day, full history (2024-01 → retrieval date),
   weekly means, linear y-axis.
4. **Mechanism:** generated standalone SVG + source-level stamping of the MDX via
   explicit markers (Approach 1) — follows the existing `og.mjs`/`stamp.mjs` house
   patterns; no new render components; prose stays literal text so `llms.txt`
   extraction and content-rules tests keep working.

## Architecture

One new script, `scripts/data.mjs`, run via a new package script `"data": "node
scripts/data.mjs"`. Like `stamp.mjs`, it exports pure functions for everything
testable and keeps I/O at the edges:

```
fetchSeries()        31-day windows, sequential, from SERIES_START = '2024-01-01'
                     to today; zod-validates rows; capped backoff on 429
downsampleWeekly()   daily → weekly means; trailing partial week dropped
summarize()          trailing-7-day mean + display formatting ("8.8 million")
renderChartSvg()     weekly series + retrieved date → SVG string
stampMdx()           stat text + caption date into alkimi-labs.mdx, idempotent
```

Outputs (all committed):

- `content/data/alkimi-metrics.json` — `{ retrieved: "YYYY-MM-DD", series: [{ date,
  imprCount }], summary: { trailing7DayMeanImpressions, display } }`. Impressions only;
  other API fields are dropped (rerun the script if a future iteration needs them).
- `public/figs/alkimi-throughput.svg` — the Fig. 2 chart.
- `content/work/alkimi-labs.mdx` — stat text and caption date updated in place.

## Chart spec

Matches the conventions of `public/figs/alkimi-claim.svg`:

- 690-wide viewBox (height ~220), `role="img"` + `aria-label`.
- Data line: single polyline, spot ink `#0057A8`, `stroke-width="1.5"`, no fill.
- Axes/gridlines: hairlines in secondary ink `#6A665B`.
- Labels: Archivo uppercase, small sizes, letter-spacing, like existing figures.
  SVG-in-`<img>` cannot load document fonts, so text falls back to system
  sans-serif — already true of every existing figure; consistent.
- ~130 weekly points; total file size target under ~5 KB (counts toward the stamped
  page weight).
- Y-axis ticks in compact form ("5M", "10M"); x-axis ticks at year/quarter boundaries.

## Content changes

- **Stat line (Context section):** the sentence about the explorer gains the stat,
  e.g. "an explorer surfaces the ad exchange's auction activity alongside — around
  8.8 million impressions settled per day as of July 2026." The refreshable span is
  delimited by `{/*data:impr*/}` … `{/*data:end*/}` markers.
- **Fig. 2 (What shipped section):** placed here as evidence the platform is live,
  and to avoid renumbering the existing Fig. 1. Caption pattern: "Impressions settled
  per day, weekly means, January 2024 to July 2026. Source: Alkimi community data API
  (docs.alkimi.org), retrieved 2026-07-24." The script updates the
  `retrieved YYYY-MM-DD` token and the date-range text inside the caption.
- **Allowlist note:** `docs.alkimi.org` is already in the content-rules allowlist;
  "api.alkimi.org" appears only as schemeless text, which the URL check ignores. No
  allowlist change needed.

## MDX stamping rules

- Idempotent: running the script twice with the same data produces byte-identical
  output.
- Fail-loud: if a marker or the caption date token is missing, exit nonzero without
  writing anything.
- Supporting change: `mdxToMarkdown` in `src/lib/llms.ts` learns to strip MDX
  comments (`{/* ... */}`) so markers never leak into `llms-full.txt`. Covered by a
  unit test.

## Error handling

All-or-nothing: fetch and validate the complete series first; only then write the
three outputs. Any failure — network error, 429 after capped retries, schema
mismatch, missing marker — exits nonzero and leaves the working tree untouched. A
failed refresh means the site keeps shipping the previous committed snapshot; the
build never depends on the API.

## Testing

Vitest units against the exported pure functions (no network):

- 31-day windowing: correct boundaries across month lengths and the final partial
  window.
- `downsampleWeekly`: means computed correctly; trailing partial week dropped.
- `renderChartSvg`: expected point count, `aria-label` present, spot-ink stroke,
  compact tick labels.
- `stampMdx`: replaces stat and caption date; idempotent; missing marker throws.
- `fetchSeries`: one test with mocked `fetch` covering pagination and a 429 retry.
- `mdxToMarkdown`: strips MDX comments.

Existing suites must stay green: content-rules (allowlist, internal markers), llms,
seo, Playwright smoke + a11y (the new figure gets `alt` from its caption via the
existing `Fig` component), Lighthouse budgets.

## Out of scope

- Sui RPC staking data (TVL / total staked).
- Any table of recent daily figures.
- CI cron auto-refresh.
- Revenue or transaction-count rendering (transactions currently mirror impressions
  1:1 in the API anyway).
