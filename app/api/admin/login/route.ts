import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, checkPassword, createSessionToken, cookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { password } = await req.json().catch(() => ({ password: '' }));
    if (!checkPassword(password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    const token = await createSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, cookieOptions);
    return res;
}
