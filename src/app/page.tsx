import type { Metadata } from "next";
import Link from "next/link";
import { loadCaseStudies } from "@/lib/content";
import { TodoText } from "@/components/mdx";
import { seoMeta } from "@/lib/seo";

export const metadata: Metadata = { ...seoMeta("/") };

export default function Home() {
  const featured = loadCaseStudies().filter((s) => s.featured);
  return (
    <>
      <section className="masthead">
        <h1>Dani Calvo</h1>
        <p className="label">Software engineer</p>
      </section>

      <section className="abstract" aria-label="Abstract">
        <span className="label">Abstract</span>
        <p>
          I build platforms end to end: spec-first, test-first, with AI as
          engineering leverage. I&rsquo;m a front-end engineer at{" "}
          <Link
            href="https://alkimi.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Alkimi
          </Link>
          , where we&rsquo;re pioneering a new way to run programmatic
          advertising and building the industry standards to carry it. On my own
          time I shipped RetryFi, a payment-recovery SaaS, alone from
          architecture to launch.
        </p>
        <p className="index-terms">
          <b>Index terms</b>: agentic engineering, web3 platforms, SaaS,
          Next.js, test-driven development
        </p>
      </section>

      <section aria-label="Contents" data-testid="contents">
        <span className="label">Contents</span>
        <ol className="contents">
          {featured.map((s) => (
            <li key={s.slug}>
              <Link prefetch={false} href={`/work/${s.slug}/`}>
                {s.title}
              </Link>
              <span className="label period">
                <TodoText text={s.period} />
              </span>
            </li>
          ))}
        </ol>
        <p className="contents-appendix">
          <span className="label">Appendix</span>
          <Link prefetch={false} href="/process/">
            How I build: spec to tests to production
          </Link>
        </p>
      </section>
    </>
  );
}
