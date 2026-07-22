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
        <p className="label">Background · stack · contact</p>
      </section>

      <p>
        <span className="todo">
          [TODO: Dani — two short paragraphs: the platform engineering background, and the
          music production years and why they explain the taste and the systems thinking]
        </span>
      </p>

      <h2>Stack</h2>
      <p className="index-terms">
        TypeScript · React · Next.js · Node · Postgres · Supabase · Stripe ·{' '}
        <span className="todo">[TODO: Dani — confirm]</span>
      </p>

      <h2>Looking for</h2>
      <p>
        <span className="todo">[TODO: Dani — one honest paragraph]</span>
      </p>

      <h2>Correspondence</h2>
      <ul className="plain-list">
        <li>
          <a href="https://x.com/danicalvo89">x.com/danicalvo89</a>
        </li>
        <li>
          <span className="todo">[TODO: Dani — GitHub URL]</span>
        </li>
        <li>
          <span className="todo">[TODO: Dani — LinkedIn URL]</span>
        </li>
        <li>
          <a href="mailto:acidistrict@gmail.com">acidistrict@gmail.com</a>{' '}
          <span className="todo">[TODO: Dani — confirm public email]</span>
        </li>
      </ul>
    </article>
  );
}
