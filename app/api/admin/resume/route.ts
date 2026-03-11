import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { resume } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const rows = await db.select().from(resume);
    const row = rows[0] ?? null;

    if (!row) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error('Error fetching resume:', error);
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

    // Get existing resume row (there should be exactly one)
    const existing = await db.select().from(resume);

    let row;
    if (existing.length === 0) {
      // Create if none exists
      [row] = await db
        .insert(resume)
        .values({
          title: body.title ?? 'Resume',
          content: body.content ?? '',
          lastUpdated: new Date(),
        })
        .returning();
    } else {
      // Update the existing row
      [row] = await db
        .update(resume)
        .set({
          ...body,
          lastUpdated: new Date(),
        })
        .where(eq(resume.id, existing[0].id))
        .returning();
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
