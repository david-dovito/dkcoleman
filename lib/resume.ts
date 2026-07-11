import { getSql } from './db';

export interface Resume {
    title: string;
    content: string;
    lastUpdated: string;
}

const DEFAULT: Resume = {
    title: 'Resume',
    content: '',
    lastUpdated: new Date().toISOString(),
};

export async function getResume(): Promise<Resume | null> {
    const sql = getSql();
    if (!sql) return DEFAULT;
    try {
        const rows = (await sql`select title, content, last_updated from public.resume order by id asc limit 1`) as Record<string, unknown>[];
        if (!rows.length) return DEFAULT;
        const r = rows[0];
        return {
            title: (r.title as string) || 'Resume',
            content: (r.content as string) || '',
            lastUpdated: r.last_updated ? new Date(r.last_updated as string).toISOString() : new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error fetching resume from Neon:', error);
        return DEFAULT;
    }
}
