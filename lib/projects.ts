import { getSql } from './db';

export interface Project {
    id: string;
    name: string;
    description: string;
    url: string;
    tech: string[];
    date: string;
    published: boolean;
    photo: string;
}

export async function getPublishedProjects(): Promise<Project[]> {
    const sql = getSql();
    if (!sql) return [];
    try {
        const rows = (await sql`
            select id, name, description, url, tech, date, published, photo
            from public.projects
            where published = true
            order by date desc nulls last, id desc
        `) as Record<string, unknown>[];
        return rows.map((r) => ({
            id: String(r.id),
            name: (r.name as string) || 'Untitled',
            description: (r.description as string) || '',
            url: (r.url as string) || '',
            tech: Array.isArray(r.tech) ? (r.tech as string[]) : [],
            date: (r.date as string) || '',
            published: Boolean(r.published),
            photo: (r.photo as string) || '',
        }));
    } catch (error) {
        console.error('Error fetching projects from Neon:', error);
        return [];
    }
}
