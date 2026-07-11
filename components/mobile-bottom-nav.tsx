'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, FolderKanban, Clock, Menu } from 'lucide-react';
import { openSignupPopup } from '@/components/ui/signup-popup';

/**
 * Mobile bottom navigation.
 *
 * A floating frosted-glass pill fixed to the bottom on mobile (hidden on md+),
 * modeled on the dovito.com nav but moved to the bottom for thumb reach. Direct
 * links to the primary destinations, a 1159 signup trigger, and a Menu button
 * that opens the existing full-screen sheet (components/mobile-nav.tsx) via the
 * shared `toggle-mobile-nav` event. Theme-aware so it works in light and dark.
 */

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const itemClass =
    'flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 min-w-[52px] text-[10px] font-medium transition-colors';

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border bg-background/80 px-2 py-1.5 shadow-lg backdrop-blur-xl">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`${itemClass} ${
              isActive(href)
                ? 'text-foreground bg-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            {label}
          </Link>
        ))}

        <button
          type="button"
          onClick={openSignupPopup}
          aria-label="Subscribe to The 1159"
          className={`${itemClass} text-[#D4A853] hover:bg-accent`}
        >
          <Clock className="h-5 w-5" strokeWidth={1.75} />
          1159
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-nav'))}
          aria-label="Open menu"
          className={`${itemClass} text-muted-foreground hover:text-foreground`}
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
          Menu
        </button>
      </div>
    </nav>
  );
}
