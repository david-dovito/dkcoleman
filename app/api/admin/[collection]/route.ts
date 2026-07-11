import { NextRequest, NextResponse } from 'next/server';
import { collection } from '@/lib/cms/schema';
import { listRows, createRow } from '@/lib/cms/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
    const { collection: key } = await params;
    const c = collection(key);
    if (!c) return NextResponse.json({ error: 'unknown collection' }, { status: 404 });
    return NextResponse.json({ rows: await listRows(c) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
    const { collection: key } = await params;
    const c = collection(key);
    if (!c) return NextResponse.json({ error: 'unknown collection' }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    try {
        const row = await createRow(c, body);
        return NextResponse.json({ row }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
}
