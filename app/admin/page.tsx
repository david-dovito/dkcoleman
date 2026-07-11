import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { COLLECTIONS } from '@/lib/cms/schema';
import { countRows } from '@/lib/cms/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const counts = await Promise.all(
        COLLECTIONS.map(async (c) => ({ c, n: await countRows(c).catch(() => 0) })),
    );

    return (
        <AdminShell>
            <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground mb-6">Manage all site content. Everything is stored in Neon.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {counts.map(({ c, n }) => (
                    <Link key={c.key} href={`/admin/${c.key}`} className="border rounded-xl p-4 hover:border-foreground/30 transition-colors">
                        <div className="text-2xl font-semibold">{n}</div>
                        <div className="text-sm text-muted-foreground">{c.label}</div>
                    </Link>
                ))}
            </div>
        </AdminShell>
    );
}
