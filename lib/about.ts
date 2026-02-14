import { Client } from '@notionhq/client';

const getNotionClient = () => {
    if (!process.env.NOTION_TOKEN || process.env.NOTION_TOKEN === 'ntn_your_integration_token_here') {
        throw new Error('NOTION_TOKEN is not defined or is a placeholder');
    }
    return new Client({ auth: process.env.NOTION_TOKEN });
};

export interface AboutData {
    introduction: string;
    whatIDo: string;
    thisWebsite: string;
    the1159: string;
}

const SAMPLE_DATA: AboutData = {
    introduction: "Hey! I'm David. As a young, Christian, business owner and aspiring investor, I'm passionate about seeing the next generation lead well. You are loved, and you can do it. Take reading this as a sign to keep going!",
    whatIDo: "I'm passionate about encouraging today's young professionals. Whether it's starting a career, launching a business, growing a brand, or just making a life — my heart is to encourage you on your journey.",
    thisWebsite: "This is a statically-exported Next.js site that pulls all its content from a headless Notion CMS via API at build time — no server, no runtime dependencies, just pre-rendered HTML served from GitHub Pages. The animated background is a custom WebGL fragment shader running a CPPN neural network, and yes, it was built oftentimes with AI.",
    the1159: '',
};

const NAME_TO_KEY: Record<string, keyof AboutData> = {
    'Introduction': 'introduction',
    'What I do': 'whatIDo',
    'What I Do': 'whatIDo',
    'This Website': 'thisWebsite',
    'The 1159': 'the1159',
};

/** Extract plain text from all paragraph blocks in a Notion page */
async function getPageBlockText(notion: Client, pageId: string): Promise<string> {
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    const paragraphs: string[] = [];

    for (const block of blocks.results as any[]) {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
            const text = block.paragraph.rich_text.map((rt: any) => rt.plain_text).join('');
            if (text.trim()) paragraphs.push(text.trim());
        }
    }

    return paragraphs.join('\n\n');
}

export async function getAboutSections(): Promise<AboutData> {
    const databaseId = process.env.NOTION_ABOUT_DATABASE_ID;
    const token = process.env.NOTION_TOKEN;

    if (!databaseId || !token || token === 'ntn_your_integration_token_here') {
        console.warn('NOTION_ABOUT_DATABASE_ID not set or credentials missing, returning sample data');
        return SAMPLE_DATA;
    }

    try {
        const notion = getNotionClient();
        const response = await notion.databases.query({ database_id: databaseId });

        const data: AboutData = { ...SAMPLE_DATA };

        for (const page of response.results) {
            const props = (page as any).properties;
            const name = props.Name?.title?.[0]?.plain_text || '';
            const key = NAME_TO_KEY[name];
            if (!key) continue;

            // Try Text property first, then fall back to page block content
            const propText = props.Text?.rich_text?.[0]?.plain_text || '';
            if (propText) {
                data[key] = propText;
            } else {
                const blockText = await getPageBlockText(notion, page.id);
                if (blockText) data[key] = blockText;
            }
        }

        return data;
    } catch (error) {
        console.error('Error fetching about sections:', error);
        return SAMPLE_DATA;
    }
}
