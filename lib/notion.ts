import { getSql } from './db';

/**
 * Blog data layer. Reads from the Neon `blog_posts` table at build time.
 *
 * The module keeps its historical name and the `NotionPost` type so existing
 * imports across the app don't churn, but the source of truth is now Neon
 * (migrated off the Notion API, which rate-limited at build once the archive
 * grew past ~80 posts). Content lives in the `content` column, so a single
 * query returns everything - no per-post fetches.
 */

export interface NotionPost {
    id: string;
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    author: string;
    tags: string[];
    published: boolean;
    featured?: boolean;
    content?: string;
    readingTime?: number; // Estimated minutes
    wordCount?: number;
}

export interface BlogStats {
    totalPosts: number;
    totalWords: number;
    avgReadingTime: number;
}

const SAMPLE: NotionPost = {
    id: 'sample-post',
    slug: 'welcome-to-notion-cms',
    title: 'Welcome',
    date: new Date().toISOString(),
    excerpt: 'Sample post shown because DATABASE_URL is not configured.',
    author: 'Admin',
    tags: ['Sample'],
    published: true,
    content: 'Set `DATABASE_URL` in your environment to load posts from Neon.',
    wordCount: 12,
    readingTime: 1,
};

function mapRow(r: Record<string, unknown>): NotionPost {
    const tags = r.tags;
    return {
        id: String(r.id),
        slug: (r.slug as string) || '',
        title: (r.title as string) || 'Untitled',
        date: (r.date as string) || new Date().toISOString(),
        excerpt: (r.excerpt as string) || '',
        author: (r.author as string) || 'David Coleman',
        tags: Array.isArray(tags) ? (tags as string[]) : typeof tags === 'string' ? JSON.parse(tags) : [],
        published: Boolean(r.published),
        featured: Boolean(r.featured),
        content: (r.content as string) ?? undefined,
        wordCount: (r.word_count as number) ?? undefined,
        readingTime: (r.reading_time as number) ?? undefined,
    };
}

export async function getPublishedPosts(): Promise<NotionPost[]> {
    const sql = getSql();
    if (!sql) {
        console.warn('Returning sample data because DATABASE_URL is not configured');
        return [{ ...SAMPLE, content: undefined }];
    }
    try {
        const rows = (await sql`
            select id, slug, title, date, excerpt, author, tags, published, featured, word_count, reading_time
            from public.blog_posts
            where published = true
            order by featured desc, date desc
        `) as Record<string, unknown>[];
        return rows.map(mapRow);
    } catch (error) {
        console.error('Error fetching posts from Neon:', error);
        return [{ ...SAMPLE, content: undefined }];
    }
}

export async function getPostBySlug(slug: string): Promise<NotionPost | null> {
    const sql = getSql();
    if (!sql) return slug === SAMPLE.slug ? SAMPLE : null;
    try {
        const rows = (await sql`
            select * from public.blog_posts where slug = ${slug} and published = true limit 1
        `) as Record<string, unknown>[];
        return rows.length ? mapRow(rows[0]) : null;
    } catch (error) {
        console.error(`Error fetching post with slug ${slug}:`, error);
        return null;
    }
}

export async function getPublishedPostsWithContent(): Promise<NotionPost[]> {
    const sql = getSql();
    if (!sql) return [SAMPLE];
    try {
        const rows = (await sql`
            select * from public.blog_posts where published = true order by featured desc, date desc
        `) as Record<string, unknown>[];
        return rows.map(mapRow);
    } catch (error) {
        console.error('Error fetching posts with content from Neon:', error);
        return [SAMPLE];
    }
}

export async function getBlogStats(): Promise<BlogStats> {
    const sql = getSql();
    if (!sql) return { totalPosts: 1, totalWords: 12, avgReadingTime: 1 };
    try {
        const rows = (await sql`
            select count(*)::int as posts,
                   coalesce(sum(word_count), 0)::int as words,
                   coalesce(round(avg(reading_time)), 0)::int as avg_read
            from public.blog_posts where published = true
        `) as Record<string, number>[];
        const r = rows[0];
        return { totalPosts: r.posts, totalWords: r.words, avgReadingTime: r.avg_read };
    } catch (error) {
        console.error('Error computing blog stats from Neon:', error);
        return { totalPosts: 0, totalWords: 0, avgReadingTime: 0 };
    }
}
