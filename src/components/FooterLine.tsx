export function FooterLine() {
  const hash = process.env.NEXT_PUBLIC_BUILD_HASH ?? 'dev';
  return (
    <footer className="footer-line">
      <span className="label">
        {hash} · Lighthouse 100, CI gated · <span data-page-weight="pending">·· KB</span>
      </span>
      <span className="label">Set in Charis SIL &amp; Archivo</span>
    </footer>
  );
}
