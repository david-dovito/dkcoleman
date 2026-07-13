export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded bg-muted/70 animate-pulse mt-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border rounded-xl overflow-hidden">
                        <div className="aspect-[3/2] bg-muted animate-pulse" />
                        <div className="p-4 space-y-2">
                            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                            <div className="h-3 w-40 rounded bg-muted/70 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
