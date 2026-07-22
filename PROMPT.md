# Kickoff prompt for Claude Code (Fable 5)

Paste this as the first message in a fresh Claude Code session, in a repo containing SPEC.md and DESIGN.md at the root. Install the official plugin first:

```
/plugin install frontend-design@anthropics/claude-code
```

---

Read SPEC.md and DESIGN.md fully before doing anything. They are authoritative; where they conflict with your defaults, they win. We work spec-first: no implementation code until the phase that calls for it.

**Phase 1 — Divergence (no code).**
Produce 5 mutually exclusive aesthetic directions for this portfolio. For each: a name, 2 real-world references (at least one from outside web design), a display+body type pairing with reasoning, a 5-token palette with hex values, an ASCII wireframe of the home page, and one signature element. Constraint: no two directions may be confusable with each other, and none may match the medians banned in DESIGN.md. Then add a final section: "Predictable choices audit" — list every choice across the 5 directions that you estimate other AI models would also make for this brief, and replace each. Stop and wait for my selection.

**Phase 2 — Direction lock (no code).**
Take my chosen direction (possibly spliced from two), and rewrite the "Direction" section of DESIGN.md with the final decision: named aesthetic, exact typefaces, final tokens, signature element, and 3 sentences on why this fits a platform engineer's portfolio specifically. Render an HTML type-specimen page (headings, body, captions, a fake case-study excerpt) so I can judge the typography with real content before anything else exists. Stop and wait for approval.

**Phase 3 — Spec artifacts.**
Write `/specs/site-v1.md`: routes, MDX frontmatter schema (typed), component inventory (keep it small), test plan mapping every SPEC.md quality gate to a concrete Vitest/Playwright test, and Lighthouse budget config. Stop for review.

**Phase 4 — Build, test-first.**
Implement in this order, tests before implementation for each slice: content schema + MDX pipeline → layout shell + typography system from tokens → home → case study template with RetryFi → remaining case studies (Alkimi Labs, then CrediLabs — SPEC.md is the source of truth for scope, ownership language, and confidentiality rules; use placeholder copy blocks marked TODO where my input is needed) → /work index → /process → /about. After each slice: run tests, then screenshot the result and self-critique it against DESIGN.md — explicitly check the prohibitions list and the second-order rule — before moving on.

**Phase 5 — Review pass.**
Run a subagent as a design director who despises AI-generated websites and can identify one in two seconds. It must name specific elements that read as generated, templated, or median, referencing DESIGN.md. Fix everything it finds that's legitimate, push back with reasoning where it's wrong. Then run the full quality gates: Lighthouse budgets, axe, visual checks at 320/768/1440.

Throughout: when DESIGN.md leaves something open, propose 2–3 options with your recommendation instead of silently picking your default. Never fill copy with placeholder marketing register — use `[TODO: Dani]` blocks instead.

---

## Follow-up prompts worth keeping

**When something looks slop-adjacent:**
> List every choice in this page that you'd predict other AI models would also make for this prompt. Replace each one with a decision derived from DESIGN.md, and tell me what changed.

**Critique persona (re-run any time):**
> You are a design director reviewing this portfolio. You despise AI-generated websites and spot them instantly. Screenshot the page, then tear it apart: name the exact elements, spacing decisions, and copy that read as generated. Be specific and merciless.

**Typography deep pass:**
> Ignore everything except type. Audit scale, measure, leading, rag, widows, caption treatment against the best-set engineering documents you know. Propose fixes as a diff to the tokens, not ad-hoc overrides.
