import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/auth';

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Public: the login page and the login/logout endpoints.
    if (pathname === '/admin/login' || pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
        return NextResponse.next();
    }

    const ok = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
    if (ok) return NextResponse.next();

    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
}
