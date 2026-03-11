import { db, isDbConfigured } from '@/lib/db';
import { aboutSections } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export interface AboutData {
  introduction: string;
  whatIDo: string;
  thisWebsite: string;
  the1159: string;
}

const SAMPLE_DATA: AboutData = {
  introduction: "Hey! I'm David. As a young, Christian, business owner and aspiring investor, I'm passionate about seeing the next generation lead well. You are loved, and you can do it. Take reading this as a sign to keep going!",
  whatIDo: "I'm passionate about encouraging today's young professionals. Whether it's starting a career, launching a business, growing a brand, or just making a life — my heart is to encourage you on your journey.",
  thisWebsite: "This is a Vercel-hosted Next.js site backed by PostgreSQL. The animated background is a custom WebGL fragment shader running a CPPN neural network, and yes, it was built oftentimes with AI.",
  the1159: '',
};

export async function getAboutSections(): Promise<AboutData> {
  if (!isDbConfigured()) return SAMPLE_DATA;
  try {
    const rows = await db
      .select()
      .from(aboutSections)
      .orderBy(asc(aboutSections.order));

    if (rows.length === 0) return SAMPLE_DATA;

    const data: AboutData = { ...SAMPLE_DATA };
    for (const row of rows) {
      const key = row.key as keyof AboutData;
      if (key in data) {
        data[key] = row.content;
      }
    }
    return data;
  } catch {
    return SAMPLE_DATA;
  }
}
