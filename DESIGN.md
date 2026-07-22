# DESIGN.md — Portfolio for Dani Calvo

This file encodes taste decisions. Follow it exactly. Where it leaves an axis free, do NOT fill the gap with your statistical default — propose options and wait.

## Direction (to be locked after the divergence exercise)

Working thesis: **"engineering datasheet × warm editorial"** — the precision and density of a well-set technical document, with the warmth and readability of a good engineering blog. Confident, quiet, information-dense. A site that a platform engineer would design for themselves.

> NOTE TO CLAUDE: before any code, run the divergence exercise in PROMPT.md step 1. This thesis is a starting hypothesis, not the final direction. The final direction gets written back into this file, replacing this note.

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
- Display face: characterful, used with restraint (headings, the signature element). Candidate territory: a good grotesque with real personality or a text serif with sharp details. Propose 3 concrete pairings with specimens rendered as HTML before choosing. Self-hosted, subset.
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
