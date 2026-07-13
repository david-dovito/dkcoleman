import { getSql } from './db';

/**
 * Fixed-window rate limiter backed by the Neon `public.rate_limits` table (no
 * external service needed). Returns whether the call is allowed. Fails open if
 * the DB is unreachable so a DB blip can't lock out the admin entirely.
 */
export async function rateLimit(
    key: string,
    max: number,
    windowSeconds: number,
): Promise<{ ok: boolean; count: number }> {
    const sql = getSql();
    if (!sql) return { ok: true, count: 0 };
    try {
        const rows = (await sql`
            insert into public.rate_limits (key, count, window_start)
            values (${key}, 1, now())
            on conflict (key) do update set
                count = case
                    when public.rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
                    then 1 else public.rate_limits.count + 1 end,
                window_start = case
                    when public.rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
                    then now() else public.rate_limits.window_start end
            returning count
        `) as { count: number }[];
        const count = Number(rows[0]?.count ?? 1);
        return { ok: count <= max, count };
    } catch {
        return { ok: true, count: 0 };
    }
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
    const h = req.headers;
    return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim();
}
