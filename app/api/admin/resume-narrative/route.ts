import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { resumeNarrative } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const rows = await db
      .select()
      .from(resumeNarrative)
      .orderBy(asc(resumeNarrative.order));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching resume narrative sections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const [row] = await db
      .insert(resumeNarrative)
      .values(body)
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('Error creating resume narrative section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
