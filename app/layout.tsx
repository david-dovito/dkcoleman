import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { PWAInstall } from '@/components/pwa-install';
import Link from 'next/link';
import { GoogleAnalytics } from '@next/third-parties/google';
import { MobileNav } from '@/components/mobile-nav';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import CustomCursor from '@/components/ui/CustomCursor';
import { Nav1159Button } from '@/components/nav-1159';
import { ThemeWrapper } from '@/components/theme-wrapper';
import { ThemeToggle } from '@/components/theme-toggle';
import { FooterSubscribe } from '@/components/footer-subscribe';

import { KeyBindings } from '@/components/key-bindings';
import { Search, SearchItem } from '@/components/search';
import { getPublishedPostsWithContent } from '@/lib/notion';
import { getPublishedProjects } from '@/lib/projects';
import { getPublishedResources } from '@/lib/resources';
import { getResume } from '@/lib/resume';


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

  const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="ml-2 hidden lg:inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold border rounded bg-muted/50 text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
      {children}
    </kbd>
  );

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
            <div className="min-h-screen flex flex-col pb-24 md:pb-0">
              <KeyBindings />
              {/* Mobile Navigation - full-screen sheet (opened from the bottom bar) */}
              <MobileNav />
              {/* Mobile bottom nav - primary destinations, thumb-reachable */}
              <MobileBottomNav />

              <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-5xl">
                  {/* Logo / Brand */}
                  <Link href="/" className="hover:opacity-70 transition-opacity group flex items-center">
                    <img src="/logo.svg" alt="David Coleman" className="h-6 dark:invert" />
                  </Link>

                  {/* Desktop Navigation - Slimmed; secondary links live in the footer */}
                  <nav className="hidden md:flex gap-6 items-center">
                    <Link href="/blog" className="text-sm hover:text-muted-foreground transition-colors group flex items-center relative">
                      Blog <Kbd>B</Kbd>
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-fern-500 group-hover:w-full transition-all duration-300" />
                    </Link>
                    <Link href="/projects" className="text-sm hover:text-muted-foreground transition-colors group flex items-center relative">
                      Projects <Kbd>P</Kbd>
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-fern-500 group-hover:w-full transition-all duration-300" />
                    </Link>
                    <Link href="/real-estate" className="text-sm hover:text-muted-foreground transition-colors group flex items-center relative">
                      Real Estate
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-fern-500 group-hover:w-full transition-all duration-300" />
                    </Link>
                    <Link href="/about" className="text-sm hover:text-muted-foreground transition-colors group flex items-center relative">
                      About <Kbd>A</Kbd>
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-fern-500 group-hover:w-full transition-all duration-300" />
                    </Link>
                    <div className="h-4 w-[1px] bg-border mx-2" />
                    <Nav1159Button kbdClass="ml-2 hidden lg:inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold border rounded bg-muted/50 text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary" />
                    <Search items={searchItems} />
                    <ThemeToggle />
                  </nav>
                </div>
              </header>
              <main className="flex-1">
                {children}
              </main>
              <footer className="border-t relative z-10">
                <div className="container mx-auto px-4 py-12 max-w-5xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-2 md:col-span-1">
                      <img src="/logo.svg" alt="David Coleman" className="h-6 dark:invert mb-3" />
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Thoughts on faith, business, and figuring it out along the way.
                      </p>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-3">Explore</div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                        <li><Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link></li>
                        <li><Link href="/real-estate" className="hover:text-foreground transition-colors">Real Estate</Link></li>
                        <li><Link href="/resources" className="hover:text-foreground transition-colors">Resources</Link></li>
                        <li><Link href="/resume" className="hover:text-foreground transition-colors">Resume</Link></li>
                        <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-3">The 1159</div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><FooterSubscribe /></li>
                        <li><Link href="/blog" className="hover:text-foreground transition-colors">Read the archive</Link></li>
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-3">Connect</div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><a href="https://wedding.dkcoleman.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Wedding</a></li>
                        <li><Link href="/brand-kit" className="hover:text-foreground transition-colors">Brand Kit</Link></li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
                    <div>© 1999-{new Date().getFullYear()} David Coleman. All rights reserved.</div>
                    <Link href="/admin" className="opacity-50 hover:opacity-100 transition-opacity">Admin</Link>
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
