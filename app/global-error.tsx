'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="en">
            <body style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>A critical error occurred. Please try again.</p>
                    <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}>
                        Try again
                    </button>
                    {error.digest && <p style={{ color: '#999', fontSize: 12, marginTop: '1rem' }}>Ref: {error.digest}</p>}
                </div>
            </body>
        </html>
    );
}
