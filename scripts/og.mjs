// Build-time OG images: 1200x630 PNGs in the Offprint system.
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import matter from 'gray-matter';

const root = process.cwd();
const outDir = path.join(root, 'public', 'og');
fs.mkdirSync(outDir, { recursive: true });

const font = (p) => fs.readFileSync(path.join(root, 'node_modules', p));
const fonts = [
  { name: 'Charis SIL', data: font('@fontsource/charis-sil/files/charis-sil-latin-700-normal.woff'), weight: 700, style: 'normal' },
  { name: 'Archivo', data: font('@fontsource/archivo/files/archivo-latin-600-normal.woff'), weight: 600, style: 'normal' },
];

const studies = fs
  .readdirSync(path.join(root, 'content', 'work'))
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => matter(fs.readFileSync(path.join(root, 'content', 'work', f), 'utf8')).data);

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

const pages = [
  { name: 'home', title: 'Dani Calvo', sub: 'Frontend engineer at Alkimi · spec-first, test-first' },
  { name: 'work', title: 'Work', sub: 'Case studies, in order of prominence' },
  ...studies.map((s) => ({
    name: `work-${s.slug}`,
    title: s.title,
    sub: clip(s.summary.replace(/\[TODO:[^\]]*\]/g, '').trim(), 90),
  })),
  { name: 'process', title: 'How I build', sub: 'Spec first · tests second · implementation last' },
  { name: 'about', title: 'About', sub: 'Background · stack · contact' },
];

const el = (type, style, children) => ({ type, props: { style, children } });

for (const page of pages) {
  const tree = el(
    'div',
    {
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: '#F2F1EC',
      color: '#1B1915',
      padding: '64px 72px',
    },
    [
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el(
          'div',
          {
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '8px solid #1B1915',
            paddingBottom: '14px',
            fontFamily: 'Archivo',
            fontSize: '24px',
            letterSpacing: '2.5px',
          },
          [el('span', {}, 'D. CALVO · PORTFOLIO'), el('span', {}, 'CASE STUDIES')],
        ),
        el(
          'div',
          {
            fontFamily: 'Charis SIL',
            fontSize: page.title.length > 26 ? '64px' : '84px',
            fontWeight: 700,
            lineHeight: 1.08,
            marginTop: '56px',
            maxWidth: '1000px',
            letterSpacing: '-1px',
          },
          page.title,
        ),
      ]),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { width: '132px', height: '8px', backgroundColor: '#0057A8', marginBottom: '18px' }, undefined),
        el(
          'div',
          { fontFamily: 'Archivo', fontSize: '26px', letterSpacing: '2px', color: '#6A665B' },
          page.sub.toUpperCase(),
        ),
      ]),
    ],
  );

  const svg = await satori(tree, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  fs.writeFileSync(path.join(outDir, `${page.name}.png`), png);
  console.log(`og: ${page.name}.png`);
}
