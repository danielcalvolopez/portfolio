import Link from 'next/link';

export function RunningHead() {
  return (
    <header className="running-head">
      <Link prefetch={false} className="label" href="/">
        D. Calvo · Portfolio
      </Link>
      <nav aria-label="Primary" className="label">
        <Link prefetch={false} href="/work/">Work</Link>
        <span aria-hidden> · </span>
        <Link prefetch={false} href="/process/">Process</Link>
        <span aria-hidden> · </span>
        <Link prefetch={false} href="/about/">About</Link>
      </nav>
    </header>
  );
}
