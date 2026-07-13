import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
        sitemap: 'https://dkcoleman.com/sitemap.xml',
        host: 'https://dkcoleman.com',
    };
}
