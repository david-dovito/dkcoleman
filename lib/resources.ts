import { getSql } from './db';

export interface Resource {
    id: string;
    name: string;
    url: string;
    categories: string[];
    description: string;
    published: boolean;
}

export async function getPublishedResources(): Promise<Resource[]> {
    const sql = getSql();
    if (!sql) return [];
    try {
        const rows = (await sql`
            select id, name, url, categories, description, published
            from public.resources
            where published = true
            order by id desc
        `) as Record<string, unknown>[];
        return rows.map((r) => ({
            id: String(r.id),
            name: (r.name as string) || 'Untitled',
            url: (r.url as string) || '',
            categories: Array.isArray(r.categories) ? (r.categories as string[]) : [],
            description: (r.description as string) || '',
            published: Boolean(r.published),
        }));
    } catch (error) {
        console.error('Error fetching resources from Neon:', error);
        return [];
    }
}
