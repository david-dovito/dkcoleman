import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { CmsForm } from '@/components/admin/CmsForm';
import { collection } from '@/lib/cms/schema';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ collection: string; id: string }> }) {
    const { collection: key, id } = await params;
    const c = collection(key);
    if (!c) notFound();

    return (
        <AdminShell>
            <div className="mb-6">
                <Link href={`/admin/${c.key}`} className="text-sm text-muted-foreground hover:text-foreground">
                    ← {c.label}
                </Link>
                <h1 className="text-2xl font-semibold mt-1">{id === 'new' ? `New ${c.label.replace(/s$/, '')}` : `Edit ${c.label.replace(/s$/, '')}`}</h1>
            </div>
            <CmsForm collectionKey={c.key} id={id} />
        </AdminShell>
    );
}
