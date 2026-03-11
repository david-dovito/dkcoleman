# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is David Coleman's personal website built with Next.js 16 (App Router) as a static site. It features:

- **Blog** - Notion-powered blog with markdown rendering
- **Resume** - Professional resume/CV from Notion
- **Resource Library** - Curated links to websites and resources from Notion

The site is deployed to GitHub Pages at `https://dkcoleman.github.io/dkcoleman/`.

## Development Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build static site (outputs to out/)
npm run start    # Start production server (for testing build)
npm run lint     # Run ESLint
```

### Environment Setup

Create `.env.local` in the root directory with:

```env
# Notion integration token (starts with "ntn_")
NOTION_TOKEN=ntn_your_integration_token_here

# Blog database ID
NOTION_DATABASE_ID=your_blog_database_id_32_characters

# Resources database ID (separate database)
NOTION_RESOURCES_DATABASE_ID=your_resources_database_id_32_chars

# Resume page ID
NOTION_RESUME_PAGE_ID=your_resume_page_id_32_characters
```

**Important**: Notion tokens start with `ntn_`, not `secret_`. The code validates for placeholder values to gracefully fall back to sample data during development.

## Architecture

### Next.js Configuration

- **Output**: Static export (`output: 'export'`)
- **Base Path**: `/dkcoleman` in production (GitHub Pages subpath)
- **Images**: Unoptimized (required for static export)
- **Trailing Slash**: Enabled for better compatibility

### Content Management Architecture

Uses a **two-layer adapter pattern** for all Notion content:

1. **lib/notion.ts** - Direct Notion API integration for blog posts
2. **lib/blog.ts** - Thin adapter for blog data
3. **lib/resources.ts** - Adapter for Resources database
4. **lib/resume.ts** - Adapter for Resume page

#### Credential Validation Pattern

All Notion data-fetching functions validate credentials BEFORE calling `getNotionClient()`:

```typescript
export async function getPublishedPosts(): Promise<NotionPost[]> {
    const databaseId = getDatabaseId();
    const token = process.env.NOTION_TOKEN;

    // Validate credentials before attempting connection
    if (!databaseId || !token || token === 'ntn_your_integration_token_here') {
        console.warn('Returning sample data because Notion credentials are not configured');
        return [/* sample data */];
    }

    try {
        const notion = getNotionClient();
        // ... API call
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [/* sample data */];
    }
}
```

This pattern enables graceful degradation with sample data during development.

### Notion Data Sources

#### Blog Database

- Database ID: `your_blog_database_id_32_characters`
- Properties: Title, Slug, Date, Tags, Published, Featured, Excerpt, Author

#### Resources Database (separate database)

- Database ID: `your_resources_database_id_32_chars`
- Properties: Name, URL, Category, Description, Published

#### Resume Page

- Page ID: `your_resume_page_id_32_characters`
- Content: Markdown blocks to be converted

> **Important**: These are three separate Notion data sources. Blog and Resources are separate databases (not the same database with different views).

### Component Organization

- **components/ui/** - shadcn/ui + ReactBits components
  - `dark-veil.tsx` - WebGL background animation using OGL library
- **components/** - Custom components
- **app/** - Next.js App Router pages
- **worker/** - Cloudflare Worker for Admin Authentication & API

### Styling System

- **Tailwind CSS** with CSS variables for theming
- **Dark mode**: `next-themes` with class-based toggle
- **Component library**: shadcn/ui (New York style) + ReactBits registry
- **Frosted Glass Effect**: `bg-background/40 backdrop-blur-xl` for semi-transparent cards over Dark Veil

### Dark Veil Background Component

The home page uses a WebGL-based animated background (Dark Veil from ReactBits):

#### Key Implementation Details

- Canvas must use `position: fixed` with explicit `100vw/100vh` sizing
- Set `zIndex: -1` to keep background behind content
- Use `window.innerWidth` and `window.innerHeight` for resize calculations (not parent dimensions)
- Add `overflow-x: hidden` to html/body in globals.css to prevent cutoff
- Render directly without wrapper divs to avoid positioning conflicts
- The `resolutionScale` prop only affects render quality, not visual size

#### Example Usage

```typescript
<DarkVeil hueShift={40} speed={0.5} resolutionScale={0.8} />
```

#### Bento Cards Over Dark Veil

Use frosted glass transparency to show background colors:

```typescript
className="bg-background/40 backdrop-blur-xl border border-border/30"
```

---

## IMPLEMENTATION PLANS

The following plans should be executed by an AI model (Claude Sonnet or similar) to update this site.

---

## PLAN 1: Health Check & Optimization

### Findings

#### Current State Assessment

- File structure is clean and minimal
- Dependencies are appropriate for the project
- No major bloat or unnecessary files

#### Issues Identified

1. **Unused Dependency**: `gray-matter` package in dependencies may be unused (was for markdown frontmatter before Notion migration)

2. **Script Not Runnable**: `scripts/generate-icons.js` requires `sharp` but it's not in dependencies (icons already generated, script can be removed)

3. **Documentation Redundancy**: Multiple setup docs (GOOGLE_ANALYTICS_SETUP.md, NOTION_SETUP.md, REFRESH_SETUP.md) could be consolidated into README.md

4. **Dead API Route**: `app/api/refresh-posts/route.ts` doesn't work on GitHub Pages (static export)

5. **Theme Toggle Missing**: No theme toggle button in the layout header

### Cleanup Actions

Execute these steps in order:

#### Step 1: Remove Unused Dependencies

```bash
npm uninstall gray-matter
```

#### Step 2: Remove Unused Files

- Delete `scripts/generate-icons.js`
- Delete `scripts/` directory (empty after removal)
- Delete `app/api/refresh-posts/route.ts`
- Delete `app/api/` directory (empty after removal)

#### Step 3: Consolidate Documentation

- Move essential content from GOOGLE_ANALYTICS_SETUP.md, NOTION_SETUP.md, REFRESH_SETUP.md into README.md under appropriate sections
- Delete the individual setup files

#### Step 4: Verify Build

```bash
npm run build
npm run lint
```

---

## PLAN 2: Magic Bento Home Page Implementation

### Overview

Transform the home page into an interactive Magic Bento grid layout that serves as an information hub for David Coleman's personal website with tiles for:

1. **Hero/Introduction** - Name, tagline, brief intro
2. **Blog** - Latest posts preview
3. **Resume** - Professional summary with link
4. **Resources** - Featured resources preview

### Prerequisites

**Install GSAP** (required by MagicBento):

```bash
npm install gsap
```

**Install MagicBento Component**:

```bash
npx shadcn@latest add @react-bits/MagicBento-TS-TW
```

### Implementation Steps

#### Step 1: Create Resources Data Layer

Create `lib/resources.ts`:

```typescript
import { Client } from '@notionhq/client';

