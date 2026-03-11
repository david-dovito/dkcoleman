/**
 * Notion → Neon PostgreSQL Migration Script
 *
 * One-time script to migrate all content from Notion databases into Neon PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/migrate-notion-to-neon.ts
 *   npx tsx scripts/migrate-notion-to-neon.ts --dry-run
 *
 * Env vars loaded from .env.local (see .env.example for required keys).
 */

import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local before any other imports that depend on them
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/db/schema';

// ─── CLI Flags ───────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Clients ─────────────────────────────────────────────────────────────────

function getNotionClient(): Client {
  const token = process.env.NOTION_TOKEN;
  if (!token || token.includes('your_integration_token')) {
    throw new Error('NOTION_TOKEN is not set or is a placeholder');
  }
  return new Client({ auth: token });
}

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(source: string, message: string) {
  console.log(`[${source}] ${message}`);
}

function logError(source: string, message: string, error: unknown) {
  console.error(`[${source}] ${message}`, error instanceof Error ? error.message : error);
}

/**
 * Concatenate all rich_text segments into plain text.
 * Handles cases where rich_text has multiple segments.
 */
function richTextToPlain(richText: any[] | undefined): string {
  if (!richText || richText.length === 0) return '';
  return richText.map((rt: any) => rt.plain_text).join('');
}

/**
 * Calculate word count and reading time from markdown content.
 */
function computeReadingStats(content: string): { wordCount: number; readingTime: number } {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTime = Math.ceil(wordCount / 200);
  return { wordCount, readingTime };
}

/**
 * Download an image from a URL and upload it to Vercel Blob storage.
 * Returns the public blob URL.
 */
async function uploadImageToBlob(imageUrl: string, filename: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType,
  });

  return blob.url;
}

/**
 * Paginate through all results of a Notion database query.
 * The Notion API returns at most 100 results per request.
 */
async function queryAllPages(notion: Client, databaseId: string, options?: {
  filter?: any;
  sorts?: any[];
}): Promise<any[]> {
  const allResults: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: databaseId,
      filter: options?.filter,
      sorts: options?.sorts,
      start_cursor: cursor,
      page_size: 100,
    });
    allResults.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return allResults;
}

// ─── Migration Functions ─────────────────────────────────────────────────────

async function migrateBlogPosts(notion: Client, n2m: NotionToMarkdown, db: any) {
  const source = 'Blog';
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    log(source, 'NOTION_DATABASE_ID not set, skipping.');
    return;
  }

  log(source, 'Fetching all blog posts from Notion...');

  const pages = await queryAllPages(notion, databaseId);
  log(source, `Found ${pages.length} blog posts.`);

  const rows: (typeof schema.blogPosts.$inferInsert)[] = [];

  for (const page of pages) {
    const props = page.properties;
    const title = richTextToPlain(props.Title?.title) || 'Untitled';
    const slug = richTextToPlain(props.Slug?.rich_text) || '';

    log(source, `  Processing: "${title}" (slug: ${slug || '<none>'})`);

    // Fetch page content as markdown
    let content = '';
    try {
      const mdBlocks = await n2m.pageToMarkdown(page.id);
      const mdString = n2m.toMarkdownString(mdBlocks);
      content = mdString.parent;
    } catch (err) {
      logError(source, `  Failed to convert blocks for "${title}"`, err);
    }

    const { wordCount, readingTime } = computeReadingStats(content);

    rows.push({
      slug: slug || page.id,
      title,
      date: props.Date?.date?.start || new Date().toISOString().split('T')[0],
      excerpt: richTextToPlain(props.Excerpt?.rich_text) || '',
      author: richTextToPlain(props.Author?.rich_text) || 'David Coleman',
      tags: props.Tags?.multi_select?.map((t: any) => t.name) || [],
      published: props.Published?.checkbox ?? false,
      featured: props.Featured?.checkbox ?? false,
      content,
      wordCount,
      readingTime,
    });
  }

  if (DRY_RUN) {
    log(source, `DRY RUN: Would insert ${rows.length} blog posts.`);
    for (const r of rows) {
      log(source, `  - "${r.title}" (slug: ${r.slug}, published: ${r.published}, words: ${r.wordCount})`);
    }
    return;
  }

  if (rows.length > 0) {
    log(source, `Inserting ${rows.length} blog posts into Neon...`);
    for (const row of rows) {
      await db.insert(schema.blogPosts).values(row);
    }
    log(source, 'Done.');
  }
}

