import type { Metadata } from 'next';
import Link from 'next/link';
import { loadCaseStudies, loadSecondary } from '@/lib/content';
import { TodoText } from '@/components/mdx';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Case studies: RetryFi, Alkimi Labs, CrediLabs, and secondary work.',
  openGraph: { images: ['/og/work.png'] },
};

export default function WorkPage() {
  const studies = loadCaseStudies();
  const secondary = loadSecondary();
  return (
    <>
      <section className="masthead">
        <h1>Work</h1>
        <p className="label">Case studies &amp; secondary work</p>
      </section>

      <section aria-label="Case studies" data-testid="contents">
        <ol className="contents">
          {studies.map((s) => (
            <li key={s.slug}>
              <div className="contents-main">
                <Link prefetch={false} href={`/work/${s.slug}/`}>{s.title}</Link>
                <p className="contents-summary">{s.summary}</p>
              </div>
              <span className="label period">
                <TodoText text={s.period} />
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Secondary work">
        <h2>Secondary</h2>
        <ul className="secondary">
          {secondary.map((e) => (
            <li key={e.title}>
              <p>
                <b>{e.title}</b>{' '}
                <span className="label">
                  {e.role} · <TodoText text={e.period} />
                </span>
              </p>
              <p className="secondary-line">{e.line}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
