import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

const WORK_DIR = path.join(process.cwd(), 'content', 'work');

export const CaseStudySchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  role: z.string().min(1),
  period: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1).max(200),
  abstract: z.string().min(1),
  indexTerms: z.array(z.string().min(1)).min(3).max(6),
  links: z.array(z.object({ label: z.string().min(1), url: z.url() })).min(1),
  featured: z.boolean(),
  order: z.number().int().positive(),
});

export type CaseStudy = z.infer<typeof CaseStudySchema> & { body: string };

export function loadCaseStudy(slug: string): CaseStudy {
  const file = path.join(WORK_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) {
    throw new Error(`No case study for slug "${slug}"`);
  }
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  const frontmatter = CaseStudySchema.parse(data);
  if (frontmatter.slug !== slug) {
    throw new Error(`Slug "${frontmatter.slug}" does not match filename "${slug}.mdx"`);
  }
  return { ...frontmatter, body: content.trim() };
}

export function loadCaseStudies(): CaseStudy[] {
  return fs
    .readdirSync(WORK_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => loadCaseStudy(f.replace(/\.mdx$/, '')))
    .sort((a, b) => a.order - b.order);
}
