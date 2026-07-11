'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, Field } from '@/lib/cms/schema';

const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm';

function initialValue(f: Field): unknown {
    if (f.type === 'boolean') return false;
    if (f.type === 'tags' || f.type === 'images') return '';
    return '';
}

export function CmsForm({ collectionKey, id }: { collectionKey: string; id: string }) {
    const c = collection(collectionKey);
    const router = useRouter();
    const isNew = id === 'new';
    const [values, setValues] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!c) return;
        if (isNew) {
            const init: Record<string, unknown> = {};
            c.fields.filter((f) => !f.auto).forEach((f) => (init[f.name] = initialValue(f)));
            setValues(init);
            return;
        }
        fetch(`/api/admin/${collectionKey}/${id}`)
            .then((r) => r.json())
            .then(({ row }) => {
                const v: Record<string, unknown> = {};
                c.fields.filter((f) => !f.auto).forEach((f) => {
                    const raw = row?.[f.name];
                    v[f.name] = Array.isArray(raw) ? raw.join(', ') : raw ?? initialValue(f);
                });
                setValues(v);
                setLoading(false);
            });
    }, [collectionKey, id, isNew, c]);

    if (!c) return <p>Unknown collection.</p>;
    if (loading) return <p className="text-muted-foreground">Loading…</p>;

    const set = (name: string, val: unknown) => setValues((v) => ({ ...v, [name]: val }));

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');
        const res = await fetch(isNew ? `/api/admin/${collectionKey}` : `/api/admin/${collectionKey}/${id}`, {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        setSaving(false);
        if (res.ok) {
            router.push(`/admin/${collectionKey}`);
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error || 'Save failed');
        }
    }

    async function remove() {
        if (!confirm('Delete this item?')) return;
        await fetch(`/api/admin/${collectionKey}/${id}`, { method: 'DELETE' });
        router.push(`/admin/${collectionKey}`);
        router.refresh();
    }

    return (
        <form onSubmit={save} className="space-y-5">
            {c.fields
                .filter((f) => !f.auto)
                .map((f) => (
                    <div key={f.name} className="space-y-1.5">
                        <label className="text-sm font-medium">{f.label}{f.required && ' *'}</label>
                        {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
                        {f.type === 'boolean' ? (
                            <input type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="h-4 w-4" />
                        ) : f.type === 'markdown' || f.type === 'textarea' ? (
                            <textarea value={String(values[f.name] ?? '')} onChange={(e) => set(f.name, e.target.value)} rows={f.type === 'markdown' ? 14 : 3} className={inputCls + ' font-mono'} />
                        ) : f.type === 'select' ? (
                            <select value={String(values[f.name] ?? '')} onChange={(e) => set(f.name, e.target.value)} className={inputCls}>
                                <option value="">- select -</option>
                                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        ) : (
                            <input
                                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                step={f.type === 'number' ? 'any' : undefined}
                                value={String(values[f.name] ?? '')}
                                onChange={(e) => set(f.name, e.target.value)}
                                className={inputCls}
                            />
                        )}
                    </div>
                ))}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                    {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
                </button>
                {!isNew && (
                    <button type="button" onClick={remove} className="h-9 px-4 rounded-md border text-sm text-red-500">
                        Delete
                    </button>
                )}
            </div>
        </form>
    );
}