const getNotionClient = () => {
    if (!process.env.NOTION_TOKEN) {
        throw new Error('NOTION_TOKEN is not defined');
    }
    return new Client({ auth: process.env.NOTION_TOKEN });
};

export interface Resource {
    id: string;
    name: string;
    url: string;
    category: string;
    description: string;
    published: boolean;
}

export async function getPublishedResources(): Promise<Resource[]> {
    const databaseId = process.env.NOTION_RESOURCES_DATABASE_ID;
    if (!databaseId) {
        console.warn('NOTION_RESOURCES_DATABASE_ID not set, returning sample data');
        return [
            {
                id: 'sample-1',
                name: 'Sample Resource',
                url: 'https://example.com',
                category: 'Sample',
                description: 'This is a sample resource.',
                published: true
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
            }
        });

        return response.results.map((page: any) => ({
            id: page.id,
            name: page.properties.Name?.title?.[0]?.plain_text || 'Untitled',
            url: page.properties.URL?.url || '',
            category: page.properties.Category?.select?.name || 'Uncategorized',
            description: page.properties.Description?.rich_text?.[0]?.plain_text || '',
            published: page.properties.Published?.checkbox || false
        }));
    } catch (error) {
        console.error('Error fetching resources:', error);
        return [];
    }
}

export async function getResourcesByCategory(): Promise<Record<string, Resource[]>> {
    const resources = await getPublishedResources();
    return resources.reduce((acc, resource) => {
        const category = resource.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(resource);
        return acc;
    }, {} as Record<string, Resource[]>);
}
```

#### Step 2: Create Resume Data Layer

Create `lib/resume.ts`:

```typescript
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

const getNotionClient = () => {
    if (!process.env.NOTION_TOKEN) {
        throw new Error('NOTION_TOKEN is not defined');
    }
    return new Client({ auth: process.env.NOTION_TOKEN });
};

export interface Resume {
    title: string;
    content: string;
    lastUpdated: string;
}

