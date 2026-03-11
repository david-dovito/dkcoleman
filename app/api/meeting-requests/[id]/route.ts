import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetingRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);

    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 });
    }

    const [row] = await db
      .select({
        id: meetingRequests.id,
        status: meetingRequests.status,
        source: meetingRequests.source,
        aiResponse: meetingRequests.aiResponse,
      })
      .from(meetingRequests)
      .where(eq(meetingRequests.id, numId))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (err) {
    console.error('Error fetching meeting request status:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
