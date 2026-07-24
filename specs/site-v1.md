# site-v1 — implementation spec

Parent documents: [SPEC.md](../SPEC.md) (product), [DESIGN.md](../DESIGN.md) (taste). This file adds the buildable detail: routes, schema, components, tests, budgets. Where this file and a parent conflict, the parent wins.

## 1. Stack decisions

- **Next.js App Router, `output: 'export'`**, TypeScript strict. Fully static; deployed to Vercel as static files.
- **Server Components only in v1.** Zero `"use client"` components; nothing on the site needs client interactivity. The only shipped JS is the framework runtime.
- **Styling: vanilla CSS.** One `tokens.css` (the six DESIGN.md variables + type scale), one `global.css` (element styles: prose, headings, rules), CSS Modules for the few components that need scoping. No Tailwind: the design is ~30 declarations of typesetting, and a utility framework would obscure the one thing this site must prove.
- **Content pipeline: hand-rolled.** `gray-matter` parses frontmatter, `zod` validates it, `next-mdx-remote/rsc` renders the body. No contentlayer/velite dependency; the loader is ~60 lines in `src/lib/content.ts` and is itself under unit test.
- **Fonts:** Charis SIL (400/700/400i) + Archivo (500/600), subset to latin, woff2, self-hosted via `next/font/local` with size-adjusted fallbacks (zero CLS). Amended 2026-07-22 from `swap`+preload to `display: optional`, no preload: measured, the swap repaint became the LCP (1.5s) and preload gated first paint behind ~97 KB of fonts. Slow first visits keep the metric-matched fallback by design; SPEC.md records the same trade.
- **Analytics: none** for v1.
- `SITE_URL` env drives sitemap/OG absolute URLs. `[TODO: Dani — final domain]`

## 2. Routes

| route | content | notes |
|---|---|---|
| `/` | journal cover: masthead, abstract (thesis), contents list (3 case studies + /process), footer line | one screen of positioning |
| `/work` | contents page: 3 case studies + secondary entries (DSP v1, post-campaign analysis, alkimi.org) | secondary entries render from data, no pages |
| `/work/retryfi` | case study, featured, order 1 | Role: Solo founder — full stack + infra + GTM |
| `/work/alkimi-labs` | case study, featured, order 2 | Role: Platform engineer, heavy ongoing collaboration |
| `/work/credilabs` | case study, order 3, past tense throughout | Role: Frontend owner within a cross-functional team |
| `/process` | spec-driven + TDD + AI workflow, one worked example; links to this repo's real `/specs/*.md` | the site demonstrating its own method |
| `/about` | background incl. music production, stack, looking-for; GitHub / X @danicalvo89 / LinkedIn / mailto | short |
| `/sitemap.xml`, `/robots.txt` | Next metadata routes (`src/app/sitemap.ts`, `robots.ts`) | driven by `publicRoutes()` |
| `/llms.txt`, `/llms-full.txt` | static text routes (`src/app/llms.txt/route.ts`, `llms-full.txt/route.ts`) | LLM-facing Markdown mirror, built from the same content loaders as the pages |
| 404 | styled in-system | "This page was not recovered." |

OG images: generated at build (`scripts/og.mjs`, satori + resvg) into `public/og/<route>.png`, 1200×630, Offprint-styled (paper, ink, spot rule). Referenced from each page's metadata.

## 3. Frontmatter schema (zod, `src/lib/content.ts`)

```ts
export const CaseStudy = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  role: z.string().min(1),          // exact scope wording per SPEC ownership rules
  period: z.string().min(1),        // "2026 — present", "2023–2024"
  stack: z.array(z.string()).min(1),
  summary: z.string().max(200),     // contents-list + meta description
  abstract: z.string().min(1),      // front-matter block, the signature element
  indexTerms: z.array(z.string()).min(3).max(6),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })),
  featured: z.boolean(),
  order: z.number().int().positive(),
});

export const SecondaryEntry = z.object({   // /work only, no page
  title: z.string(),
  role: z.string(),
  period: z.string(),
  line: z.string().max(160),        // single sentence, per SPEC
  url: z.url().optional(),          // added 2026-07-24: linkable titles
});
```

Body convention: `[TODO: Dani — …]` blocks where input is needed; MDX components `<Fig>`, `<Data>`, `<Warning>`, `<Note>` (below). Case studies end with a `<Warning>` ("What I'd do differently") — its presence is enforced by test.

## 4. Component inventory (9, complete)

