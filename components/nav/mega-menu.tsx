'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink } from 'lucide-react';
import {
  blogIllustration,
  projectsIllustration,
  resourcesIllustration,
  aboutIllustration,
  weddingIllustration,
  meetIllustration,
  resumeIllustration,
} from '@/lib/nav-illustrations';
import { openSignupPopup } from '@/components/ui/signup-popup';

interface NavItem {
  title: string;
  description: string;
  href: string;
  illustration: () => string;
  external?: boolean;
  accent?: string;
}

const contentItems: NavItem[] = [
  {
    title: 'Articles',
    description: 'Thoughts on technology, life, and leading well.',
    href: '/blog',
    illustration: blogIllustration,
  },
  {
    title: 'Projects',
    description: 'Things I\'ve built — oftentimes with AI.',
    href: '/projects',
    illustration: projectsIllustration,
  },
  {
    title: 'Resources',
    description: 'Curated tools and websites I recommend.',
    href: 'https://app.dovito.com',
    illustration: resourcesIllustration,
    external: true,
  },
];

const connectItems: NavItem[] = [
  {
    title: 'Wedding',
    description: 'Our wedding website.',
    href: 'https://wedding.dkcoleman.com',
    illustration: weddingIllustration,
    external: true,
  },
  {
    title: 'Resume',
    description: 'Professional experience and qualifications.',
    href: '/resume',
    illustration: resumeIllustration,
  },
  {
    title: 'About',
    description: 'Who I am and what I\'m about.',
    href: '/about',
    illustration: aboutIllustration,
  },
  {
    title: 'Meet',
    description: 'Schedule a meeting with David.',
    href: '/meet',
    illustration: meetIllustration,
  },
];

function NavCard({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const inner = (
    <div className="relative group/card flex flex-col p-5 rounded-xl border border-border/10 hover:border-fern-500/30 bg-muted/5 hover:bg-fern-500/5 transition-all duration-200 h-full">
      <div
        className="w-10 h-10 mb-4 text-muted-foreground group-hover/card:text-fern-500 transition-colors"
        dangerouslySetInnerHTML={{ __html: item.illustration() }}
      />
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm font-semibold group-hover/card:text-foreground transition-colors">{item.title}</span>
        {item.external && <ExternalLink className="w-3 h-3 text-muted-foreground/40" />}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {item.description}
      </p>
    </div>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClick} className="flex-1 min-w-0">
        {inner}
      </a>
    );
  }

  return (
    <Link href={item.href} onClick={onClick} className="flex-1 min-w-0">
      {inner}
    </Link>
  );
}

function Dropdown({
  label,
  shortcut,
  items,
  open,
  onOpen,
  onClose,
}: {
  label: string;
  shortcut: string;
  items: NavItem[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    onOpen();
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(onClose, 150);
  };

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className="text-sm hover:text-muted-foreground transition-colors group flex items-center gap-1 relative outline-none"
        onClick={open ? onClose : onOpen}
      >
        {label}
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
        <kbd className="ml-1 hidden lg:inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold border rounded bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
          {shortcut}
        </kbd>
        <span className={`absolute -bottom-1 left-0 h-0.5 bg-fern-500 transition-all duration-300 ${open ? 'w-full' : 'w-0 group-hover:w-full'}`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          style={{ zIndex: 9999 }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {/* Invisible bridge so hover doesn't break between trigger and panel */}
          <div className="absolute -top-3 left-0 right-0 h-3" />
          <div className="rounded-2xl border border-border/15 bg-background/95 backdrop-blur-2xl shadow-2xl shadow-black/25 p-3">
            <div className="flex gap-2" style={{ width: `${items.length * 190}px` }}>
              {items.map(item => (
                <NavCard key={item.title} item={item} onClick={onClose} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MegaMenu() {
  const [openMenu, setOpenMenu] = useState<'content' | 'connect' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!openMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [openMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '1') {
        e.preventDefault();
        setOpenMenu(m => m === 'content' ? null : 'content');
      } else if (e.key === '2') {
        e.preventDefault();
        setOpenMenu(m => m === 'connect' ? null : 'connect');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const close = useCallback(() => setOpenMenu(null), []);

  return (
    <div ref={containerRef} className="flex gap-6 items-center">
      <Dropdown
        label="Content"
        shortcut="1"
        items={contentItems}
        open={openMenu === 'content'}
        onOpen={() => setOpenMenu('content')}
        onClose={close}
      />
      <Dropdown
        label="Connect"
        shortcut="2"
        items={connectItems}
        open={openMenu === 'connect'}
        onOpen={() => setOpenMenu('connect')}
        onClose={close}
      />
      <button
        onClick={() => { close(); openSignupPopup(); }}
        className="text-sm hover:text-muted-foreground transition-colors group flex items-center gap-1 relative outline-none"
      >
        1159
        <kbd className="ml-1 hidden lg:inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold border rounded bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
          3
        </kbd>
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-fern-500 group-hover:w-full transition-all duration-300" />
      </button>
    </div>
  );
}
