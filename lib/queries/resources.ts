import { db, isDbConfigured } from '@/lib/db';
import { resources as resourcesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface Resource {
  id: string;
  name: string;
  url: string;
  categories: string[];
  description: string;
  published: boolean;
}

export async function getPublishedResources(): Promise<Resource[]> {
  if (!isDbConfigured()) return [];
  const rows = await db
    .select()
    .from(resourcesTable)
    .where(eq(resourcesTable.published, true));

  return rows.map(row => ({
    id: String(row.id),
    name: row.name,
    url: row.url,
    categories: (row.categories as string[]) ?? [],
    description: row.description ?? '',
    published: row.published ?? true,
  }));
}
