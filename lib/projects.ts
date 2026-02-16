import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';

const getNotionClient = () => {
    if (!process.env.NOTION_TOKEN || process.env.NOTION_TOKEN === 'ntn_your_integration_token_here') {
        throw new Error('NOTION_TOKEN is not defined or is a placeholder');
    }
    return new Client({ auth: process.env.NOTION_TOKEN });
};

/**
 * Download a Notion-hosted image to public/project-images/ at build time.
 * Notion file URLs are temporary (~1hr), so we must persist them locally.
 */
async function downloadNotionImage(url: string, pageId: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) return '';
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.includes('png') ? 'png'
            : contentType.includes('webp') ? 'webp'
            : 'jpg';

        const dir = path.join(process.cwd(), 'public', 'project-images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filename = `${pageId.replace(/-/g, '')}.${ext}`;
        fs.writeFileSync(path.join(dir, filename), buffer);
        return `/project-images/${filename}`;
    } catch (error) {
        console.error('Error downloading project image:', error);
        return '';
    }
}

export interface Project {
    id: string;
    name: string;
    description: string;
    url: string;
    tech: string[];
    date: string;
    published: boolean;
    photo: string;
}

export async function getPublishedProjects(): Promise<Project[]> {
    const databaseId = process.env.NOTION_PROJECTS_DATABASE_ID;
    const token = process.env.NOTION_TOKEN;

    // Check for valid credentials before attempting to connect
    if (!databaseId || databaseId.includes('your_projects_database_id') || !token || token === 'ntn_your_integration_token_here') {
        console.warn('NOTION_PROJECTS_DATABASE_ID not set or is a placeholder, returning sample data');
        return [
            {
                id: 'sample-1',
                name: 'Sample Project',
                description: 'This is a sample project.',
                url: 'https://example.com',
                tech: ['React', 'Next.js', 'Tailwind'],
                date: new Date().toISOString(),
                published: true,
                photo: ''
            }
        ];
    }

    try {
        const notion = getNotionClient();
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'Published',
                checkbox: { equals: true }
            },
        });

        const projects: Project[] = [];
        for (const page of response.results) {
            const props = (page as any).properties;
            const photoFiles = props.Photo?.files || [];
            let photo = '';
            if (photoFiles.length > 0) {
                const file = photoFiles[0];
                if (file.type === 'external') {
                    photo = file.external?.url || '';
                } else if (file.type === 'file') {
                    // Download Notion-hosted file to local public/ dir
                    photo = await downloadNotionImage(file.file?.url || '', page.id);
                }
            }
            projects.push({
                id: page.id,
                name: props.Name?.title?.[0]?.plain_text || 'Untitled',
                description: props.Description?.rich_text?.[0]?.plain_text || '',
                url: props.URL?.url || '',
                tech: props.Category?.select ? [props.Category.select.name] : [],
                date: '',
                published: props.Published?.checkbox || false,
                photo
            });
        }
        return projects;
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}
