import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from './site';
import { ogName } from './routes';
import type { CaseStudy } from './content';

/** Loosely-typed schema.org node: wide enough for tests, no `any`. */
export type JsonLd = {
  '@type': string;
  '@id'?: string;
  name?: string;
  url?: string;
  jobTitle?: string;
  email?: string;
  sameAs?: string[];
  worksFor?: { '@type': 'Organization'; name: string; url: string };
  author?: { '@id': string };
  [key: string]: unknown;
};

export function canonicalFor(route: string): string {
  return new URL(route, SITE_URL).toString();
}

const PERSON_ID = `${canonicalFor('/')}#person`;

/** Canonical + OpenGraph block for one route; spread into a page's metadata. */
export function seoMeta(route: string, type: 'website' | 'article' = 'website') {
  const canonical = canonicalFor(route);
  return {
    alternates: { canonical },
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME,
      images: [`/og/${ogName(route)}.png`],
    },
  } satisfies Metadata;
}

/** Site-wide graph, rendered once from the root layout: WebSite + Person. */
export function siteGraph(): { '@context': 'https://schema.org'; '@graph': JsonLd[] } {
  const person: JsonLd = {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Dani Calvo',
    alternateName: 'Daniel Calvo Lopez',
    jobTitle: 'Software engineer',
    url: canonicalFor('/'),
    email: 'mailto:acidistrict@gmail.com',
    worksFor: { '@type': 'Organization', name: 'Alkimi', url: 'https://alkimi.org' },
    sameAs: [
      'https://x.com/danicalvo89',
      'https://github.com/danielcalvolopez',
      'https://www.linkedin.com/in/daniel-calvo-lopez-97607187/',
    ],
  };
  const site: JsonLd = {
    '@type': 'WebSite',
    '@id': `${canonicalFor('/')}#website`,
    name: SITE_NAME,
    url: canonicalFor('/'),
    author: { '@id': PERSON_ID },
    inLanguage: 'en',
  };
  return { '@context': 'https://schema.org', '@graph': [site, person] };
}

export function caseStudyJsonLd(study: CaseStudy): JsonLd {
  const route = `/work/${study.slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: study.title,
    description: study.summary,
    abstract: study.abstract,
    keywords: study.indexTerms.join(', '),
    url: canonicalFor(route),
    image: new URL(`/og/${ogName(route)}.png`, SITE_URL).toString(),
    author: { '@id': PERSON_ID },
    inLanguage: 'en',
  };
}

/** Serialize for a <script type="application/ld+json"> body; `<` is escaped so
    the payload can never close the tag early. */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
