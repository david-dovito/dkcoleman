import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail, MapPin } from 'lucide-react';
import { getListingBySlug, priceLabel } from '@/lib/listings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const l = await getListingBySlug(slug);
    if (!l) return { title: 'Listing not found' };
    const where = [l.city, l.state].filter(Boolean).join(', ');
    const title = `${l.title}${where ? ` - ${where}` : ''}`;
    const description = `${priceLabel(l)}${l.beds != null ? ` - ${l.beds} bd` : ''}${l.baths != null ? ` / ${l.baths} ba` : ''}${l.sqft != null ? ` / ${l.sqft.toLocaleString()} sqft` : ''}. ${(l.description || '').slice(0, 140)}`.trim();
    const url = `https://dkcoleman.com/real-estate/${slug}`;
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: 'website', images: l.photos?.length ? [l.photos[0]] : undefined },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default async function ListingDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const l = await getListingBySlug(slug);
    if (!l) notFound();

    const loc = [l.address, [l.city, l.state].filter(Boolean).join(', '), l.zip].filter(Boolean).join(' · ');
    const isPast = !['active', 'pending'].includes(l.status);

    const listingUrl = `https://dkcoleman.com/real-estate/${slug}`;
    const mailtoHref = `mailto:david@dovito.com?subject=${encodeURIComponent(`Inquiry: ${l.title}`)}&body=${encodeURIComponent(`I'm interested in ${l.title} (${listingUrl}).`)}`;
    const fullAddress = [l.address, l.city, l.state, l.zip].filter(Boolean).join(', ');
    const mapHref = l.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
        : null;

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <Link href="/real-estate" className="text-sm text-muted-foreground hover:text-foreground">← Real Estate</Link>

            <div className="mt-4 flex items-center gap-3">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize">
                    {isPast ? l.status : l.kind === 'rent' ? 'For rent' : 'For sale'}
                </span>
                {l.featured && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">Featured</span>}
            </div>

            <h1 className="text-3xl font-bold tracking-tight mt-2">{l.title}</h1>
            <div className="text-xl font-semibold mt-1">{priceLabel(l)}</div>
            {loc && <div className="text-muted-foreground mt-1">{loc}</div>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                    href={mailtoHref}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                    <Mail className="h-4 w-4" />
                    Inquire about this property
                </a>
                {mapHref && (
                    <a
                        href={mapHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted"
                    >
                        <MapPin className="h-4 w-4" />
                        View on map
                    </a>
                )}
            </div>

            {l.photos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    {l.photos.map((p, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={p} alt={`${l.title} photo ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" className="w-full rounded-xl border object-cover" />
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-6 text-sm">
                {l.beds != null && <div><span className="text-muted-foreground">Beds</span> {l.beds}</div>}
                {l.baths != null && <div><span className="text-muted-foreground">Baths</span> {l.baths}</div>}
                {l.sqft != null && <div><span className="text-muted-foreground">Sq ft</span> {l.sqft.toLocaleString()}</div>}
                {l.lotSize && <div><span className="text-muted-foreground">Lot</span> {l.lotSize}</div>}
                {l.yearBuilt != null && <div><span className="text-muted-foreground">Built</span> {l.yearBuilt}</div>}
            </div>

            {l.description && <p className="mt-6 whitespace-pre-wrap leading-relaxed">{l.description}</p>}

            {l.features.length > 0 && (
                <div className="mt-6">
                    <h2 className="font-semibold mb-2">Features</h2>
                    <ul className="flex flex-wrap gap-2">
                        {l.features.map((f) => (
                            <li key={f} className="text-xs px-2.5 py-1 rounded-full border">{f}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
