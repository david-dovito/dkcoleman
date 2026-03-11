import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetingRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface N8nCallbackBody {
  id: number;
  status: string;
  aiResponse?: Record<string, unknown>;
}

const VALID_STATUSES = [
  'pending',
  'processing',
  'aligned',
  'not_aligned',
  'scheduled',
  'declined',
] as const;

export async function POST(request: NextRequest) {
  try {
    // ── Validate webhook secret ──

    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
    if (expectedSecret) {
      const providedSecret = request.headers.get('X-Webhook-Secret');
      if (providedSecret !== expectedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized.' },
          { status: 401 }
        );
      }
    }

    const body: N8nCallbackBody = await request.json();

    // ── Validate required fields ──

    if (!body.id || typeof body.id !== 'number') {
      return NextResponse.json(
        { error: 'A valid numeric id is required.' },
        { status: 400 }
      );
    }

    if (
      !body.status ||
      typeof body.status !== 'string' ||
      !VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])
    ) {
      return NextResponse.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // ── Build update payload ──

    const updateData: Record<string, unknown> = {
      status: body.status,
      updatedAt: new Date(),
    };

    if (body.aiResponse !== undefined) {
      updateData.aiResponse = body.aiResponse;
    }

    // Set notifiedAt when transitioning to a notification-worthy status
    if (['aligned', 'not_aligned', 'scheduled', 'declined'].includes(body.status)) {
      updateData.notifiedAt = new Date();
    }

    // ── Update the record ──

    const result = await db
      .update(meetingRequests)
      .set(updateData)
      .where(eq(meetingRequests.id, body.id))
      .returning({ id: meetingRequests.id });

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Meeting request not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Error processing n8n webhook callback:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
