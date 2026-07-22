import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How I build',
  description: 'Spec-driven development, TDD, and AI as engineering leverage.',
  openGraph: { images: ['/og/process.png'] },
};

export default function ProcessPage() {
  return (
    <article>
      <section className="masthead">
        <h1>How I build</h1>
        <p className="label">Spec first · tests second · implementation last</p>
      </section>

      <h2>Spec first</h2>
      <p>
        Every feature starts as a written spec: what exists, what is out of scope, and how
        success is measured. This site is the worked example. Its product spec, design system,
        and implementation spec are real documents in the repo, written and reviewed before any
        code, and every quality gate in them maps to a named test.{' '}
        <span className="todo">[TODO: Dani — public repo link]</span>
      </p>

      <h2>Tests before implementation</h2>
      <p>
        The test comes first and is watched failing before the code that satisfies it exists.
        On this site that means the content schema, the confidentiality rules, and even the
        copy register (no em-dashes, no exclamation marks) are enforced by the unit suite, and
        every route ships only after smoke, accessibility, and visual-regression checks pass.
        When the Lighthouse budget fails, the deploy fails.
      </p>

      <h2>AI as leverage</h2>
      <p>
        I work with Claude Code inside that discipline: the spec constrains the model, the
        tests judge it, and subagent review passes critique the output against the design
        system before anything merges. The model types faster than I do. What ships is still
        my call.
      </p>

      <h2>A worked example</h2>
      <p>
        <span className="todo">
          [TODO: Dani — RetryFi dunning schedule: spec excerpt, the failing test, the
          production diff, and the metric it moved]
        </span>
      </p>
    </article>
  );
}
