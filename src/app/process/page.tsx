import type { Metadata } from 'next';
import Link from 'next/link';
import { seoMeta } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How I build',
  description: 'Spec-driven development, TDD, and AI as engineering leverage.',
  ...seoMeta('/process/'),
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
        success is measured. This site is the worked example. Its product spec (SPEC.md), its
        design system (DESIGN.md), and its implementation spec (specs/site-v1.md) are real
        files in the repo, written before the code, and every quality gate in them maps to a
        named test that runs in CI. Where the build taught the spec something, the spec carries
        a dated amendment instead of a silent rewrite. The repo is public:{' '}
        <Link
          href="https://github.com/danielcalvolopez/portfolio"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/danielcalvolopez/portfolio
        </Link>
        .
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
        I work with multiple AI models inside that discipline: the spec constrains the model, the
        tests judge it, and subagent review passes critique the output against the design
        system before anything merges. The model types faster than I do. What ships is still
        my call.
      </p>

      <h2>A worked example</h2>
      <p>
        The clearest one is RetryFi&rsquo;s decline handling. The spec fixed the schedule before any
        code: soft declines earn four retries, at <code>+4h · +72h · +96h · +168h</code>; hard
        declines, a stolen or expired card, skip the ladder and go straight to the dunning emails;
        an unknown decline code is treated as soft. Two constraints sat next to it. The waits span
        days and the infrastructure keeps no process alive between them, so a retry has to survive a
        deploy; and the same failed invoice can arrive twice, once from the webhook and once from the
        reconcile scan, so a second charge is a money bug, not an edge case.
      </p>
      <p>
        The first thing I wrote was the test. A stolen card must schedule zero retries and land in
        the email sequence; the same invoice, delivered twice in one tick, must produce one charge,
        not two. I watched both fail before the classifier and the idempotency key existed. Only then
        did the implementation follow: one constants file for the schedule, a hard-decline set the
        classifier checks first, an Inngest <code>step.sleep</code> so the multi-day waits resume
        across deploys, and a retry key of <code>{'retry-{invoice}-{attempt}'}</code> that turns a
        double fire into a no-op.
      </p>
      <p>
        The production diff was small, a few functions, and it merged only after the tests it was
        written against passed and a subagent review pass had checked it against the spec. What the
        suite locks in is the boring kind of correctness: a card that can never succeed is never
        retried, an invoice is never charged twice, and a wait that spans days survives a redeploy.
      </p>
    </article>
  );
}
