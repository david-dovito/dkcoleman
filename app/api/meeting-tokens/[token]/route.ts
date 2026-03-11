import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetingTokens } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const [row] = await db
      .select()
      .from(meetingTokens)
      .where(eq(meetingTokens.token, token))
      .limit(1);

    if (!row) {
      return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 });
    }

    if (row.used) {
      return NextResponse.json({ valid: false, reason: 'already_used' }, { status: 410 });
    }

    if (row.expiresAt && new Date() > row.expiresAt) {
      return NextResponse.json({ valid: false, reason: 'expired' }, { status: 410 });
    }

    return NextResponse.json({ valid: true, label: row.label });
  } catch (err) {
    console.error('Error validating meeting token:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
