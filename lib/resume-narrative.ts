import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

const getNotionClient = () => {
    if (!process.env.NOTION_TOKEN || process.env.NOTION_TOKEN === 'ntn_your_integration_token_here') {
        throw new Error('NOTION_TOKEN is not defined or is a placeholder');
    }
    return new Client({ auth: process.env.NOTION_TOKEN });
};

export interface NarrativeSection {
    id: string;
    title: string;
    period: string;
    order: number;
    icon: string; // emoji or URL
    iconType: 'emoji' | 'image';
    content: string; // markdown
}

export async function getNarrativeSections(): Promise<NarrativeSection[]> {
    const databaseId = process.env.NOTION_RESUME_NARRATIVE_DATABASE_ID;
    const token = process.env.NOTION_TOKEN;

    if (!databaseId || !token || token === 'ntn_your_integration_token_here') {
        console.warn('NOTION_RESUME_NARRATIVE_DATABASE_ID not set or credentials missing');
        return [];
    }

    try {
        const notion = getNotionClient();
        const n2m = new NotionToMarkdown({ notionClient: notion });

        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'Published',
                checkbox: { equals: true },
            },
            sorts: [
                { property: 'Order', direction: 'ascending' },
            ],
        });

        const sections: NarrativeSection[] = [];

        for (const page of response.results) {
            const props = (page as any).properties;
            const pageIcon = (page as any).icon;

            const title = props.Name?.title?.[0]?.plain_text || 'Untitled';
            const period = props.Period?.rich_text?.[0]?.plain_text || '';
            const order = props.Order?.number ?? 99;

            let icon = '📌';
            let iconType: 'emoji' | 'image' = 'emoji';
            if (pageIcon?.type === 'emoji') {
                icon = pageIcon.emoji;
            } else if (pageIcon?.type === 'external') {
                icon = pageIcon.external.url;
                iconType = 'image';
            } else if (pageIcon?.type === 'file') {
                icon = pageIcon.file.url;
                iconType = 'image';
            }

            // Convert page blocks to markdown
            const mdBlocks = await n2m.pageToMarkdown(page.id);
            const mdString = n2m.toMarkdownString(mdBlocks);

            sections.push({
                id: page.id,
                title,
                period,
                order,
                icon,
                iconType,
                content: mdString.parent,
            });
        }

        return sections;
    } catch (error) {
        console.error('Error fetching narrative sections:', error);
        return [];
    }
}
