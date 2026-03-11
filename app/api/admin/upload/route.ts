import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { images } from '@/lib/db/schema';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const entityType = (formData.get('entityType') as string) ?? '';
    const entityIdRaw = formData.get('entityId') as string | null;
    const entityId = entityIdRaw ? parseInt(entityIdRaw, 10) : null;

    const blob = await put(file.name, file, { access: 'public' });

    const [row] = await db
      .insert(images)
      .values({
        filename: file.name,
        url: blob.url,
        contentType: file.type,
        size: file.size,
        entityType,
        entityId,
      })
      .returning();

    return NextResponse.json(
      {
        ...row,
        blobUrl: blob.url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