async function migrateResources(notion: Client, db: any) {
  const source = 'Resources';
  const databaseId = process.env.NOTION_RESOURCES_DATABASE_ID;

  if (!databaseId) {
    log(source, 'NOTION_RESOURCES_DATABASE_ID not set, skipping.');
    return;
  }

  log(source, 'Fetching all resources from Notion...');

  const pages = await queryAllPages(notion, databaseId);
  log(source, `Found ${pages.length} resources.`);

  const rows: (typeof schema.resources.$inferInsert)[] = [];

  for (const page of pages) {
    const props = page.properties;
    const name = richTextToPlain(props.Name?.title) || 'Untitled';

    log(source, `  Processing: "${name}"`);

    rows.push({
      name,
      url: props.URL?.url || '',
      categories: props.Category?.multi_select?.map((item: any) => item.name) || [],
      description: richTextToPlain(props.Description?.rich_text) || '',
      published: props.Published?.checkbox ?? false,
    });
  }

  if (DRY_RUN) {
    log(source, `DRY RUN: Would insert ${rows.length} resources.`);
    for (const r of rows) {
      log(source, `  - "${r.name}" (${r.url}, published: ${r.published})`);
    }
    return;
  }

  if (rows.length > 0) {
    log(source, `Inserting ${rows.length} resources into Neon...`);
    for (const row of rows) {
      await db.insert(schema.resources).values(row);
    }
    log(source, 'Done.');
  }
}

async function migrateProjects(notion: Client, db: any) {
  const source = 'Projects';
  const databaseId = process.env.NOTION_PROJECTS_DATABASE_ID;

  if (!databaseId) {
    log(source, 'NOTION_PROJECTS_DATABASE_ID not set, skipping.');
    return;
  }

  log(source, 'Fetching all projects from Notion...');

  const pages = await queryAllPages(notion, databaseId);
  log(source, `Found ${pages.length} projects.`);

  const rows: (typeof schema.projects.$inferInsert)[] = [];

  for (const page of pages) {
    const props = page.properties;
    const name = richTextToPlain(props.Name?.title) || 'Untitled';

    log(source, `  Processing: "${name}"`);

    // Handle photo: download Notion-hosted images and upload to Vercel Blob
    const photoFiles = props.Photo?.files || [];
    let photo = '';

    if (photoFiles.length > 0) {
      const file = photoFiles[0];
      try {
        if (file.type === 'external') {
          // External URLs are stable; upload to Blob anyway for consistency
          const extUrl = file.external?.url || '';
          if (extUrl) {
            log(source, `    Uploading external image to Blob for "${name}"...`);
            const ext = extUrl.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/i)?.[1] || 'jpg';
            const filename = `projects/${page.id.replace(/-/g, '')}.${ext}`;
            photo = await uploadImageToBlob(extUrl, filename);
            log(source, `    Uploaded: ${photo}`);
          }
        } else if (file.type === 'file') {
          // Notion-hosted file: temporary URL, must download now
          const notionUrl = file.file?.url || '';
          if (notionUrl) {
            log(source, `    Downloading Notion-hosted image for "${name}"...`);
            const contentType = 'image/jpeg'; // Will be detected on fetch
            const ext = notionUrl.match(/\.(png|jpg|jpeg|webp|gif)/i)?.[1] || 'jpg';
            const filename = `projects/${page.id.replace(/-/g, '')}.${ext}`;
            photo = await uploadImageToBlob(notionUrl, filename);
            log(source, `    Uploaded: ${photo}`);
          }
        }
      } catch (err) {
        logError(source, `    Failed to upload image for "${name}"`, err);
      }
    }

    rows.push({
      name,
      description: richTextToPlain(props.Description?.rich_text) || '',
      url: props.URL?.url || '',
      tech: props.Category?.select ? [props.Category.select.name] : [],
      date: '',
      published: props.Published?.checkbox ?? false,
      photo,
    });
  }

  if (DRY_RUN) {
    log(source, `DRY RUN: Would insert ${rows.length} projects.`);
    for (const r of rows) {
      log(source, `  - "${r.name}" (photo: ${r.photo || '<none>'}, published: ${r.published})`);
    }
    return;
  }

  if (rows.length > 0) {
    log(source, `Inserting ${rows.length} projects into Neon...`);
    for (const row of rows) {
      await db.insert(schema.projects).values(row);
    }
    log(source, 'Done.');
  }
}

