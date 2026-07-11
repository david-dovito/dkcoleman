import { getSql } from './db';

export interface NarrativeSection {
    id: string;
    title: string;
    period: string;
    order: number;
    icon: string; // emoji or URL
    iconType: 'emoji' | 'image';
    content: string; // markdown
}

export async function getNarrativeSections(): Promise<NarrativeSection[]> {
    const sql = getSql();
    if (!sql) return [];
    try {
        const rows = (await sql`
            select id, title, period, "order", icon, icon_type, content
            from public.resume_narrative
            where published = true
            order by "order" asc nulls last, id asc
        `) as Record<string, unknown>[];
        return rows.map((r) => ({
            id: String(r.id),
            title: (r.title as string) || 'Untitled',
            period: (r.period as string) || '',
            order: (r.order as number) ?? 99,
            icon: (r.icon as string) || '📌',
            iconType: (r.icon_type as 'emoji' | 'image') || 'emoji',
            content: (r.content as string) || '',
        }));
    } catch (error) {
        console.error('Error fetching narrative sections from Neon:', error);
        return [];
    }
}
