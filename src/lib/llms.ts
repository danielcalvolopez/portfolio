// LLM-facing plain-text mirrors of the site (https://llmstxt.org/): an index
// at /llms.txt and the full case-study text at /llms-full.txt. Both derive
// from the same loaders the pages render from, so they cannot drift.
import { loadCaseStudies } from './content';
import { canonicalFor } from './seo';

function tableToMarkdown(inner: string): string {
  const rows = [...inner.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((row) =>
    [...row[1].matchAll(/<t[hd]>([\s\S]*?)<\/t[hd]>/g)].map((cell) =>
      cell[1].trim().replace(/\s+/g, ' '),
    ),
  );
  if (rows.length === 0) return '';
  const [head, ...body] = rows;
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...body.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

/** Rewrite the MDX document grammar (<Fig>, <Data>, <Note>, <Warning>) as
    plain Markdown. Captions survive; tags do not. */
export function mdxToMarkdown(body: string): string {
  const attr = (attrs: string, name: string) =>
    attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '';
  return body
    .replace(/<Fig\b([\s\S]*?)\/>/g, (_m, attrs: string) => {
      return `Figure ${attr(attrs, 'n')}: ${attr(attrs, 'caption')}`;
    })
    .replace(/<Data\b([\s\S]*?)>([\s\S]*?)<\/Data>/g, (_m, attrs: string, inner: string) => {
      return `Table ${attr(attrs, 'n')}: ${attr(attrs, 'caption')}\n\n${tableToMarkdown(inner)}`;
    })
    .replace(/<\/?(?:Note|Warning)>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildLlmsTxt(): string {
  const studies = loadCaseStudies();
  return [
    '# Dani Calvo',
    '',
    '> Software engineer. Front-end engineer at Alkimi, pioneering a new way to run programmatic advertising. Builds platforms end to end: spec-first, test-first, with AI as engineering leverage.',
    '',
    'Personal portfolio of Dani Calvo (Daniel Calvo Lopez). Every page is static HTML; the case studies are written from the actual codebases they describe.',
    '',
    '## Case studies',
    '',
    ...studies.map((s) => `- [${s.title}](${canonicalFor(`/work/${s.slug}/`)}): ${s.summary}`),
    '',
    '## Pages',
    '',
    `- [Work index](${canonicalFor('/work/')}): all case studies plus secondary work`,
    `- [How I build](${canonicalFor('/process/')}): spec-driven development, tests before implementation, AI as engineering leverage`,
    `- [About](${canonicalFor('/about/')}): background and contact`,
    '',
    '## Contact',
    '',
    '- GitHub: https://github.com/danielcalvolopez',
    '- X: https://x.com/danicalvo89',
    '- LinkedIn: https://www.linkedin.com/in/daniel-calvo-lopez-97607187/',
    '- Email: acidistrict@gmail.com',
    '',
    '## Full content',
    '',
    `- [llms-full.txt](${canonicalFor('/llms-full.txt')}): the complete text of every case study in Markdown`,
    '',
  ].join('\n');
}

export function buildLlmsFullTxt(): string {
  const studies = loadCaseStudies();
  const sections = studies.map((s) =>
    [
      `# ${s.title}`,
      '',
      `Role: ${s.role}`,
      `Period: ${s.period}`,
      `Stack: ${s.stack.join(', ')}`,
      `Links: ${s.links.map((l) => `${l.label} <${l.url}>`).join(', ')}`,
      `Canonical: ${canonicalFor(`/work/${s.slug}/`)}`,
      '',
      '## Abstract',
      '',
      s.abstract,
      '',
      `Index terms: ${s.indexTerms.join(', ')}`,
      '',
      mdxToMarkdown(s.body),
    ].join('\n'),
  );
  return [
    '# Dani Calvo: case studies, full text',
    '',
    `The complete case studies from ${canonicalFor('/')}, one document per project. The index lives at ${canonicalFor('/llms.txt')}.`,
    '',
    sections.join('\n\n---\n\n'),
    '',
  ].join('\n');
}