export async function getResume(): Promise<Resume | null> {
    const pageId = process.env.NOTION_RESUME_PAGE_ID;
    if (!pageId) {
        console.warn('NOTION_RESUME_PAGE_ID not set');
        return {
            title: 'Resume',
            content: '# Resume\n\nResume content will appear here once configured.',
            lastUpdated: new Date().toISOString()
        };
    }

    try {
        const notion = getNotionClient();
        const n2m = new NotionToMarkdown({ notionClient: notion });

        const page = await notion.pages.retrieve({ page_id: pageId }) as any;
        const mdblocks = await n2m.pageToMarkdown(pageId);
        const mdString = n2m.toMarkdownString(mdblocks);

        return {
            title: page.properties?.title?.title?.[0]?.plain_text || 'Resume',
            content: mdString.parent,
            lastUpdated: page.last_edited_time
        };
    } catch (error) {
        console.error('Error fetching resume:', error);
        return null;
    }
}
```

#### Step 3: Create New Pages

**Create `app/resources/page.tsx`**:

```typescript
import { getResourcesByCategory } from '@/lib/resources';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export default async function ResourcesPage() {
    const resourcesByCategory = await getResourcesByCategory();
    const categories = Object.keys(resourcesByCategory).sort();

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 tracking-tight">Resources</h1>
            <p className="text-lg text-muted-foreground mb-12">
                A curated collection of useful websites, tools, and resources.
            </p>

            {categories.map(category => (
                <section key={category} className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6">{category}</h2>
                    <div className="grid gap-4">
                        {resourcesByCategory[category].map(resource => (
                            <Link
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 border rounded-lg hover:bg-accent transition-colors group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-medium group-hover:text-primary transition-colors">
                                            {resource.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {resource.description}
                                        </p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
```

**Create `app/resume/page.tsx`**:

```typescript
import { getResume } from '@/lib/resume';
import ReactMarkdown from 'react-markdown';

export default async function ResumePage() {
    const resume = await getResume();

    if (!resume) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <h1 className="text-4xl font-bold mb-8">Resume</h1>
                <p className="text-muted-foreground">Resume not available.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <article className="prose prose-neutral dark:prose-invert max-w-none">
                <ReactMarkdown>{resume.content}</ReactMarkdown>
            </article>
        </div>
    );
}
```

#### Step 4: Update Layout Navigation

In `app/layout.tsx`, update the navigation to include new pages:

```typescript
<nav className="flex gap-6 items-center">
    <Link href="/" className="font-semibold text-lg hover:text-muted-foreground transition-colors">
        David Coleman
    </Link>
    <Link href="/blog" className="text-sm hover:text-muted-foreground transition-colors">
        Blog
    </Link>
    <Link href="/resources" className="text-sm hover:text-muted-foreground transition-colors">
        Resources
    </Link>
    <Link href="/resume" className="text-sm hover:text-muted-foreground transition-colors">
        Resume
    </Link>
    <Link href="/about" className="text-sm hover:text-muted-foreground transition-colors">
        About
    </Link>
</nav>
```

#### Step 5: Create Magic Bento Home Page

Replace `app/page.tsx` with a new Magic Bento layout:

```typescript
'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, BookOpen, Link2 } from 'lucide-react';
import MagicBento from '@/components/ui/magic-bento';

// Bento card data for the personal website
const bentoCards = [
    {
        id: 'hero',
        title: 'David Coleman',
        description: 'Welcome to my personal website. I write about technology, share resources, and document my professional journey.',
        label: 'Introduction',
        color: '#060010',
        span: 'col-span-2 row-span-2', // Large hero tile
        link: '/about'
    },
    {
        id: 'blog',
        title: 'Blog',
        description: 'Thoughts on technology, life, and sometimes just random things.',
        label: 'Articles',
        color: '#060010',
        icon: BookOpen,
        span: 'col-span-1 row-span-1',
        link: '/blog'
    },
    {
        id: 'resources',
        title: 'Resources',
        description: 'Curated collection of useful websites and tools.',
        label: 'Library',
        color: '#060010',
        icon: Link2,
        span: 'col-span-1 row-span-1',
        link: '/resources'
    },
    {
        id: 'resume',
        title: 'Resume',
        description: 'Professional experience and qualifications.',
        label: 'Career',
        color: '#060010',
        icon: FileText,
        span: 'col-span-2 row-span-1',
        link: '/resume'
    }
];

export default function Home() {
    const gridRef = useRef<HTMLDivElement>(null);

    return (
        <div className="min-h-screen flex items-center justify-center py-16">
            <MagicBento
                enableSpotlight={true}
                enableBorderGlow={true}
                enableTilt={false}
                clickEffect={true}
                enableMagnetism={true}
                glowColor="132, 0, 255"
            >
                <div
                    ref={gridRef}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 max-w-5xl"
                >
                    {bentoCards.map((card) => (
                        <Link
                            key={card.id}
                            href={card.link}
                            className={`${card.span} card relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/50`}
                            style={{
                                '--glow-x': '50%',
                                '--glow-y': '50%',
                                '--glow-intensity': '0',
                                '--glow-radius': '200px'
                            } as React.CSSProperties}
                        >
                            <div className="flex flex-col h-full justify-between">
                                <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                                        {card.label}
                                    </span>
                                    <h2 className="text-2xl font-bold mb-2">{card.title}</h2>
                                    <p className="text-muted-foreground">{card.description}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-4 text-sm font-medium text-primary">
                                    Explore
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </div>
                            {card.icon && (
                                <card.icon className="absolute bottom-6 right-6 h-12 w-12 text-muted-foreground/20" />
                            )}
                        </Link>
                    ))}
                </div>
            </MagicBento>
        </div>
    );
}
```

**Note**: The exact MagicBento implementation may need adjustment based on the actual component API after installation. Review the installed component in `components/ui/magic-bento.tsx` and adapt the usage accordingly.

#### Step 6: Update Environment Variables

Add to `.env.local`:

```env
NOTION_RESOURCES_DATABASE_ID=your_resources_database_id_32_chars
NOTION_RESUME_PAGE_ID=your_resume_page_id_32_characters
```

Add to GitHub Secrets:

- `NOTION_RESOURCES_DATABASE_ID`
- `NOTION_RESUME_PAGE_ID`

#### Step 7: Test and Verify

```bash
npm run dev     # Test locally
npm run build   # Verify static build works
npm run lint    # Check for issues
```

### Alternative: Simpler Bento Grid (No Animation) - IMPLEMENTED

The site uses a simpler CSS Grid-based bento layout without GSAP animations. This approach provides better performance and simpler maintenance.

**Implementation** (`app/page.tsx`):

```typescript
'use client';

import Link from 'next/link';
import { ArrowRight, FileText, BookOpen, Link2, User } from 'lucide-react';
import DarkVeil from '@/components/ui/dark-veil';

const bentoCards = [
  {
    id: 'hero',
    title: 'David Coleman',
    description: 'Welcome to my personal website...',
    label: 'Introduction',
    span: 'md:col-span-2 md:row-span-1',
    link: '/about',
    icon: User
  },
  // ... other cards
];

export default function Home() {
  return (
    <>
      <DarkVeil hueShift={40} speed={0.5} resolutionScale={0.8} />

      <div className="min-h-screen flex items-center justify-center py-16 px-4 relative">
        <div className="w-full max-w-5xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
            {bentoCards.map((card) => (
              <Link
                key={card.id}
                href={card.link}
                className={`${card.span} group relative overflow-hidden rounded-2xl
                  border border-border/30 bg-background/40 backdrop-blur-xl p-8
                  transition-all hover:border-primary/50 hover:bg-background/50`}
              >
                {/* Card content */}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

Key features:

- Simple CSS Grid layout with responsive spans
- Frosted glass cards (`bg-background/40 backdrop-blur-xl`)
- Dark Veil animated background
- Hover effects with Tailwind transitions

---

## PLAN 3: Database Schema Reference

### Blog Database Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| Title | title | Yes | Post title |
| Slug | text | Yes | URL-friendly identifier |
| Date | date | Yes | Publication date |
| Tags | multi-select | No | Standardized tag system (see below) |
| Published | checkbox | Yes | Visibility control |
| Featured | checkbox | No | Pin to top |
| Excerpt | text | No | Short summary |
| Author | text | No | Author name |

### Projects Database Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| Name | title | Yes | Project name |
| Description | rich_text | No | Brief description |
| URL | url | No | Link to project |
| Category | select | Yes | Project category (standardized, see below) |
| Photo | files | No | Project screenshot/image |
| Published | checkbox | Yes | Visibility control |

### Projects Tag System (Category)

Projects use a single-select **Category** property. Apply the most relevant category.

| Category | Use For... |
| --- | --- |
| **Web App** | Full-stack or frontend web applications, SaaS products, dashboards |
| **Automation** | Workflows, n8n automations, scripts, integrations, bots |
| **AI / ML** | AI-powered tools, machine learning projects, LLM applications |
| **Design** | Graphic design, branding, UI/UX, visual projects |
| **Internal Tool** | Tools built for internal/business use at DOVITO or clients |
| **Experiment** | Proof-of-concepts, learning projects, hackathon entries, explorations |

### Resources Database Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| Name | title | Yes | Resource name |
| URL | url | Yes | Link to resource |
| Category | select | Yes | Resource category (standardized, see below) |
| Description | text | No | Brief description |
| Published | checkbox | Yes | Visibility control |

### Resources Tag System (Category)

Resources use a single-select **Category** property. Apply the most relevant category.

| Category | Use For... |
| --- | --- |
| **Productivity** | Task management, note-taking, calendars, workflow tools |
| **Design** | Design tools, UI kits, icon sets, color palettes, fonts |
| **Development** | Code editors, frameworks, libraries, hosting, APIs, dev tools |
| **AI** | AI tools, LLM platforms, prompt libraries, AI-powered utilities |
| **Business** | Finance, legal, marketing, CRM, business operations tools |
| **Learning** | Courses, tutorials, books, podcasts, educational platforms |
| **Faith** | Devotionals, Bible tools, ministry resources, Christian media |
| **Life** | Health, fitness, cooking, travel, general lifestyle resources |

### Blog Tag System

When creating or importing blog posts, apply tags from this standardized 7-tag system. Posts can have multiple tags. Apply all that are relevant based on the content.

| Tag | Apply When Post Covers... |
| --- | --- |
| **The 1159** | Any post from "The 1159" weekly newsletter series |
| **Leadership** | Management, teams, conflict resolution, leading others, organizational topics |
| **Faith** | Spiritual reflections, God's faithfulness, trust, biblical principles, prayer |
| **Business** | Entrepreneurship, startups, strategy, career decisions, DOVITO, professional journey |
| **Technology** | Tech, AI, software, digital tools, innovation, engineering |
| **Growth** | Personal development, mindset shifts, self-improvement, lessons learned, individual responsibility |
| **Life** | Relationships, communication, general musings, day-to-day wisdom, community |

**Tagging guidelines:**
- Every "The 1159" series post gets the **The 1159** tag plus 1-3 content tags
- Most posts should have 2-4 tags total
- When in doubt between **Growth** and **Life**, use **Growth** if the post focuses on intentional self-improvement; use **Life** for broader reflections
- **Leadership** vs **Business**: Leadership is about *people management*; Business is about *strategy, ventures, and career*

### Resume Page Schema

- Single Notion page with markdown content
- Fetched and converted to markdown at build time

---

## Common Pitfalls

1. **Base Path**: Always account for `/dkcoleman` prefix in production. Use Next.js `<Link>` component for navigation.

2. **Image Optimization**: Disabled for static export. Use `<img>` tags or unoptimized Next.js `<Image>` component.

3. **GSAP in SSR**: MagicBento uses GSAP which requires client-side rendering. Always use `'use client'` directive for pages/components using it.

4. **Environment Variables**: Build-time only. All Notion IDs must be in GitHub Secrets for production builds.

5. **Notion Content Updates**: Require rebuild to appear on site. Not real-time.

6. **Notion Token Format**: Tokens start with `ntn_` NOT `secret_`. Update any validation or documentation accordingly.

7. **Notion Credential Validation**: Always validate credentials BEFORE calling `getNotionClient()` to enable graceful fallback to sample data. Check for both undefined values and placeholder strings (e.g., `ntn_your_integration_token_here`).

8. **Dark Veil Canvas Coverage**:
   - Do NOT wrap the canvas in positioned containers
   - Use `position: fixed` with explicit `100vw/100vh` sizing
   - Use `window.innerWidth/innerHeight` for resize calculations, not parent element dimensions
   - Add `overflow-x: hidden` to html/body to prevent scrollbar issues
   - The `resolutionScale` prop affects render resolution only, not visual size

9. **Separate Notion Databases**: Blog, Resources, and Resume use separate database IDs. Ensure each has the correct ID configured. The error "Databases with multiple data sources are not supported" indicates you're trying to use a database with synced blocks or linked databases.

---

## Execution Order for Implementation

When implementing these plans, follow this order:

1. **Run Health Check Cleanup** (Plan 1)
2. **Install Dependencies** (gsap, MagicBento)
3. **Create Data Layers** (lib/resources.ts, lib/resume.ts)
4. **Create New Pages** (resources, resume)
5. **Update Layout Navigation**
6. **Implement Magic Bento Home Page**
7. **Update Environment Variables**
8. **Test and Deploy**

---

## Adding shadcn/ui Components

Two registries configured in `components.json`:

```bash
npx shadcn@latest add button              # shadcn/ui
npx shadcn@latest add @react-bits/avatar  # ReactBits
npx shadcn@latest add @react-bits/MagicBento-TS-TW  # Magic Bento
```

---

## SESSION STATE (2026-02-17)

### Just Completed
- **GA4 installed** — Measurement ID `G-GV5PKEYQSV`
  - Added `NEXT_PUBLIC_GA_ID` as GitHub Secret (workflow reads from secrets, NOT `.env.production`)
  - Also set in `.env.local` and `.env.production` for local dev
  - `@next/third-parties/google` `<GoogleAnalytics>` component already in `app/layout.tsx` lines 211-213
  - Triggered rebuild via `gh workflow run deploy.yml`

- **Notion image expiration fix** — `lib/projects.ts` now downloads Notion-hosted images at build time to `public/project-images/` since Notion file URLs are temporary signed S3 URLs (~1hr expiry). External URLs pass through unchanged. `/public/project-images/` is gitignored.

- **Project card image display fix** — `app/projects/ProjectsPageClient.tsx` image section uses `p-4 pb-0` padding with `rounded-xl object-contain` instead of fixed height with `object-cover`.

### Active Issue — Blog SVG Illustrations Broken
- User reports SVGs changed to "thick brush strokes on white" — they were previously perfect
- **Likely culprit**: commit `1e6861e` — "Redesign SVG generator with ink-wash brush stroke aesthetic"
- SVG commit history (newest first):
  - `1e6861e` — Redesign SVG generator with ink-wash brush stroke aesthetic ← PROBABLY BROKE IT
  - `e39d4cb` — Fix SVG motif selection to use content theme tag instead of series tag
  - `650f79f` — fix: Redesign SVG illustrations — minimal black/white + accent color
  - `4925876` — feat: Add deterministic SVG illustrations to blog posts ← ORIGINAL GOOD VERSION
- **Action needed**: Investigate what changed in the SVG generator component between `4925876` and `1e6861e`, or revert to the working state. Check `components/` or `lib/` for the SVG generation code.

### Pending Tasks
1. **Resume narrative toggle** — `lib/resume-narrative.ts` has uncommitted local fixes: `Published`→`published`, `Order`→`number`. Notion DB property names were mismatched. These fixes are unstaged — need to verify they work and commit.
2. **About page hyperlink support** — mncoleman.com should be a clickable link in the "This Website" section. `lib/about.ts` needs to preserve Notion rich text links.
3. **HTTPS enforcement** — GitHub Pages certificate should be provisioned; user needs to enable "Enforce HTTPS" in repo settings.
4. **`components.json`** — Has uncommitted trailing newline change (trivial).

### Uncommitted Changes
- `components.json` — trailing newline (trivial)
- `lib/resume-narrative.ts` — property name fixes (`Published`→`published`, `Order`→`number`)

---

## MAJOR UPGRADE: Vercel + Neon + Scheduling System (2026-02-20)

### Overview

Migrating from static GitHub Pages + Notion CMS to **Vercel + Neon PostgreSQL** with a full custom CMS, nav redesign, Typeform-style contact/scheduling intake form, and n8n AI workflow.

### Progress Tracker

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | DONE | Platform migration — next.config.ts, deploy.yml, .env.example, deps installed |
| **Phase 2a** | DONE | Database schema (`lib/db/schema.ts`) + Drizzle setup (`drizzle.config.ts`) |
| **Phase 2b** | DONE | Notion → Neon migration script (`scripts/migrate-notion-to-neon.ts`) — run with `npx tsx scripts/migrate-notion-to-neon.ts` |
| **Phase 2c** | DONE | Replace data layer — 6 query files in `lib/queries/` replace old Notion adapters |
| **Phase 2d** | DONE | 11 admin API routes in `app/api/admin/` (blog, resources, projects, about, resume, narrative, upload) |
| **Phase 2e** | DONE | Tabbed CMS: AdminCMS.tsx + BlogEditor, ResourcesEditor, ProjectsEditor, AboutEditor, ResumeEditor, NarrativeEditor |
| **Phase 2f** | DONE | Cleanup — old Notion lib files removed, ContentEditor.tsx removed, Notion deps kept as devDeps for migration script |
| **Phase 3** | DONE | Mega-menu nav (`components/nav/mega-menu.tsx`), nav illustrations, grouped mobile nav, Contact keybinding |
| **Phase 4** | DONE | Typeform-style intake form (`components/contact/intake-form.tsx`), `/contact` page, meeting-requests API, n8n webhook |
| **Phase 5** | PENDING | n8n AI scheduling workflow (external config — webhook endpoints ready in codebase) |

### Implementation Order
1. Phase 1 → 2a-c → 4 → 2d-e → 3 → 5
2. Phases 2d-e, 3, and 4 can run in parallel once 2a-c is done.

### Remaining Steps
1. **Run migration**: Set up Neon DB, run `npx drizzle-kit push` to create tables, then `npx tsx scripts/migrate-notion-to-neon.ts` to migrate Notion data
2. **Deploy to Vercel**: Connect repo, set env vars (DATABASE_URL, JWT_SECRET, N8N_MEETING_WEBHOOK_URL, N8N_WEBHOOK_SECRET)
3. **Configure n8n**: Set up workflow (webhook trigger → AI eval → calendar check → Telegram notify)
4. **After migration verified**: Can remove `@notionhq/client` and `notion-to-md` from devDependencies

---

### Phase 1: Platform Migration

**Files to change:**
- `next.config.ts` — Remove `output: 'export'` and `images.unoptimized`. Add `images.remotePatterns`. Keep `trailingSlash: true`.
- `.github/workflows/deploy.yml` — Replace with scheduled-rebuild workflow that curls a Vercel Deploy Hook (Vercel Git integration handles push deploys).
- `.env.example` — Add `DATABASE_URL` for Neon.
- `package.json` — Add `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit` (dev).

**External setup required:**
1. Create Neon project, get `DATABASE_URL`
2. Connect GitHub repo to Vercel, configure env vars
3. Point `dkcoleman.com` DNS to Vercel

---

### Phase 2a: Database Schema

**New files:** `lib/db/index.ts`, `lib/db/schema.ts`, `drizzle.config.ts`

**Tables:**
```
blog_posts:       id, slug (unique), title, date, excerpt, author, tags (jsonb), published, featured, content (md), word_count, reading_time, created_at, updated_at
resources:        id, name, url, categories (jsonb), description, published, created_at, updated_at
projects:         id, name, description, url, tech (jsonb), date, published, photo (url), created_at, updated_at
about_sections:   id, key (unique), title, content, order, updated_at
resume:           id, title, content (md), last_updated
resume_narrative: id, title, period, order, icon, icon_type, content (md), published, created_at, updated_at
meeting_requests: id, name, email, company, reason, preferred_timeframe, additional_context, status, ai_response (jsonb), notified_at, created_at, updated_at
images:           id, filename, url, content_type, size, entity_type, entity_id, created_at
```

### Phase 2b: Migration Script

`scripts/migrate-notion-to-neon.ts` — One-time script:
1. Connects to all 7 Notion sources using existing env vars
2. Fetches all content (blocks → markdown via `notion-to-md`)
3. Downloads project images → uploads to Vercel Blob
4. Inserts into Neon tables

### Phase 2c: Replace Data Layer

Rewrite every `lib/*.ts` Notion file to use Drizzle queries. **Interfaces stay the same** so page components don't change.

| Current file | Replacement |
|---|---|
| `lib/notion.ts` (293 lines) | `lib/queries/blog.ts` |
| `lib/blog.ts` | Merge into `lib/queries/blog.ts` |
| `lib/resources.ts` | `lib/queries/resources.ts` |
| `lib/projects.ts` | `lib/queries/projects.ts` |
| `lib/about.ts` | `lib/queries/about.ts` |
| `lib/resume.ts` | `lib/queries/resume.ts` |
| `lib/resume-narrative.ts` | `lib/queries/resume-narrative.ts` |

### Phase 2d: Admin API Routes

Migrate JWT verification from `worker/index.ts` (lines 314-327) into `lib/auth.ts`.

| Route | Methods |
|---|---|
| `app/api/admin/blog/route.ts` | GET, POST |
| `app/api/admin/blog/[id]/route.ts` | GET, PUT, DELETE |
| `app/api/admin/resources/route.ts` | GET, POST |
| `app/api/admin/resources/[id]/route.ts` | GET, PUT, DELETE |
| `app/api/admin/projects/route.ts` | GET, POST |
| `app/api/admin/projects/[id]/route.ts` | GET, PUT, DELETE |
| `app/api/admin/about/route.ts` | GET, PUT |
| `app/api/admin/resume/route.ts` | GET, PUT |
| `app/api/admin/resume-narrative/route.ts` | GET, POST |
| `app/api/admin/resume-narrative/[id]/route.ts` | GET, PUT, DELETE |
| `app/api/admin/upload/route.ts` | POST (Vercel Blob) |

### Phase 2e: Expanded Admin Dashboard

Current admin only edits `data/about.json` via GitHub API. Expand to tabbed CMS:

| Component | Purpose |
|---|---|
| `components/admin/AdminCMS.tsx` | Tabbed container |
| `components/admin/BlogEditor.tsx` | Post list + markdown editor (`@uiw/react-md-editor`) |
| `components/admin/ResourcesEditor.tsx` | Table with inline add/edit |
| `components/admin/ProjectsEditor.tsx` | Card grid with image upload |
| `components/admin/AboutEditor.tsx` | Replaces ContentEditor.tsx |
| `components/admin/ResumeEditor.tsx` | Single markdown editor |
| `components/admin/NarrativeEditor.tsx` | Sortable timeline sections |

### Phase 2f: Cleanup

- Remove `@notionhq/client`, `notion-to-md`
- Remove all `NOTION_*` env vars
- Delete `data/about.json`
- Update "This Website" about text

### Phase 3: Navigation Redesign

Two dropdown triggers: **"Content"** (Blog, Projects, Resources) and **"Connect"** (About, Contact, Wedding, 1159).

**New files:**
- `components/nav/mega-menu.tsx` — Radix NavigationMenu
- `lib/nav-illustrations.ts` — SVG generators for nav items

**Files changed:**
- `app/layout.tsx` (lines 156-185) — Replace flat links with `<MegaMenu />`
- `components/mobile-nav.tsx` — Grouped structure with section headers
- `components/key-bindings.tsx` — Add `C` shortcut for Contact

**New dep:** `@radix-ui/react-navigation-menu`

### Phase 4: Contact / Scheduling Intake Form

**Typeform-style multi-step form** (`components/contact/intake-form.tsx`):
1. "What's your name?" — text
2. "What's your email?" — email
3. "Where do you work?" — text (optional)
4. "What brings you here?" — select cards
5. "When works for you?" — select cards
6. "Anything else?" — textarea

**New files:**
- `app/contact/page.tsx`
- `components/contact/intake-form.tsx`
- `app/api/meeting-requests/route.ts` — POST → save to DB + fire n8n webhook
- `app/api/webhooks/n8n/route.ts` — Callback from n8n

**Homepage:** Add 6th bento card `{ id: 'connect', title: 'Schedule a Meeting', link: '/contact' }`. Grid becomes 2 rows of 3.

**New dep:** `framer-motion` (or reuse GSAP)

### Phase 5: n8n AI Scheduling Workflow (External)

Webhook trigger → AI evaluation → Calendar check → Telegram notify David.

**Env vars:** `N8N_MEETING_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`

**Codebase touchpoints:** webhook POST on form submit (Phase 4) and callback endpoint.

---

### New Dependencies Summary

| Package | Phase | Dev? |
|---|---|---|
| `@neondatabase/serverless` | 1 | No |
| `drizzle-orm` | 1 | No |
| `drizzle-kit` | 1 | Yes |
| `@vercel/blob` | 2b | No |
| `@uiw/react-md-editor` | 2e | No |
| `@radix-ui/react-navigation-menu` | 3 | No |
| `framer-motion` | 4 | No |

### Key Architectural Decisions

- **Interfaces stay the same** in Phase 2c so page components (`app/*/page.tsx`) don't change
- **Keep Cloudflare Worker** running for Telegram auth during transition; replicate JWT verification in `lib/auth.ts`
- **URL stability**: All page paths stay the same. `trailingSlash: true` preserved.
- **Keep Notion intact** until Neon is fully verified (data safety net)

### Codebase Reference (for new session context)

**Current data layer files (all talk to Notion):**
- `lib/notion.ts` (293 lines) — Core Notion client + blog fetching
- `lib/blog.ts` (23 lines) — Thin adapter re-exporting from notion.ts
- `lib/resources.ts` (61 lines) — Resources database
- `lib/projects.ts` (112 lines) — Projects + image download
- `lib/about.ts` (83 lines) — About sections from DB or fallback
- `lib/resume.ts` (52 lines) — Resume page → markdown
- `lib/resume-narrative.ts` (87 lines) — Career timeline sections

**Current interfaces (must be preserved):**
- `NotionPost` → `{ id, slug, title, date, excerpt, author, tags, published, featured, content, readingTime, wordCount }`
- `Resource` → `{ id, name, url, categories, description, published }`
- `Project` → `{ id, name, description, url, tech, date, published, photo }`
- `AboutData` → `{ introduction, whatIDo, thisWebsite, the1159 }`
- `Resume` → `{ title, content, lastUpdated }`
- `NarrativeSection` → `{ id, title, period, order, icon, iconType, content }`

**Layout data fetching** (`app/layout.tsx` lines 81-86): Fetches posts, projects, resources, resume for search index.

**Admin auth:** `worker/index.ts` JWT functions at lines 300-350 (signJwt, verifyJwt, createSignature, btoaUrl, atobUrl).

**Homepage bento cards:** `app/page.tsx` — 5 cards in 3-col grid. Adding 6th card in Phase 4.

---

## SESSION STATE (2026-03-07) — Nav Cleanup + Meeting Booking System

### Branch: `feature/nav-cleanup-meet-booking`

### What Was Built

#### Nav Bar Redesign (3 items: Content, Connect, 1159)
- **`components/nav/mega-menu.tsx`** — Custom dropdown (replaced Radix NavigationMenu which had z-index/clipping issues with `backdrop-blur` on header). Horizontal card layout, hover-triggered with 150ms close delay, fern-only accent colors. Keyboard shortcuts `1`/`2`/`3`.
- **`components/key-bindings.tsx`** — Simplified to just `H` for home. Shortcuts 1/2 handled by mega-menu, 3 by signup-popup.
- **`components/ui/signup-popup.tsx`** — Changed hotkey from `1` to `3`.
- **`components/mobile-nav.tsx`** — Updated structure: Articles (not Blog), Meet (not Contact), matching new nav hierarchy.
- **`app/layout.tsx`** — Removed `Nav1159Button` import, added `overflow-visible` to header.

#### Navigation Structure
- **Content** (1): Articles → `/blog`, Projects → `/projects`, Resources → `https://app.dovito.com` (external)
- **Connect** (2): Wedding → external, Resume → `/resume`, About → `/about`, Meet → `/meet`
- **1159** (3): Opens newsletter signup popup

#### Meeting/Booking System
- **`/meet`** (`app/meet/page.tsx`) — New meeting request form, source: `new`, 6 steps
- **`/meet/[token]`** (`app/meet/[token]/page.tsx` + `PreapprovedMeet.tsx`) — Preapproved single-use link, 3 steps (name, email, reason). Validates token on load, shows error if used/expired/invalid. Falls back to regular `/meet` with CTA.
- **`/meet/booking`** (`app/meet/booking/page.tsx`) — "Checking David's availability" page. Polls `GET /api/meeting-requests/[id]` every 3s. Shows: animated loading → time slots (if aligned) OR "David will be in touch" (if not aligned) OR "You're booked!" (if scheduled).
- **`components/meet/meet-form.tsx`** — Reusable form for both modes. Preapproved skips company/timeframe/context steps.
- **`components/meet/availability-checker.tsx`** — Polling component with animated rings, cycling progress messages.

#### API Routes (New)
- **`POST /api/meeting-tokens`** — Admin-only (JWT auth). Creates single-use token with base64url random string, configurable expiry (default 30 days).
- **`GET /api/meeting-tokens/[token]`** — Public. Returns `{ valid: true }` or reason: `not_found`/`already_used`/`expired`.
- **`GET /api/meeting-requests/[id]`** — Public. Returns status + aiResponse for polling.
- **`POST /api/meeting-requests`** — Updated: accepts `source` (new/preapproved) and `token`. Validates and atomically consumes token on preapproved submissions.

#### DB Schema Changes (`lib/db/schema.ts`)
- **`meeting_requests`** — Added columns: `source` (text, 'new'|'preapproved'), `tokenId` (integer, nullable)
- **`meeting_tokens`** — New table: `id`, `token` (unique), `label`, `used` (boolean), `usedAt`, `usedByRequestId`, `expiresAt`, `createdAt`

#### Homepage
- Replaced "Things I've Made" (projects) bento card with "Schedule a Meeting" (connect) card → `/meet`
- Now 5 cards: hero, connect, blog, resources, resume

#### Nav Illustrations (`lib/nav-illustrations.ts`)
- Added `meetIllustration()` (calendar grid) and `resumeIllustration()` (document with avatar)

### Known Issues / Still TODO
1. **DB not connected** — No `DATABASE_URL` in `.env.local`. Need to create Neon project, add connection string, run `npx drizzle-kit push` to create tables (including new `meeting_tokens` table and new columns on `meeting_requests`).
2. **Meet form rendering** — Form content was rendering off-canvas (slide animation issue). Simplified to direct content swap (no slide animation). May need visual polish — the card renders but verify text is visible after DB connection.
3. **Mega menu sizing** — User requested larger cards. Current cards use `190px` width per item. May want `220px+` and more padding.
4. **Mega menu visual depth** — User wanted "less flat, more visually intriguing". Current version has subtle fern hover states and gradient backgrounds. Could add: card shadows on hover, subtle border glow, illustration color transitions.
5. **Old `/contact` page** — Still exists and works. Could redirect to `/meet` or keep as legacy.
6. **N8N integration** — Webhook endpoints ready. `POST /api/meeting-requests` fires webhook on submit. `POST /api/webhooks/n8n` receives callbacks. The booking page expects `aiResponse.timeSlots[]` with `{ date, time, duration, calendarLink }` for aligned meetings.

### For N8N Agent Integration
- Form source IDs: `source: 'new'` or `source: 'preapproved'`
- Webhook payload includes `{ id, source, name, email, company, reason, preferredTimeframe, additionalContext }`
- Status flow: `pending` → `processing` → `aligned` (with timeSlots) | `not_aligned` | `scheduled` | `declined`
- Callback endpoint: `POST /api/webhooks/n8n` with `{ id, status, aiResponse }` and `X-Webhook-Secret` header

### File Inventory (new files this session)
```
app/meet/page.tsx
app/meet/[token]/page.tsx
app/meet/[token]/PreapprovedMeet.tsx
app/meet/booking/page.tsx
app/api/meeting-requests/[id]/route.ts
app/api/meeting-tokens/route.ts
app/api/meeting-tokens/[token]/route.ts
components/meet/meet-form.tsx
components/meet/availability-checker.tsx
```
