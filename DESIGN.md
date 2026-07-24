# DESIGN.md — Portfolio for Dani Calvo

This file encodes taste decisions. Follow it exactly. Where it leaves an axis free, do NOT fill the gap with your statistical default — propose options and wait.

## Direction (locked 2026-07-22)

**Aesthetic: "Offprint"** — the site as a reprint from a 1970s corporate engineering journal (Hewlett-Packard Journal / Bell System Technical Journal lineage). Dense, warm, typeset rather than designed. One device spliced in from flight-operations documentation (see WARNING below).

**Typefaces (exactly two, deliberately no utility mono):**

- **Charis SIL** (OFL; the SIL-maintained descendant of Bitstream Charter, the 1987 laser-printer face of technical memos) carries everything: body at 17px, and headings set bold and tight in the text face, as period journals did. Self-hosted, subset.
- **Archivo** (OFL) appears only as small uppercase labels: running heads, index terms, figure/table labels, table headers, the footer line. Never at display sizes.
- No mono anywhere, including the build-hash footer. A monospace "dev accent" is the median move on engineer portfolios; the journal register is stronger without it. Inline code and identifiers in prose render in small Archivo, never the browser's Courier fallback.

**Tokens (6, defined once as CSS variables):**

```
--paper: #F2F1EC  /* press-paper gray-white, calibrated away from cream */
--ink:   #1B1915  /* warm black */
--ink-2: #6A665B  /* secondary ink: captions, metadata, NOTE blocks */
--spot:  #0057A8  /* spot ink: links AND all figure/diagram linework */
--rule:  #D6D2C6  /* rules, borders */
--warn:  #B01E1E  /* semantic only: the WARNING device, nowhere else */
```

`--spot` is the ONE accent, used like the second ink in two-color offset printing: every SVG diagram stroke, every link, one system. `--warn` is not an accent; it appears exactly once per case study.

**Signature element: journal front matter.** Every case study opens with an **Abstract + Index Terms** block, and the home page is set as a journal cover/contents page (masthead, abstract, contents list with dot leaders). Figure and table numbering (Fig. 1, Table 2) follows from the genre and is used consistently.

**Spliced device (from the Quick Reference direction):** every "What I'd do differently" section is set as a **WARNING block**: Archivo caps label, `--warn` top rule, body text in normal ink. The only red on the site marks the honest paragraph. NOTE blocks (context asides) share the same grammar in `--ink-2`. There is no CAUTION tier.

**Why this fits a platform engineer's portfolio:** the journal reprint is the genre engineers historically used to document systems they had actually built and shipped, so a case study inherits the credibility of the form instead of arguing for it. Its abstract-first, figure-numbered structure rewards exactly the 30-second scan SPEC.md names as the success criterion. And the craft lives entirely in typesetting discipline (measure, leading, running heads, numbered figures), which is the hardest quality for a template or a model to fake and the easiest for a discerning reader to feel.

## Hard prohibitions (first-order slop tells)

- No purple/indigo/blue gradients. No gradients as decoration at all.
- No glassmorphism, no frosted cards, no glow effects, no `shadow-*` decorative shadows.
- No Inter, Roboto, Arial, system-ui as display or body. Also banned: Space Grotesk, Sora, Plus Jakarta Sans, DM Sans, Manrope (the "anti-Inter defaults").
- No emoji anywhere. No icon grids of features. No three-cards-in-a-row with uniform radius.
- No "Crafting digital experiences" / "Turning ideas into reality" register anywhere in copy. No exclamation marks. No em-dashes in body copy (author's rule).
- No dark-near-black + single acid-green/vermilion accent theme; no warm-cream + serif + terracotta (#D97757-ish) theme; no broadsheet hairline-rules pastiche. These are current AI design medians.
- No scroll-jacking, no parallax, no cursor followers, no page transition theatrics.

## Second-order rule

After producing any design plan or page, ask: "which of these choices would another AI model also make for this exact brief?" Replace each one with a decision derived from this brief specifically. State what you replaced.

## Typography

- Exactly two typefaces + optional utility mono for data/captions.
- LOCKED (see Direction): no separate display face. Headings are set in the text face (Charis SIL bold, tight); Archivo appears only as small uppercase labels. Self-hosted, subset.
- Body: highly readable at 16–18px, comfortable measure (60–75ch), generous leading. Type scale defined as CSS variables, ~1.2–1.25 ratio, few steps.
- Type does the visual heavy lifting. If the site is memorable, it should be memorable for the typesetting and density, not effects.

## Color

- 4–6 named tokens as CSS variables, defined once. One background, one ink, one secondary ink, ONE accent, one rule/border tone.
- Accent appears rarely: links, active states, one signature use. If the accent shows up more than ~5 times on a screen, it's decoration — cut it.
- Light mode first. Dark mode only if it can be equally considered; otherwise skip it for v1.

## Layout

- Strong grid, visible discipline. Content-first: the case studies are text documents with figures, set beautifully — closer to a well-designed paper than a landing page.
- Density is a feature. Don't inflate whitespace to look "premium". Every structural device (labels, rules, numbering) must encode real information — numbers only where order genuinely matters.
- Max-width tuned per content type (prose narrower, figures/diagrams can break out).

## Motion

- Default: nothing moves. Budget: ONE deliberate moment of craft in the whole site (e.g., a considered hover treatment on case study links, or one tasteful reveal on the home thesis). Everything else static.
- `prefers-reduced-motion` fully respected; the site must be complete with zero motion.

## Signature element

One memorable device, to be chosen during direction lock. Candidate ideas (pick one, or propose better):
- A "spec sheet" header block on each case study: role / period / stack / status set like a technical datasheet.
- Figure numbering + captions treated like an engineering document (Fig. 1, Table 2), consistently.

Note: the self-auditing footer line (build hash, page weight in KB, Lighthouse score) is a SPEC hard requirement and exists on every page regardless of direction — it is baseline infrastructure, not a candidate here. The signature element is chosen on top of it. One exception: if direction lock concludes the footer is the most characterful device on the site, it may be elevated into the signature element itself, so the site has one device, not two.

Spend boldness there and nowhere else.

## Copy rules

- First person, plain verbs, sentence case. Specific beats clever, always.
- Every claim backed by an artifact: a number, a screenshot, a linked spec, a repo. If a sentence can't be backed, cut it or soften it to honest.
- "What I'd do differently" sections are written candidly. No hedging into vagueness.

## Quality floor (invisible, non-negotiable)

Responsive to 320px. Visible keyboard focus. Semantic landmarks. AA contrast. Zero CLS. Print stylesheet for case studies (nice-to-have that fits the datasheet direction).
