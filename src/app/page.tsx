import Link from 'next/link';
import { loadCaseStudies } from '@/lib/content';

export default function Home() {
  const featured = loadCaseStudies().filter((s) => s.featured);
  return (
    <>
      <section className="masthead">
        <h1>Dani Calvo</h1>
        <p className="label">Platform engineering · Issue 01 · July 2026</p>
      </section>

      <section className="abstract" aria-label="Abstract">
        <span className="label">Abstract</span>
        <p>
          I build SaaS platforms end to end: spec-first, test-first, with AI as engineering
          leverage rather than a crutch. Three case studies follow. Each states its role scope
          precisely, backs its claims with artifacts, and ends with what I would do differently.
        </p>
        <p className="index-terms">
          <b>Index terms</b> · Stripe · dunning · web3 platforms · Next.js · test-driven
          development
        </p>
      </section>

      <section aria-label="Contents" data-testid="contents">
        <span className="label">Contents</span>
        <ol className="contents">
          {featured.map((s) => (
            <li key={s.slug}>
              <Link prefetch={false} href={`/work/${s.slug}/`}>{s.title}</Link>
              <span className="leader" aria-hidden />
              <span className="label">{s.period}</span>
            </li>
          ))}
        </ol>
        <p className="contents-appendix">
          <span className="label">Appendix</span>
          <Link prefetch={false} href="/process/">How I build: spec to tests to production</Link>
        </p>
      </section>
    </>
  );
}
