/**
 * CMS content model. One registry drives the admin list/edit UI and the generic
 * CRUD API for every Neon-backed collection. Adding a column here surfaces it in
 * the admin form and the SQL layer - no per-collection code.
 */

export type FieldType =
    | 'text'
    | 'textarea'
    | 'markdown'
    | 'number'
    | 'boolean'
    | 'date'
    | 'tags' // string[] stored as jsonb
    | 'select'
    | 'url'
    | 'images'; // string[] of urls stored as jsonb

export interface Field {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: string[];
    help?: string;
    auto?: boolean; // computed on save, hidden from the form
}

export interface Collection {
    key: string; // url segment, e.g. "blog"
    label: string;
    table: string; // qualified table, e.g. "public.blog_posts"
    titleField: string;
    subtitleField?: string;
    orderBy: string; // sql order clause
    fields: Field[];
}

export const COLLECTIONS: Collection[] = [
    {
        key: 'blog',
        label: 'Blog posts',
        table: 'public.blog_posts',
        titleField: 'title',
        subtitleField: 'date',
        orderBy: 'featured desc, date desc',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text', required: true, help: 'URL path, e.g. the-1159-on-vision' },
            { name: 'date', label: 'Date', type: 'text', help: 'ISO date, e.g. 2025-01-14' },
            { name: 'excerpt', label: 'Excerpt', type: 'textarea' },
            { name: 'author', label: 'Author', type: 'text' },
            { name: 'tags', label: 'Tags', type: 'tags', help: 'The 1159, Faith, Growth, Business, Leadership, Life' },
            { name: 'published', label: 'Published', type: 'boolean' },
            { name: 'featured', label: 'Featured', type: 'boolean' },
            { name: 'content', label: 'Content (Markdown)', type: 'markdown' },
            { name: 'word_count', label: 'Word count', type: 'number', auto: true },
            { name: 'reading_time', label: 'Reading time', type: 'number', auto: true },
        ],
    },
    {
        key: 'listings',
        label: 'Real estate',
        table: 'public.listings',
        titleField: 'title',
        subtitleField: 'status',
        orderBy: "featured desc, coalesce(listed_date, created_at::date) desc",
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text', required: true },
            { name: 'kind', label: 'For', type: 'select', options: ['sale', 'rent'], required: true },
            { name: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'sold', 'rented', 'off_market'], required: true },
            { name: 'price', label: 'Price', type: 'number', help: 'Sale price, or monthly rent' },
            { name: 'address', label: 'Address', type: 'text' },
            { name: 'city', label: 'City', type: 'text' },
            { name: 'state', label: 'State', type: 'text' },
            { name: 'zip', label: 'Zip', type: 'text' },
            { name: 'beds', label: 'Beds', type: 'number' },
            { name: 'baths', label: 'Baths', type: 'number' },
            { name: 'sqft', label: 'Sq ft', type: 'number' },
            { name: 'lot_size', label: 'Lot size', type: 'text' },
            { name: 'year_built', label: 'Year built', type: 'number' },
            { name: 'description', label: 'Description', type: 'markdown' },
            { name: 'features', label: 'Features', type: 'tags' },
            { name: 'photos', label: 'Photos', type: 'images', help: 'Image URLs' },
            { name: 'listed_date', label: 'Listed date', type: 'date' },
            { name: 'closed_date', label: 'Closed date', type: 'date', help: 'When sold/rented (shows in history)' },
            { name: 'featured', label: 'Featured', type: 'boolean' },
            { name: 'published', label: 'Published', type: 'boolean' },
        ],
    },
    {
        key: 'projects',
        label: 'Projects',
        table: 'public.projects',
        titleField: 'name',
        orderBy: 'date desc nulls last, id desc',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'markdown' },
            { name: 'url', label: 'URL', type: 'url' },
            { name: 'tech', label: 'Tech', type: 'tags' },
            { name: 'date', label: 'Date', type: 'text' },
            { name: 'photo', label: 'Photo', type: 'url' },
            { name: 'published', label: 'Published', type: 'boolean' },
        ],
    },
    {
        key: 'resources',
        label: 'Resources',
        table: 'public.resources',
        titleField: 'name',
        orderBy: 'id desc',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'url', label: 'URL', type: 'url' },
            { name: 'categories', label: 'Categories', type: 'tags' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'published', label: 'Published', type: 'boolean' },
        ],
    },
    {
        key: 'about',
        label: 'About sections',
        table: 'public.about_sections',
        titleField: 'title',
        subtitleField: 'key',
        orderBy: '"order" asc nulls last, id asc',
        fields: [
            { name: 'key', label: 'Key', type: 'text', required: true, help: 'Stable id, e.g. intro' },
            { name: 'title', label: 'Title', type: 'text' },
            { name: 'content', label: 'Content (Markdown)', type: 'markdown' },
            { name: 'order', label: 'Order', type: 'number' },
        ],
    },
    {
        key: 'resume-narrative',
        label: 'Resume narrative',
        table: 'public.resume_narrative',
        titleField: 'title',
        subtitleField: 'period',
        orderBy: '"order" asc nulls last, id asc',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'period', label: 'Period', type: 'text' },
            { name: 'order', label: 'Order', type: 'number' },
            { name: 'icon', label: 'Icon', type: 'text' },
            { name: 'icon_type', label: 'Icon type', type: 'text' },
            { name: 'content', label: 'Content (Markdown)', type: 'markdown' },
            { name: 'published', label: 'Published', type: 'boolean' },
        ],
    },
    {
        key: 'resume',
        label: 'Resume',
        table: 'public.resume',
        titleField: 'title',
        orderBy: 'id asc',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'content', label: 'Content (Markdown)', type: 'markdown' },
        ],
    },
];

export function collection(key: string): Collection | undefined {
    return COLLECTIONS.find((c) => c.key === key);
}
