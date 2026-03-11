import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { PWAInstall } from '@/components/pwa-install';
import Link from 'next/link';
import { GoogleAnalytics } from '@next/third-parties/google';
import { MobileNav } from '@/components/mobile-nav';
import { HamburgerButton } from '@/components/hamburger-button';
import CustomCursor from '@/components/ui/CustomCursor';
import { ThemeWrapper } from '@/components/theme-wrapper';
import { ThemeToggle } from '@/components/theme-toggle';
import { MegaMenu } from '@/components/nav/mega-menu';

import { KeyBindings } from '@/components/key-bindings';
import { Search, SearchItem } from '@/components/search';
import { getPublishedPostsWithContent } from '@/lib/queries/blog';
import { getPublishedProjects } from '@/lib/queries/projects';
import { getPublishedResources } from '@/lib/queries/resources';
import { getResume } from '@/lib/queries/resume';


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

// No basePath needed for custom domain
const basePath = '';

export const metadata: Metadata = {
  title: 'David Coleman',
  description: 'Personal website with blog, resources, and resume by David Coleman',
  openGraph: {
    title: 'David Coleman',
    description: 'Personal website with blog, resources, and resume by David Coleman',
    url: 'https://dkcoleman.com',
    siteName: 'dkcoleman',
    images: [
      {
        url: 'https://dkcoleman.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'David Coleman',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'David Coleman',
    description: 'Personal website with blog, resources, and resume by David Coleman',
    images: ['https://dkcoleman.com/og-image.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'dkcoleman',
  },
  icons: {
    icon: [
      { url: `${basePath}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${basePath}/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { url: `${basePath}/favicon.png`, type: 'image/png' },
    ],
    apple: `${basePath}/apple-touch-icon.png`,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch data for search
  const [posts, projects, resources, resume] = await Promise.all([
    getPublishedPostsWithContent(),
    getPublishedProjects(),
    getPublishedResources(),
    getResume(),
  ]);

  const searchItems: SearchItem[] = [
    ...posts.map(p => ({
      id: p.id,
      title: p.title,
      description: p.excerpt,
      content: p.content,
      url: `/blog/${p.slug}`,
      type: 'blog' as const,
      metadata: p.tags,
    })),
    ...projects.map(p => ({
      id: p.id,
      title: p.name,
      description: p.description,
      url: p.url || '/projects',
      type: 'project' as const,
      metadata: p.tech,
    })),
    ...resources.map(r => ({
      id: r.id,
      title: r.name,
      description: r.description,
      url: r.url || '/resources',
      type: 'resource' as const,
      metadata: r.categories,
    })),
  ];

  if (resume) {
    searchItems.push({
      id: 'resume',
      title: 'Resume',
      description: 'David Coleman\'s Professional Resume',
      url: '/resume',
      type: 'resume' as const,
    });
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <PWAInstall />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeWrapper>
            <div className="min-h-screen flex flex-col">
              <KeyBindings />
              {/* Mobile Navigation - Rendered at root for proper overlay */}
              <MobileNav />

              <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md overflow-visible">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-5xl overflow-visible">
                  {/* Logo / Brand */}
                  <Link href="/" className="hover:opacity-70 transition-opacity group flex items-center">
                    <img src="/logo.svg" alt="David Coleman" className="h-6 dark:invert" />
                  </Link>

                  {/* Desktop Navigation - Hidden on mobile */}
                  <nav className="hidden md:flex gap-6 items-center">
                    <MegaMenu />
                    <div className="h-4 w-[1px] bg-border mx-2" />
                    <Search items={searchItems} />
                    <ThemeToggle />
                  </nav>

                  {/* Mobile Hamburger Button */}
                  <HamburgerButton />
                </div>
              </header>
              <main className="flex-1">
                {children}
              </main>
              <footer className="border-t relative z-10">

                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground max-w-4xl space-y-2">
                  <div>
                    © 1999-{new Date().getFullYear()} David Coleman. All rights reserved.
                  </div>
                  <div>
                    <Link href="/brand-kit" className="hover:text-fern-600 transition-colors hover:underline underline-offset-4 decoration-fern-500">
                      Brand Kit
                    </Link>
                    <span className="mx-2">•</span>
                    <Link href="/admin" className="hover:text-primary transition-colors hover:underline underline-offset-4 opacity-50 text-xs">
                      Admin
                    </Link>
                  </div>
                </div>
              </footer>
            </div>
          </ThemeWrapper>
        </ThemeProvider>
        <CustomCursor />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
