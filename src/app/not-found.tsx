import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="masthead">
      <h1>404</h1>
      <p>
        This page was not recovered. <Link prefetch={false} href="/">Back to the contents.</Link>
      </p>
    </section>
  );
}