| component | responsibility |
|---|---|
| `RunningHead` | journal running head: name + section left, page context right; doubles as nav |
| `FooterLine` | build hash · "Lighthouse 100 (CI-gated)" · page weight; Archivo caps |
| `FrontMatter` | Abstract + Index Terms + role/period/stack line (the spec-sheet data, set as journal front matter) |
| `ContentsList` | dot-leader contents rows (home + /work) |
| `Fig` | numbered figure: SVG child, spot-ink linework, caption |
| `Data` | numbered table: ruled, Archivo headers, `tnum` |
| `Warning` / `Note` | the document grammar; Warning is `--warn`, once per case study |
| `Prose` | MDX renderer mapping (h2/h3, p, a, lists) onto global styles |
| `TodoMark` | renders `[TODO: Dani — …]` visibly in spot ink so nothing placeholder ships silently |

Footer-line plumbing: build hash from `git rev-parse --short HEAD` at build; page weight stamped by `scripts/stamp.mjs` (postbuild: strips the client runtime, inlines the CSS, measures each exported HTML + its assets, replaces a placeholder attribute in `/out`). Lighthouse score is printed as a CI-gated claim: the deploy cannot happen with a score below 100 (§6), so the footer states the gate, not a guess.

> Amended 2026-07-24, inventory vs. reality: `FrontMatter` and `ContentsList` shipped as page-local sections rather than shared components (two call sites, no shared behavior worth the indirection). `Prose` is the `p` mapping inside `mdxComponents`; `TodoMark` is `TodoText`, and it also wraps frontmatter fields (periods, roles, stack). `Fig` takes a `src` into `/public/figs/*.svg`: inline SVG in MDX proved fragile because format-on-save reflows `<text>` content into markdown paragraphs, which render empty inside SVG.

## 5. Test plan — every gate traceable

Unit (Vitest, `tests/unit/`):

| # | gate (source) | test |
|---|---|---|
| U1 | frontmatter schema validation (SPEC) | every `content/work/*.mdx` parses and passes `CaseStudy`; slugs unique; exactly 3 case studies; 2–3 featured; orders are 1..n |
| U2 | route generation (SPEC) | `generateStaticParams` returns exactly the content slugs; every IA route present in the route manifest |
| U3 | sitemap correctness (SPEC) | sitemap lists exactly the public routes, absolute against `SITE_URL`, no 404s, no drafts |
| U4 | OG correctness (SPEC) | every route's og:image exists on disk, is 1200×630 PNG; og:title matches frontmatter |
| U5 | confidentiality (SPEC) | banned-terms scan of all content + built HTML: the agentic marketplace project is never mentioned; every external URL ⊆ allowlist {retryfi.com, credilabs.io, alkimi.org, labs.alkimi.org, docs.alkimi.org, github.com/…, x.com/danicalvo89, linkedin.com/…, mailto} |
| U6 | ownership accuracy (SPEC) | credilabs.mdx: role string equals the agreed frontend-owner wording; body contains no "designed the UI" claims outside retryfi.mdx; credilabs body is past-tense spot-checked (no "currently", "ongoing") |
| U7 | copy register (DESIGN) | body copy contains no em-dashes (outside `[TODO: Dani — …]` markers) and no exclamation marks; no banned register phrases |
| U8 | document grammar (DESIGN/SPEC) | every case study body contains exactly one `<Warning>`; every `<Fig>`/`<Data>` numbered sequentially per page |
| U9 | SEO layer (SPEC) | every route: one self-referencing canonical, per-page og url/type; JSON-LD parses in the export (WebSite + Person site-wide, TechArticle per case study); ld+json survives the runtime strip |
| U10 | LLM mirror (SPEC) | `/llms.txt` index and `/llms-full.txt` full text derive from the content loaders; MDX grammar rewritten as plain Markdown; exported artifacts match the builders byte-for-byte |

E2E (Playwright, `tests/e2e/`, against `next build` output served statically):

| # | gate (source) | test |
|---|---|---|
| E1 | smoke nav (SPEC) | visit every route: 200, exactly one h1, RunningHead + FooterLine present, zero console errors |
| E2 | a11y (SPEC) | axe on every route: zero violations at WCAG AA; visible focus ring on first tabbable element; landmarks present |
| E3 | visual regression (SPEC) | `toHaveScreenshot` for `/`, `/work/retryfi`, `/process` at 320 / 768 / 1440 |
| E4 | fonts self-hosted (SPEC) | network capture: zero requests to third-party origins on any page (fonts, analytics, anything) |
| E5 | reduced motion (SPEC/DESIGN) | with `prefers-reduced-motion: reduce`, no element has a running animation/transition; site fully usable |
| E6 | keyboard (SPEC) | tab order reaches all links on home; skip-to-content first |

> Amended 2026-07-24, plan vs. shipped suite: U5 ships as a URL allowlist plus internal-marker scan over content **and** the built HTML; the one project that must never be named cannot be tested for by name (the test itself would contain it), so that specific rule remains a review gate. U6 additionally pins the CrediLabs role wording and past tense. U1b (secondary entries) was added. E4 covers every route, not just home. E3 visual baselines are per-platform (`-win32` suffixes); CI runs everything except E3 until Linux baselines are generated.

