import { loadCaseStudies } from './content';

export function publicRoutes(): string[] {
  return [
    '/',
    '/work/',
    ...loadCaseStudies().map((s) => `/work/${s.slug}/`),
    '/process/',
    '/about/',
  ];
}

/** OG file name for a route: "/" -> "home", "/work/retryfi/" -> "work-retryfi". */
export function ogName(route: string): string {
  return route === '/' ? 'home' : route.replaceAll('/', ' ').trim().replaceAll(' ', '-');
}
