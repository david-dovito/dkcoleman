import Link from 'next/link';
import { getListings, priceLabel, Listing } from '@/lib/listings';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Real Estate | David Coleman',
    description: 'Properties for sale and rent, plus recently closed.',
};

function stat(l: Listing) {
    const parts: string[] = [];
    if (l.beds != null) parts.push(`${l.beds} bd`);
    if (l.baths != null) parts.push(`${l.baths} ba`);
    if (l.sqft != null) parts.push(`${l.sqft.toLocaleString()} sqft`);
    return parts.join(' · ');
}

function ListingCard({ l, past = false }: { l: Listing; past?: boolean }) {
    const loc = [l.city, l.state].filter(Boolean).join(', ');
    return (
        <Link href={`/real-estate/${l.slug}`} className="group block border rounded-xl overflow-hidden hover:border-foreground/30 transition-colors">
            <div className="aspect-[3/2] bg-muted relative overflow-hidden">
                {l.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photos[0]} alt={l.title} loading="lazy" decoding="async" className={`h-full w-full object-cover ${past ? 'grayscale opacity-80' : ''}`} />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No photo</div>
                )}
                <span className="absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-background/90 border capitalize">
                    {past ? l.status : l.kind === 'rent' ? 'For rent' : 'For sale'}
                </span>
            </div>
            <div className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold">{priceLabel(l)}</div>
                    {stat(l) && <div className="text-xs text-muted-foreground">{stat(l)}</div>}
                </div>
                <div className="text-sm mt-1 truncate">{l.title}</div>
                {loc && <div className="text-xs text-muted-foreground truncate">{loc}</div>}
            </div>
        </Link>
    );
}

export default async function RealEstatePage() {
    const { active, past } = await getListings();

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <h1 className="text-4xl font-bold tracking-tight">Real Estate</h1>
            <p className="text-muted-foreground mt-2">Properties for sale and rent, plus a look back at what's closed.</p>

            <section className="mt-10">
                <h2 className="text-lg font-semibold mb-4">Available now</h2>
                {active.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active listings at the moment. Check back soon.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {active.map((l) => <ListingCard key={l.id} l={l} />)}
                    </div>
                )}
            </section>

            {past.length > 0 && (
                <section className="mt-14">
                    <h2 className="text-lg font-semibold mb-1">History</h2>
                    <p className="text-sm text-muted-foreground mb-4">Previously sold and rented properties.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {past.map((l) => <ListingCard key={l.id} l={l} past />)}
                    </div>
                </section>
            )}
        </div>
    );
}
