// Postbuild: strip the client runtime (SPEC: no client JS beyond what
// interaction strictly requires; nothing on this site requires any), then
// measure each page's weight (HTML + referenced local assets, raw bytes)
// and stamp it into the footer line placeholder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function stripRuntime(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<link[^>]+as="script"[^>]*>/g, '')
    .replace(/<link rel="preconnect" href="\/"[^>]*>/g, '');
}

/* The whole site's CSS is ~8 KB; a separate render-blocking fetch costs a
   full round trip on Fast 3G and blows the LCP < 1.0s gate. Inline it. */
export function inlineCss(html, outDir) {
  return html.replace(
    /<link rel="stylesheet"[^>]*href="(\/_next\/[^"]+\.css)"[^>]*>/g,
    (tag, href) => {
      const cleanHref = href.split('?')[0];
      const file = path.join(outDir, cleanHref);
      if (!fs.existsSync(file)) return tag;
      const cssDir = path.posix.dirname(cleanHref);
      // Relative url() refs resolved against the css file's directory; after
      // inlining they'd resolve against the page URL, so absolutize them.
      const css = fs
        .readFileSync(file, 'utf8')
        .replace(/url\((['"]?)(?!data:|https?:|\/)([^)'"]+)\1\)/g, (_m, _q, rel) => {
          return `url(${path.posix.normalize(`${cssDir}/${rel}`)})`;
        });
      return `<style>${css}</style>`;
    },
  );
}

export function stampHtml(html, kb) {
  const rounded = Math.round(kb);
  return html.replace(
    /<span data-page-weight="pending">[^<]*<\/span>/g,
    `<span data-page-weight="${rounded}">${rounded} KB</span>`,
  );
}

function localAssets(html, outDir) {
  const refs = new Set();
  // og images are fetched by scrapers, not by the page; they don't count.
  for (const m of html.matchAll(/(?:href|src)="(\/_next\/[^"]+|\/figs\/[^"]+)"/g)) {
    refs.add(m[1].split('?')[0]);
  }
  // fonts referenced from inlined CSS
  for (const m of html.matchAll(/url\((\/_next\/[^)]+\.woff2)\)/g)) {
    refs.add(m[1]);
  }
  // fonts referenced from CSS files
  for (const ref of [...refs]) {
    if (ref.endsWith('.css')) {
      const cssPath = path.join(outDir, ref);
      if (fs.existsSync(cssPath)) {
        const css = fs.readFileSync(cssPath, 'utf8');
        for (const m of css.matchAll(/url\((\/_next\/[^)]+\.woff2)\)/g)) {
          refs.add(m[1]);
        }
      }
    }
  }
  return [...refs];
}

export function stampAll(outDir) {
  const pages = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.html')) pages.push(p);
    }
  };
  walk(outDir);
  for (const page of pages) {
    const html = inlineCss(stripRuntime(fs.readFileSync(page, 'utf8')), outDir);
    let bytes = Buffer.byteLength(html);
    for (const ref of localAssets(html, outDir)) {
      const asset = path.join(outDir, ref);
      if (fs.existsSync(asset)) bytes += fs.statSync(asset).size;
    }
    fs.writeFileSync(page, stampHtml(html, bytes / 1024));
  }
  return pages.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const n = stampAll(path.join(process.cwd(), 'out'));
  console.log(`stamped page weight into ${n} pages`);
}
