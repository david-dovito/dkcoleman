import { NextRequest, NextResponse } from 'next/server';
import { collection } from '@/lib/cms/schema';
import { getRow, updateRow, deleteRow } from '@/lib/cms/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolve(params: Promise<{ collection: string; id: string }>) {
    const { collection: key, id } = await params;
    return { c: collection(key), id };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) {
    const { c, id } = await resolve(params);
    if (!c) return NextResponse.json({ error: 'unknown collection' }, { status: 404 });
    const row = await getRow(c, id);
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ row });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) {
    const { c, id } = await resolve(params);
    if (!c) return NextResponse.json({ error: 'unknown collection' }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    try {
        const row = await updateRow(c, id, body);
        if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
        return NextResponse.json({ row });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) {
    const { c, id } = await resolve(params);
    if (!c) return NextResponse.json({ error: 'unknown collection' }, { status: 404 });
    await deleteRow(c, id);
    return NextResponse.json({ ok: true });
}
