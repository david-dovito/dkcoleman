/**
 * Public paths to revalidate after a CMS mutation, so edits appear immediately
 * instead of waiting for the next timed revalidation or a redeploy.
 */
export function revalidateForCollection(key: string, row?: Record<string, unknown>): string[] {
    const slug = row && typeof row.slug === 'string' ? row.slug : null;
    switch (key) {
        case 'blog':
            return ['/', '/blog', ...(slug ? [`/blog/${slug}`] : [])];
        case 'listings':
            return ['/real-estate', ...(slug ? [`/real-estate/${slug}`] : [])];
        case 'projects':
            return ['/projects'];
        case 'resources':
            return ['/resources'];
        case 'resume':
        case 'resume-narrative':
            return ['/resume'];
        case 'about':
            return ['/about'];
        default:
            return [];
    }
}
