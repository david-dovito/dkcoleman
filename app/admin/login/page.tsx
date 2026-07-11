'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        setLoading(false);
        if (res.ok) {
            router.push(params.get('next') || '/admin');
            router.refresh();
        } else {
            setError('Incorrect password');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <form onSubmit={submit} className="w-full max-w-sm space-y-4 border rounded-xl p-8">
                <div>
                    <h1 className="text-xl font-semibold">Admin</h1>
                    <p className="text-sm text-muted-foreground">Sign in to manage content.</p>
                </div>
                <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-10 px-3 rounded-md border bg-background"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
