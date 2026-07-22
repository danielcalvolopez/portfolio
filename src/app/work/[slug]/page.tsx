import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { loadCaseStudies, loadCaseStudy } from '@/lib/content';
import { mdxComponents, TodoText } from '@/components/mdx';

export const dynamicParams = false;

export function generateStaticParams() {
  return loadCaseStudies().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = loadCaseStudy(slug);
  return {
    title: study.title,
    description: study.summary,
    openGraph: { images: [`/og/work-${slug}.png`] },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = loadCaseStudy(slug);
  return (
    <article>
      <header className="masthead">
        <h1>{study.title}</h1>
        <p className="label">
          <TodoText text={`Role: ${study.role} · ${study.period}`} />
        </p>
      </header>

      <section className="abstract" aria-label="Abstract">
        <span className="label">Abstract</span>
        <p>{study.abstract}</p>
        <p className="index-terms">
          <b>Index terms</b>: {study.indexTerms.join(', ')}
        </p>
      </section>

      <MDXRemote source={study.body} components={mdxComponents} />

      <p className="stack-strip label">
        <TodoText text={`Stack: ${study.stack.join(', ')}`} />
        <span aria-hidden> · </span>
        {study.links.map((l, i) => (
          <span key={l.url}>
            {i > 0 && ' · '}
            <a href={l.url}>{l.label}</a>
          </span>
        ))}
      </p>
    </article>
  );
}
