import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const [row] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, parseInt(id, 10)));

    if (!row) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await request.json();

    // Auto-calculate wordCount and readingTime if content is provided
    const updates: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };
    if (body.content !== undefined) {
      const content = body.content || '';
      updates.wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
      updates.readingTime = Math.ceil((updates.wordCount as number) / 200);
    }

    const [row] = await db
      .update(blogPosts)
      .set(updates)
      .where(eq(blogPosts.id, parseInt(id, 10)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const [row] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, parseInt(id, 10)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
