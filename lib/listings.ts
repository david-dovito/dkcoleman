import { getSql } from './db';

export interface Listing {
    id: number;
    slug: string;
    title: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    kind: 'sale' | 'rent';
    status: 'active' | 'pending' | 'sold' | 'rented' | 'off_market';
    price?: number;
    beds?: number;
    baths?: number;
    sqft?: number;
    lotSize?: string;
    yearBuilt?: number;
    description?: string;
    features: string[];
    photos: string[];
    featured: boolean;
    listedDate?: string;
    closedDate?: string;
}

const ACTIVE = ['active', 'pending'];

function map(r: Record<string, unknown>): Listing {
    return {
        id: Number(r.id),
        slug: String(r.slug),
        title: String(r.title),
        address: (r.address as string) ?? undefined,
        city: (r.city as string) ?? undefined,
        state: (r.state as string) ?? undefined,
        zip: (r.zip as string) ?? undefined,
        kind: r.kind as Listing['kind'],
        status: r.status as Listing['status'],
        price: r.price != null ? Number(r.price) : undefined,
        beds: r.beds != null ? Number(r.beds) : undefined,
        baths: r.baths != null ? Number(r.baths) : undefined,
        sqft: r.sqft != null ? Number(r.sqft) : undefined,
        lotSize: (r.lot_size as string) ?? undefined,
        yearBuilt: r.year_built != null ? Number(r.year_built) : undefined,
        description: (r.description as string) ?? undefined,
        features: Array.isArray(r.features) ? (r.features as string[]) : [],
        photos: Array.isArray(r.photos) ? (r.photos as string[]) : [],
        featured: Boolean(r.featured),
        listedDate: (r.listed_date as string) ?? undefined,
        closedDate: (r.closed_date as string) ?? undefined,
    };
}

export async function getListings(): Promise<{ active: Listing[]; past: Listing[] }> {
    const sql = getSql();
    if (!sql) return { active: [], past: [] };
    try {
        const rows = (await sql`
            select * from public.listings
            where published = true
            order by featured desc, coalesce(listed_date, created_at::date) desc
        `) as Record<string, unknown>[];
        const all = rows.map(map);
        return {
            active: all.filter((l) => ACTIVE.includes(l.status)),
            past: all.filter((l) => !ACTIVE.includes(l.status)),
        };
    } catch {
        return { active: [], past: [] };
    }
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
    const sql = getSql();
    if (!sql) return null;
    try {
        const rows = (await sql`select * from public.listings where slug = ${slug} and published = true limit 1`) as Record<string, unknown>[];
        return rows.length ? map(rows[0]) : null;
    } catch {
        return null;
    }
}

export function priceLabel(l: Listing): string {
    if (l.price == null) return 'Contact for price';
    const n = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(l.price);
    return l.kind === 'rent' ? `${n}/mo` : n;
}
