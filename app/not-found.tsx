import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="container mx-auto px-4 py-24 max-w-xl text-center">
            <p className="text-sm font-medium text-fern-600">404</p>
            <h1 className="text-3xl font-bold tracking-tight mt-2">Page not found</h1>
            <p className="text-muted-foreground mt-3">
                The page you are looking for does not exist or may have moved.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
                <Link href="/" className="h-10 px-5 inline-flex items-center rounded-md bg-primary text-primary-foreground text-sm font-medium">
                    Go home
                </Link>
                <Link href="/blog" className="h-10 px-5 inline-flex items-center rounded-md border text-sm">
                    Read the blog
                </Link>
            </div>
        </div>
    );
}
