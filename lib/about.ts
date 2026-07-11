import { getSql } from './db';

export interface AboutData {
    introduction: string;
    whatIDo: string;
    thisWebsite: string;
    the1159: string;
}

const SAMPLE_DATA: AboutData = {
    introduction:
        "Hey! I'm David. As a young, Christian, business owner and aspiring investor, I'm passionate about seeing the next generation lead well. You are loved, and you can do it. Take reading this as a sign to keep going!",
    whatIDo:
        "I'm passionate about encouraging today's young professionals. Whether it's starting a career, launching a business, growing a brand, or just making a life, my heart is to encourage you on your journey.",
    thisWebsite:
        'This site is a Next.js app that pulls all of its content from a Neon Postgres database, managed through a built-in CMS. The animated background is a custom WebGL fragment shader running a CPPN neural network.',
    the1159: '',
};

// Accept either the canonical field key or a friendly section title/key.
const KEY_MAP: Record<string, keyof AboutData> = {
    introduction: 'introduction',
    whatido: 'whatIDo',
    'what i do': 'whatIDo',
    thiswebsite: 'thisWebsite',
    'this website': 'thisWebsite',
    the1159: 'the1159',
    'the 1159': 'the1159',
};

export async function getAboutSections(): Promise<AboutData> {
    const sql = getSql();
    if (!sql) return SAMPLE_DATA;
    try {
        const rows = (await sql`select key, title, content from public.about_sections order by "order" asc nulls last, id asc`) as Record<string, unknown>[];
        if (!rows.length) return SAMPLE_DATA;
        const data: AboutData = { ...SAMPLE_DATA };
        for (const r of rows) {
            const raw = String(r.key ?? r.title ?? '').trim().toLowerCase();
            const field = KEY_MAP[raw];
            if (field) data[field] = (r.content as string) || '';
        }
        return data;
    } catch (error) {
        console.error('Error fetching about sections from Neon:', error);
        return SAMPLE_DATA;
    }
}
