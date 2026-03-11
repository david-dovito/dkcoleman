import { db, isDbConfigured } from '@/lib/db';
import { resumeNarrative } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export interface NarrativeSection {
  id: string;
  title: string;
  period: string;
  order: number;
  icon: string;
  iconType: 'emoji' | 'image';
  content: string;
}

export async function getNarrativeSections(): Promise<NarrativeSection[]> {
  if (!isDbConfigured()) return [];
  try {
    const rows = await db
      .select()
      .from(resumeNarrative)
      .where(eq(resumeNarrative.published, true))
      .orderBy(asc(resumeNarrative.order));

    return rows.map(row => ({
      id: String(row.id),
      title: row.title,
      period: row.period ?? '',
      order: row.order ?? 99,
      icon: row.icon ?? '📌',
      iconType: (row.iconType as 'emoji' | 'image') ?? 'emoji',
      content: row.content ?? '',
    }));
  } catch {
    return [];
  }
}
