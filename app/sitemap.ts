import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/notion';
import { getListings } from '@/lib/listings';

export const dynamic = 'force-dynamic';

const BASE = 'https://dkcoleman.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const routes: MetadataRoute.Sitemap = ['', '/blog', '/projects', '/resources', '/resume', '/about', '/real-estate'].map((p) => ({
        url: `${BASE}${p}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: p === '' ? 1 : 0.7,
    }));

    try {
        const [posts, listings] = await Promise.all([getPublishedPosts(), getListings()]);
        for (const p of posts) {
            routes.push({ url: `${BASE}/blog/${p.slug}`, lastModified: new Date(p.date || Date.now()), changeFrequency: 'monthly', priority: 0.6 });
        }
        for (const l of [...listings.active, ...listings.past]) {
            routes.push({ url: `${BASE}/real-estate/${l.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 });
        }
    } catch {
        // If content is briefly unavailable, still return the static routes.
    }
    return routes;
}
