import { db, isDbConfigured } from '@/lib/db';
import { projects as projectsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
  if (!isDbConfigured()) return [];
  const rows = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.published, true));

  return rows.map(row => ({
    id: String(row.id),
    name: row.name,
    description: row.description ?? '',
    url: row.url ?? '',
    tech: (row.tech as string[]) ?? [],
    date: row.date ?? '',
    published: row.published ?? true,
    photo: row.photo ?? '',
  }));
}
