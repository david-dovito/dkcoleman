import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { aboutSections } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const rows = await db
      .select()
      .from(aboutSections)
      .orderBy(asc(aboutSections.order));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching about sections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // Accept an array of {key, title, content, order} to upsert all sections
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be an array of sections' },
        { status: 400 }
      );
    }

    const results = [];
    for (const section of body) {
      if (!section.key) {
        continue;
      }

      // Check if section with this key already exists
      const [existing] = await db
        .select()
        .from(aboutSections)
        .where(eq(aboutSections.key, section.key));

      if (existing) {
        const [updated] = await db
          .update(aboutSections)
          .set({
            title: section.title ?? existing.title,
            content: section.content ?? existing.content,
            order: section.order ?? existing.order,
            updatedAt: new Date(),
          })
          .where(eq(aboutSections.key, section.key))
          .returning();
        results.push(updated);
      } else {
        const [inserted] = await db
          .insert(aboutSections)
          .values({
            key: section.key,
            title: section.title,
            content: section.content,
            order: section.order ?? 0,
          })
          .returning();
        results.push(inserted);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating about sections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
