import { db, isDbConfigured } from '@/lib/db';
import { resume as resumeTable } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export interface Resume {
  title: string;
  content: string;
  lastUpdated: string;
}

export async function getResume(): Promise<Resume | null> {
  if (!isDbConfigured()) return null;
  try {
    const rows = await db
      .select()
      .from(resumeTable)
      .orderBy(desc(resumeTable.lastUpdated))
      .limit(1);

    if (rows.length === 0) {
      return {
        title: 'Resume',
        content: '# Resume\n\nResume content will appear here once configured.',
        lastUpdated: new Date().toISOString(),
      };
    }

    const row = rows[0];
    return {
      title: row.title,
      content: row.content,
      lastUpdated: row.lastUpdated?.toISOString() ?? new Date().toISOString(),
    };
  } catch {
    return {
      title: 'Resume',
      content: '',
      lastUpdated: new Date().toISOString(),
    };
  }
}
