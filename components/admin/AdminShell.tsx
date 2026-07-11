'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { COLLECTIONS } from '@/lib/cms/schema';

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    async function logout() {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    }

    const isActive = (href: string) =>
        href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

    return (
        <div className="min-h-screen flex">
            <aside className="w-56 shrink-0 border-r p-4 flex flex-col gap-1">
                <Link href="/admin" className="font-semibold text-lg mb-3 px-2">
                    CMS
                </Link>
                <Link
                    href="/admin"
                    className={`px-2 py-1.5 rounded-md text-sm ${pathname === '/admin' ? 'bg-accent font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Dashboard
                </Link>
                <div className="mt-2 mb-1 px-2 text-xs uppercase tracking-wide text-muted-foreground">Content</div>
                {COLLECTIONS.map((c) => (
                    <Link
                        key={c.key}
                        href={`/admin/${c.key}`}
                        className={`px-2 py-1.5 rounded-md text-sm ${isActive(`/admin/${c.key}`) ? 'bg-accent font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {c.label}
                    </Link>
                ))}
                <div className="mt-auto pt-4 flex flex-col gap-1">
                    <Link href="/" className="px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground">
                        View site
                    </Link>
                    <button onClick={logout} className="px-2 py-1.5 rounded-md text-sm text-left text-muted-foreground hover:text-foreground">
                        Log out
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-6 md:p-10 max-w-4xl">{children}</main>
        </div>
    );
}
