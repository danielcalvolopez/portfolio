import type { MetadataRoute } from 'next';
import { publicRoutes } from '@/lib/routes';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes().map((route) => ({
    url: new URL(route, SITE_URL).toString(),
  }));
}
