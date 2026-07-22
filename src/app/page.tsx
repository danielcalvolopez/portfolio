import Link from "next/link";
import { loadCaseStudies } from "@/lib/content";
import { TodoText } from "@/components/mdx";

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
          I build SaaS platforms end to end: spec-first, test-first, with AI as
          engineering leverage. Lately that means RetryFi, a payment-recovery
          service built alone from architecture to launch, and staking platforms
          where a wrong number in the UI costs someone real money.
        </p>
        <p className="index-terms">
          <b>Index terms</b>: Stripe Connect, dunning, web3 platforms, Next.js,
          test-driven development
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
