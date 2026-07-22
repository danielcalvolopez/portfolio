import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './tokens.css';
import './global.css';
import { RunningHead } from '@/components/RunningHead';
import { FooterLine } from '@/components/FooterLine';

const charis = localFont({
  src: [
    { path: '../fonts/charis-sil-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/charis-sil-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/charis-sil-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-charis',
  display: 'swap',
});

const archivo = localFont({
  src: [
    { path: '../fonts/archivo-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/archivo-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Dani Calvo · platform engineering',
    template: '%s · Dani Calvo',
  },
  description:
    'I build SaaS platforms end to end: spec-first, test-first, with AI as engineering leverage.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${charis.variable} ${archivo.variable}`}>
      <body>
        <a className="skip label" href="#content">
          Skip to content
        </a>
        <div className="shell">
          <RunningHead />
          <main id="content">{children}</main>
          <FooterLine />
        </div>
      </body>
    </html>
  );
}
