import { Client } from '@notionhq/client';

const getNotionClient = () => {
    if (!process.env.NOTION_TOKEN || process.env.NOTION_TOKEN === 'ntn_your_integration_token_here') {
        throw new Error('NOTION_TOKEN is not defined or is a placeholder');
    }
    return new Client({ auth: process.env.NOTION_TOKEN });
};

export interface AboutSection {
    id: string;
    name: string;
    text: string;
}

export interface AboutData {
    introduction: string;
    whatIDo: string;
    thisWebsite: string;
    the1159: string;
}

const SAMPLE_DATA: AboutData = {
    introduction: "Hey! I'm David. As a young, Christian, business owner and aspiring investor, I'm passionate about seeing the next generation lead well. You are loved, and you can do it. Take reading this as a sign to keep going!",
    whatIDo: "I'm passionate about encouraging today's young professionals. Whether it's starting a career, launching a business, growing a brand, or just making a life — my heart is to encourage you on your journey.",
    thisWebsite: "Built primarily with AI (Google Gemini & Claude Sonnet), this site reflects my interest in rapid development. It's hosted on GitHub Pages and powered by a custom Notion integration for content management. Visit my GitHub to learn more.",
    the1159: '',
};

// Map database entry names to AboutData keys
const NAME_TO_KEY: Record<string, keyof AboutData> = {
    'Introduction': 'introduction',
    'What I do': 'whatIDo',
    'What I Do': 'whatIDo',
    'This Website': 'thisWebsite',
    'The 1159': 'the1159',
};

export async function getAboutSections(): Promise<AboutData> {
    const databaseId = process.env.NOTION_ABOUT_DATABASE_ID;
    const token = process.env.NOTION_TOKEN;

    // Check for valid credentials before attempting to connect
    if (!databaseId || !token || token === 'ntn_your_integration_token_here') {
        console.warn('NOTION_ABOUT_DATABASE_ID not set or credentials missing, returning sample data');
        return SAMPLE_DATA;
    }

    try {
        const notion = getNotionClient();
        const response = await notion.databases.query({
            database_id: databaseId,
        });

        const data: AboutData = { ...SAMPLE_DATA };

        for (const page of response.results) {
            const props = (page as any).properties;
            const name = props.Name?.title?.[0]?.plain_text || '';
            const text = props.Text?.rich_text?.[0]?.plain_text || '';

            const key = NAME_TO_KEY[name];
            if (key && text) {
                data[key] = text;
            }
        }

        return data;
    } catch (error) {
        console.error('Error fetching about sections:', error);
        return SAMPLE_DATA;
    }
}
