/**
 * Minimal admin auth: a stateless HMAC-signed session token stored in an
 * httpOnly cookie. Uses Web Crypto (available in both the Edge middleware and
 * Node route handlers) so there is no external JWT dependency.
 *
 * Login checks a single password (ADMIN_PASSWORD) and issues a token signed
 * with ADMIN_SECRET (falls back to JWT_SECRET). This is scoped to a personal
 * single-admin CMS, not multi-user auth.
 */

export const ADMIN_COOKIE = 'dk_admin';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret(): string {
    const s = process.env.ADMIN_SECRET || process.env.JWT_SECRET;
    if (!s) {
        // Fail loudly rather than silently signing admin sessions with a known
        // public string. Set ADMIN_SECRET (or JWT_SECRET) in every environment.
        throw new Error('ADMIN_SECRET (or JWT_SECRET) is not set; admin auth is disabled');
    }
    return s;
}

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (str: string) => {
    const s = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function key(): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSessionToken(subject = 'admin'): Promise<string> {
    const payload = { sub: subject, exp: Math.floor(Date.now() / 1000) + MAX_AGE };
    const body = b64url(enc.encode(JSON.stringify(payload)));
    const sig = await crypto.subtle.sign('HMAC', await key(), enc.encode(body));
    return `${body}.${b64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
    if (!token || !token.includes('.')) return false;
    const [body, sig] = token.split('.');
    try {
        const ok = await crypto.subtle.verify('HMAC', await key(), fromB64url(sig), enc.encode(body));
        if (!ok) return false;
        const payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
        return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

export function checkPassword(input: string | undefined | null): boolean {
    const expected = process.env.ADMIN_PASSWORD || '';
    if (!expected || !input || input.length !== expected.length) return false;
    // constant-time-ish compare
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ input.charCodeAt(i);
    return diff === 0;
}

export const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE,
};
