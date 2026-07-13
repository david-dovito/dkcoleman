import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, checkPassword, createSessionToken, cookieOptions } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // Throttle brute-force: 8 attempts per IP per 10 minutes.
    const limit = await rateLimit(`login:${clientIp(req)}`, 8, 600);
    if (!limit.ok) {
        return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    const { password } = await req.json().catch(() => ({ password: '' }));
    if (!checkPassword(password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    const token = await createSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, cookieOptions);
    return res;
}
