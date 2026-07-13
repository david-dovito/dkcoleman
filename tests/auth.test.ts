import { describe, it, expect, beforeAll } from 'vitest';

// The signer reads ADMIN_SECRET at call time; set it before importing.
beforeAll(() => {
    process.env.ADMIN_SECRET = 'test-secret-value-do-not-use-in-prod';
});

describe('admin session tokens', () => {
    it('round-trips a valid token', async () => {
        const { createSessionToken, verifySessionToken } = await import('@/lib/auth');
        const token = await createSessionToken();
        expect(await verifySessionToken(token)).toBe(true);
    });

    it('rejects a tampered token', async () => {
        const { createSessionToken, verifySessionToken } = await import('@/lib/auth');
        const token = await createSessionToken();
        const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');
        expect(await verifySessionToken(tampered)).toBe(false);
    });

    it('rejects empty / malformed tokens', async () => {
        const { verifySessionToken } = await import('@/lib/auth');
        expect(await verifySessionToken('')).toBe(false);
        expect(await verifySessionToken('not-a-token')).toBe(false);
        expect(await verifySessionToken(undefined)).toBe(false);
    });

    it('checkPassword is exact-match and length-safe', async () => {
        process.env.ADMIN_PASSWORD = 'hunter2hunter2';
        const { checkPassword } = await import('@/lib/auth');
        expect(checkPassword('hunter2hunter2')).toBe(true);
        expect(checkPassword('wrong')).toBe(false);
        expect(checkPassword('hunter2hunter3')).toBe(false);
        expect(checkPassword('')).toBe(false);
    });
});