async function migrateAboutSections(notion: Client, db: any) {
  const source = 'About';
  const databaseId = process.env.NOTION_ABOUT_DATABASE_ID;

  if (!databaseId) {
    log(source, 'NOTION_ABOUT_DATABASE_ID not set, skipping.');
    return;
  }

  log(source, 'Fetching about sections from Notion...');

  const pages = await queryAllPages(notion, databaseId);
  log(source, `Found ${pages.length} about section pages.`);

  const NAME_TO_KEY: Record<string, string> = {
    'Introduction': 'introduction',
    'What I do': 'whatIDo',
    'What I Do': 'whatIDo',
    'This Website': 'thisWebsite',
    'The 1159': 'the1159',
  };

  // Order mapping so sections appear in a predictable order
  const KEY_ORDER: Record<string, number> = {
    'introduction': 0,
    'whatIDo': 1,
    'thisWebsite': 2,
    'the1159': 3,
  };

  const rows: (typeof schema.aboutSections.$inferInsert)[] = [];

  for (const page of pages) {
    const props = page.properties;
    const name = richTextToPlain(props.Name?.title) || '';
    const key = NAME_TO_KEY[name];

    if (!key) {
      log(source, `  Skipping unrecognized section: "${name}"`);
      continue;
    }

    log(source, `  Processing: "${name}" → key "${key}"`);

    // Try the Text property first, then fall back to page block content
    let content = richTextToPlain(props.Text?.rich_text) || '';

    if (!content) {
      log(source, `    Text property empty, reading page blocks...`);
      try {
        const blocks = await notion.blocks.children.list({ block_id: page.id });
        const paragraphs: string[] = [];
        for (const block of blocks.results as any[]) {
          if (block.type === 'paragraph' && block.paragraph?.rich_text) {
            const text = block.paragraph.rich_text.map((rt: any) => rt.plain_text).join('');
            if (text.trim()) paragraphs.push(text.trim());
          }
        }
        content = paragraphs.join('\n\n');
      } catch (err) {
        logError(source, `    Failed to read page blocks for "${name}"`, err);
      }
    }

    rows.push({
      key,
      title: name,
      content: content || '',
      order: KEY_ORDER[key] ?? 99,
    });
  }

  if (DRY_RUN) {
    log(source, `DRY RUN: Would insert ${rows.length} about sections.`);
    for (const r of rows) {
      log(source, `  - key="${r.key}", title="${r.title}", content length: ${r.content.length}`);
    }
    return;
  }

  if (rows.length > 0) {
    log(source, `Inserting ${rows.length} about sections into Neon...`);
    for (const row of rows) {
      await db.insert(schema.aboutSections).values(row);
    }
    log(source, 'Done.');
  }
}

async function migrateResume(notion: Client, n2m: NotionToMarkdown, db: any) {
  const source = 'Resume';
  const pageId = process.env.NOTION_RESUME_PAGE_ID;

  if (!pageId) {
    log(source, 'NOTION_RESUME_PAGE_ID not set, skipping.');
    return;
  }

  log(source, 'Fetching resume page from Notion...');

  let title = 'Resume';
  let content = '';

  try {
    const page = await notion.pages.retrieve({ page_id: pageId }) as any;
    title = page.properties?.title?.title?.[0]?.plain_text || 'Resume';

    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdBlocks);
    content = mdString.parent;
  } catch (err) {
    logError(source, 'Failed to fetch resume page', err);
    return;
  }

  log(source, `Title: "${title}", content length: ${content.length} chars`);

  const row: typeof schema.resume.$inferInsert = {
    title,
    content,
  };

  if (DRY_RUN) {
    log(source, `DRY RUN: Would insert 1 resume row.`);
    log(source, `  - title="${title}", content length: ${content.length}`);
    return;
  }

  log(source, 'Inserting resume into Neon...');
  await db.insert(schema.resume).values(row);
  log(source, 'Done.');
}

