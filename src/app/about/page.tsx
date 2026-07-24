import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Background, stack, and what I am looking for.',
  openGraph: { images: ['/og/about.png'] },
};

export default function AboutPage() {
  return (
    <article>
      <section className="masthead">
        <h1>About</h1>
        <p className="label">Background · contact</p>
      </section>

      <p>
        I&rsquo;m a front-end engineer at Alkimi. That&rsquo;s still the work I know best, and I
        care a lot about how a product feels to use: how fast it loads, how the small interactions
        land, whether it holds up under real traffic.
      </p>

      <p>
        What&rsquo;s changed over the last year is how much of the product I own. I&rsquo;m not just
        building screens anymore. I take things from a rough idea through to something shipped, and a
        lot of that now runs through AI.
      </p>

      <p>
        I work with coding agents every day. Most of the value is in how you drive them. I lean on
        spec-driven development, run subagents to review the plans and the code in parallel, and
        build up reusable skills so the agents stay consistent across a codebase. A lot of my job
        now is making that workflow good for the whole team, not just for me.
      </p>

      <p>
        I&rsquo;ve always liked that the web never sits still. The thing I find most interesting
        right now is what a single engineer can build once AI is part of the setup, and getting good
        at that is most of what I think about.
      </p>

      <h2>Correspondence</h2>
      <ul className="plain-list">
        <li>
          <a href="https://x.com/danicalvo89">x.com/danicalvo89</a>
        </li>
        <li>
          <a href="https://github.com/danielcalvolopez">github.com/danielcalvolopez</a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/daniel-calvo-lopez-97607187/">
            linkedin.com/in/daniel-calvo-lopez
          </a>
        </li>
        <li>
          <a href="mailto:acidistrict@gmail.com">acidistrict@gmail.com</a>
        </li>
      </ul>
    </article>
  );
}
