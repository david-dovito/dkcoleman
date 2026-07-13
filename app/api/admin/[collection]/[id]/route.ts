import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { collection } from '@/lib/cms/schema';
import { getRow, updateRow, deleteRow, ValidationError, ConflictError } from '@/lib/cms/db';
import { isAdmin } from '@/lib/require-admin';
import { revalidateForCollection } from '@/lib/cms/revalidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { collection: key, id } = await params;
    const c = collection(key);
    if (!c) return NextResponse.json({ error: 'unknown collection' }, { status: 404 });
    const row = await getRow(c, id);
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ row });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { collection: key, id } = await params;
    const c = collection(key);
    if (!c) return NextResponse.json({ error: 'unknown collection' }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    try {
        const row = await updateRow(c, id, body);
        if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
        for (const p of revalidateForCollection(key, row)) revalidatePath(p);
        return NextResponse.json({ row });
    } catch (e) {
        if (e instanceof ConflictError) return NextResponse.json({ error: e.message }, { status: 409 });
        if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 422 });
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { collection: key, id } = await params;
    const c = collection(key);
    if (!c) return NextResponse.json({ error: 'unknown collection' }, { status: 404 });
    await deleteRow(c, id);
    for (const p of revalidateForCollection(key)) revalidatePath(p);
    return NextResponse.json({ ok: true });
}