async function migrateResumeNarrative(notion: Client, n2m: NotionToMarkdown, db: any) {
  const source = 'Resume Narrative';
  const databaseId = process.env.NOTION_RESUME_NARRATIVE_DATABASE_ID;

  if (!databaseId) {
    log(source, 'NOTION_RESUME_NARRATIVE_DATABASE_ID not set, skipping.');
    return;
  }

  log(source, 'Fetching resume narrative sections from Notion...');

  const pages = await queryAllPages(notion, databaseId, {
    sorts: [{ property: 'number', direction: 'ascending' }],
  });

  log(source, `Found ${pages.length} narrative sections.`);

  const rows: (typeof schema.resumeNarrative.$inferInsert)[] = [];

  for (const page of pages) {
    const props = page.properties;
    const pageIcon = page.icon;

    const title = richTextToPlain(props.Name?.title) || 'Untitled';
    const period = richTextToPlain(props.Period?.rich_text) || '';
    const order = props.number?.number ?? 99;
    const published = props.published?.checkbox ?? false;

    log(source, `  Processing: "${title}" (order: ${order}, published: ${published})`);

    // Determine icon and icon type
    let icon = '📌';
    let iconType: 'emoji' | 'image' = 'emoji';

    if (pageIcon?.type === 'emoji') {
      icon = pageIcon.emoji;
    } else if (pageIcon?.type === 'external') {
      icon = pageIcon.external.url;
      iconType = 'image';
    } else if (pageIcon?.type === 'file') {
      icon = pageIcon.file.url;
      iconType = 'image';
    }

    // Convert page blocks to markdown
    let content = '';
    try {
      const mdBlocks = await n2m.pageToMarkdown(page.id);
      const mdString = n2m.toMarkdownString(mdBlocks);
      content = mdString.parent;
    } catch (err) {
      logError(source, `  Failed to convert blocks for "${title}"`, err);
    }

    rows.push({
      title,
      period,
      order,
      icon,
      iconType,
      content,
      published,
    });
  }

  if (DRY_RUN) {
    log(source, `DRY RUN: Would insert ${rows.length} narrative sections.`);
    for (const r of rows) {
      log(source, `  - "${r.title}" (order: ${r.order}, icon: ${r.icon}, published: ${r.published})`);
    }
    return;
  }

  if (rows.length > 0) {
    log(source, `Inserting ${rows.length} narrative sections into Neon...`);
    for (const row of rows) {
      await db.insert(schema.resumeNarrative).values(row);
    }
    log(source, 'Done.');
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  Notion → Neon PostgreSQL Migration');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no database writes)' : 'LIVE'}`);
  console.log('='.repeat(60));
  console.log();

  // Validate required env vars
  if (!process.env.NOTION_TOKEN) {
    console.error('NOTION_TOKEN is not set. Aborting.');
    process.exit(1);
  }

  if (!DRY_RUN && !process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set and this is not a dry run. Aborting.');
    process.exit(1);
  }

  const notion = getNotionClient();
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const db = DRY_RUN ? null : getDb();

  const migrations: Array<{
    name: string;
    fn: () => Promise<void>;
  }> = [
    { name: 'Blog Posts', fn: () => migrateBlogPosts(notion, n2m, db) },
    { name: 'Resources', fn: () => migrateResources(notion, db) },
    { name: 'Projects', fn: () => migrateProjects(notion, db) },
    { name: 'About Sections', fn: () => migrateAboutSections(notion, db) },
    { name: 'Resume', fn: () => migrateResume(notion, n2m, db) },
    { name: 'Resume Narrative', fn: () => migrateResumeNarrative(notion, n2m, db) },
  ];

  const results: Array<{ name: string; status: 'success' | 'failed'; error?: string }> = [];

  for (const migration of migrations) {
    console.log();
    console.log(`${'─'.repeat(40)}`);
    console.log(`Starting: ${migration.name}`);
    console.log(`${'─'.repeat(40)}`);

    try {
      await migration.fn();
      results.push({ name: migration.name, status: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAILED: ${migration.name} - ${message}`);
      results.push({ name: migration.name, status: 'failed', error: message });
    }
  }

  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('  Migration Summary');
  console.log('='.repeat(60));

  for (const result of results) {
    const icon = result.status === 'success' ? 'OK' : 'FAIL';
    const detail = result.error ? ` (${result.error})` : '';
    console.log(`  [${icon}] ${result.name}${detail}`);
  }

  const failures = results.filter(r => r.status === 'failed');
  console.log();
  if (failures.length === 0) {
    console.log(DRY_RUN
      ? 'Dry run complete. No data was written.'
      : 'All migrations completed successfully.');
  } else {
    console.log(`${failures.length} migration(s) failed. See errors above.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
