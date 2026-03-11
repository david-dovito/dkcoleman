import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetingTokens } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const label = body.label || '';
    const expiresInDays = body.expiresInDays || 30;

    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const [row] = await db
      .insert(meetingTokens)
      .values({ token, label, expiresAt })
      .returning({ id: meetingTokens.id, token: meetingTokens.token });

    return NextResponse.json(
      { success: true, id: row.id, token: row.token, url: `/meet/${row.token}` },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating meeting token:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
