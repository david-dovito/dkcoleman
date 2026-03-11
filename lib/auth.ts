import { NextRequest, NextResponse } from 'next/server';

// JWT implementation mirrored from worker/index.ts (lines 300-350)

function btoaUrl(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function atobUrl(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoaUrl(String.fromCharCode(...new Uint8Array(signature)));
}

export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 7; // 7 days

  const encodedHeader = btoaUrl(JSON.stringify(header));
  const encodedPayload = btoaUrl(JSON.stringify({ ...payload, exp }));
  const signature = await createSignature(encodedHeader + '.' + encodedPayload, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const computedSignature = await createSignature(header + '.' + payload, secret);

  if (signature !== computedSignature) return null;

  const decodedPayload = JSON.parse(atobUrl(payload));
  if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;

  return decodedPayload;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return request.cookies.get('admin_token')?.value ?? null;
}

export async function requireAuth(request: NextRequest): Promise<Record<string, unknown> | NextResponse> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  const payload = await verifyJwt(token, secret);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  return payload;
}
