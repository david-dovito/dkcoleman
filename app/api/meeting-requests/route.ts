import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetingRequests, meetingTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface MeetingRequestBody {
  name: string;
  email: string;
  company?: string;
  reason: string;
  preferredTimeframe?: string;
  additionalContext?: string;
  source?: 'new' | 'preapproved';
  token?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body: MeetingRequestBody = await request.json();

    // ── Validate required fields ──

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Name is required.' },
        { status: 400 }
      );
    }

    if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(body.email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!body.reason || typeof body.reason !== 'string' || !body.reason.trim()) {
      return NextResponse.json(
        { error: 'Reason is required.' },
        { status: 400 }
      );
    }

    // ── Validate and consume token if preapproved ──

    let tokenId: number | undefined;
    const source = body.source === 'preapproved' ? 'preapproved' : 'new';

    if (source === 'preapproved' && body.token) {
      const [tokenRow] = await db
        .select()
        .from(meetingTokens)
        .where(eq(meetingTokens.token, body.token))
        .limit(1);

      if (!tokenRow) {
        return NextResponse.json({ error: 'Invalid meeting link.' }, { status: 400 });
      }
      if (tokenRow.used) {
        return NextResponse.json({ error: 'This meeting link has already been used.' }, { status: 410 });
      }
      if (tokenRow.expiresAt && new Date() > tokenRow.expiresAt) {
        return NextResponse.json({ error: 'This meeting link has expired.' }, { status: 410 });
      }

      tokenId = tokenRow.id;
    }

    // ── Insert into database ──

    const [row] = await db
      .insert(meetingRequests)
      .values({
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        company: body.company?.trim() || '',
        reason: body.reason.trim(),
        preferredTimeframe: body.preferredTimeframe?.trim() || '',
        additionalContext: body.additionalContext?.trim() || '',
        source,
        tokenId,
        status: 'pending',
      })
      .returning({ id: meetingRequests.id });

    // ── Mark token as used ──

    if (tokenId) {
      await db
        .update(meetingTokens)
        .set({ used: true, usedAt: new Date(), usedByRequestId: row.id })
        .where(eq(meetingTokens.id, tokenId));
    }

    // ── Fire n8n webhook (non-blocking, fire and forget) ──

    const webhookUrl = process.env.N8N_MEETING_WEBHOOK_URL;
    if (webhookUrl) {
      const secret = process.env.N8N_WEBHOOK_SECRET;
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'X-Webhook-Secret': secret } : {}),
        },
        body: JSON.stringify({ id: row.id, source, ...body }),
      }).catch(() => {});
    }

    return NextResponse.json(
      { success: true, id: row.id },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating meeting request:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
