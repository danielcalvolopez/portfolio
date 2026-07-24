import type { Metadata } from 'next';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { loadCaseStudies, loadCaseStudy } from '@/lib/content';
import { mdxComponents, TodoText } from '@/components/mdx';
import { seoMeta, caseStudyJsonLd, jsonLdScript } from '@/lib/seo';

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
    keywords: study.indexTerms,
    ...seoMeta(`/work/${slug}/`, 'article'),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(caseStudyJsonLd(study)) }}
      />
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
            <Link href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label}
            </Link>
          </span>
        ))}
      </p>
    </article>
  );
}
