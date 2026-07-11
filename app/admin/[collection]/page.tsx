import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { collection } from '@/lib/cms/schema';
import { listRows } from '@/lib/cms/db';

export const dynamic = 'force-dynamic';

export default async function CollectionListPage({ params }: { params: Promise<{ collection: string }> }) {
    const { collection: key } = await params;
    const c = collection(key);
    if (!c) notFound();

    const rows = await listRows(c).catch(() => []);

    return (
        <AdminShell>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">{c.label}</h1>
                <Link href={`/admin/${c.key}/new`} className="h-9 px-4 inline-flex items-center rounded-md bg-primary text-primary-foreground text-sm font-medium">
                    New
                </Link>
            </div>
            <div className="border rounded-xl divide-y">
                {rows.length === 0 && <div className="p-4 text-sm text-muted-foreground">Nothing here yet.</div>}
                {rows.map((row) => (
                    <Link
                        key={String(row.id)}
                        href={`/admin/${c.key}/${row.id}`}
                        className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                    >
                        <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{String(row[c.titleField] ?? 'Untitled')}</div>
                            {c.subtitleField && (
                                <div className="text-xs text-muted-foreground truncate">{String(row[c.subtitleField] ?? '')}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {'published' in row && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${row.published ? 'bg-green-500/15 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                                    {row.published ? 'published' : 'draft'}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </AdminShell>
    );
}
