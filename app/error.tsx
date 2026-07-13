'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="container mx-auto px-4 py-24 max-w-xl text-center">
            <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-muted-foreground mt-3">
                An unexpected error occurred while loading this page. Please try again.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
                <button onClick={reset} className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium">
                    Try again
                </button>
                <a href="/" className="h-10 px-5 inline-flex items-center rounded-md border text-sm">
                    Go home
                </a>
            </div>
        </div>
    );
}