> Amended 2026-07-24, SEO layer (U9/U10): every page now carries a self-referencing canonical, per-page OpenGraph url/type (`article` on case studies), and schema.org JSON-LD (`WebSite` + `Person` from the layout, `TechArticle` per case study, `src/lib/seo.ts`); `/llms.txt` and `/llms-full.txt` mirror the site as Markdown for AI crawlers (`src/lib/llms.ts`). One trap worth recording: `stripRuntime` must decide by the script's `type` attribute, not its text. The RSC flight payload serializes the JSON-LD element's props, so a content check keeps a `self.__next_f.push` chunk whose bootstrap was stripped; the resulting TypeError is invisible to the console-error smoke check (it surfaces as a page error) and was caught by the Lighthouse best-practices gate.

## 6. Lighthouse budgets (`lighthouserc.json`, CI-blocking before deploy)

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./out",
      "url": ["/", "/work/", "/work/retryfi/", "/work/alkimi-labs/", "/work/credilabs/", "/process/", "/about/"],
      "numberOfRuns": 3,
      "settings": {
        "throttlingMethod": "devtools",
        "throttling": { "requestLatencyMs": 562.5, "downloadThroughputKbps": 1474, "uploadThroughputKbps": 675, "cpuSlowdownMultiplier": 4 }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 1 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 1 }],
        "categories:seo": ["error", { "minScore": 1 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 1000 }],
        "total-byte-weight": ["error", { "maxNumericValue": 262144 }],
        "resource-summary:script:size": ["error", { "maxNumericValue": 122880 }],
        "resource-summary:font:size": ["error", { "maxNumericValue": 92160 }]
      }
    }
  }
}
```

Throttling is DevTools Fast 3G equivalent, so the LCP < 1000 ms assertion is SPEC's hard requirement, not a lab-flattered number. Byte budgets: ≤ 256 KB total, ≤ 120 KB script (Next runtime ceiling), ≤ 100 KB fonts (5 latin-subset files including the italic). A second desktop-preset run asserts the same category scores. Known risk, stated honestly: the script budget is the tightest one; if the Next runtime pushes past it, the fallback decision (strip-runtime postbuild vs. accept a higher budget) comes back to you rather than being made silently.

> **Resolved 2026-07-22.** Measured: the Next 16 runtime ships 643 KB of JS on a site with zero client components. SPEC's "no client JS beyond what interaction strictly requires" decides the fallback: `scripts/stamp.mjs` now strips all script tags at export. The site is authored in Next, served as pure HTML/CSS/fonts. Reverting is deleting `stripRuntime` from the stamp script.

> Amended 2026-07-24: throttling moved from `simulate` to `devtools` — lantern replayed the localhost trace where the webfont painted instantly and billed that repaint at Fast 3G, failing LCP for a paint that real throttling never performs. The desktop run lives in `lighthouserc-desktop.json` (desktop preset; same category scores and CLS zero; the 1.0 s LCP number is SPEC's Fast 3G requirement and stays on the mobile config). Both configs run in CI (`.github/workflows/ci.yml`), which is the "CI gates the deploy" claim made concrete.

## 7. Repo layout

```
content/work/*.mdx          three case studies
content/secondary.ts        SecondaryEntry[]
public/figs/*.svg           case-study diagrams (static SVG, spot ink)
src/app/                    routes (RSC only), sitemap.ts, robots.ts, llms(-full).txt routes, icon.svg (dc mark in the Offprint grammar)
src/components/             RunningHead, FooterLine, mdx.tsx (Fig, Data, Warning, Note, TodoText, p)
src/lib/                    content.ts (schemas + loaders), routes.ts, site.ts, seo.ts (canonical + JSON-LD), llms.ts
scripts/og.mjs              build-time OG images (satori + resvg)
scripts/stamp.mjs           postbuild: strip runtime, inline CSS, stamp weight
tests/unit/  tests/e2e/
specs/                      this file, the specimen
lighthouserc.json           mobile Fast 3G gate
lighthouserc-desktop.json   desktop gate
.github/workflows/ci.yml    all gates on push and PR
```

## 8. Build order (Phase 4, tests first per slice)

1. content schema + loader (U1) → 2. tokens + global type system + RunningHead/FooterLine (E1 partial) → 3. home (E3) → 4. case-study template + RetryFi (U8, E3) → 5. Alkimi Labs + CrediLabs (U5, U6) → 6. /work (U2) → 7. /process → 8. /about (E-suite full) → 9. OG/sitemap/stamp scripts (U3, U4) → 10. Lighthouse CI wiring (§6).

After each slice: run tests, screenshot, self-critique against DESIGN.md prohibitions + the second-order rule.
