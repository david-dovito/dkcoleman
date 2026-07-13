import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifySessionToken } from './auth';

/**
 * Defense-in-depth: re-verify the admin session inside each route handler,
 * rather than trusting the middleware gate alone. A middleware misconfiguration
 * then cannot expose the DB write path.
 */
export async function isAdmin(): Promise<boolean> {
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    return verifySessionToken(token);
}
