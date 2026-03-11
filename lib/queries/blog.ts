import { db, isDbConfigured } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { eq, desc, and, asc } from 'drizzle-orm';

// Re-export the same interface the rest of the app expects
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
  readingTime?: number;
  wordCount?: number;
}

export interface BlogStats {
  totalPosts: number;
  totalWords: number;
  avgReadingTime: number;
}

export async function getPublishedPosts(): Promise<NotionPost[]> {
  if (!isDbConfigured()) return [];
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.featured), desc(blogPosts.date));

  return rows.map(row => ({
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt ?? '',
    author: row.author ?? 'David Coleman',
    tags: (row.tags as string[]) ?? [],
    published: row.published ?? true,
    featured: row.featured ?? false,
  }));
}

export async function getPostBySlug(slug: string): Promise<NotionPost | null> {
  if (!isDbConfigured()) return null;
  const rows = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt ?? '',
    author: row.author ?? 'David Coleman',
    tags: (row.tags as string[]) ?? [],
    published: row.published ?? true,
    featured: row.featured ?? false,
    content: row.content ?? '',
    wordCount: row.wordCount ?? 0,
    readingTime: row.readingTime ?? 0,
  };
}

export async function getPublishedPostsWithContent(): Promise<NotionPost[]> {
  if (!isDbConfigured()) return [];
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.featured), desc(blogPosts.date));

  return rows.map(row => ({
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt ?? '',
    author: row.author ?? 'David Coleman',
    tags: (row.tags as string[]) ?? [],
    published: row.published ?? true,
    featured: row.featured ?? false,
    content: row.content ?? '',
    wordCount: row.wordCount ?? 0,
    readingTime: row.readingTime ?? 0,
  }));
}

export async function getBlogStats(): Promise<BlogStats> {
  if (!isDbConfigured()) return { totalPosts: 0, totalWords: 0, avgReadingTime: 0 };
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  const totalPosts = rows.length;
  const totalWords = rows.reduce((sum, r) => sum + (r.wordCount ?? 0), 0);
  const totalReadingTime = rows.reduce((sum, r) => sum + (r.readingTime ?? 0), 0);

  return {
    totalPosts,
    totalWords,
    avgReadingTime: totalPosts > 0 ? Math.round(totalReadingTime / totalPosts) : 0,
  };
}

// Adapter aliases (lib/blog.ts compatibility)
export type Post = NotionPost;

export async function getAllPosts(): Promise<Post[]> {
  return getPublishedPosts();
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getPublishedPosts();
  const tagsSet = new Set<string>();
  posts.forEach(post => post.tags?.forEach(tag => tagsSet.add(tag)));
  return Array.from(tagsSet).sort();
}

export const getDatabaseId = () => 'neon';
