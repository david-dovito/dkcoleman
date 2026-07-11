'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';

/**
 * Lightbulb theme toggle.
 *
 * The visual is driven entirely by `dark:` Tailwind variants (next-themes sets
 * `class="dark"` on <html>), so it renders correctly on the server and never
 * flashes on hydration. In light mode the bulb glows warm amber; in dark mode
 * it dims out and the rays retract. Click flips the theme.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on the pages that force dark (home hero + brand kit); toggling there
  // does nothing useful.
  if (!mounted || pathname === '/' || pathname === '/brand-kit') return null;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Turn the lights on' : 'Turn the lights off'}
      aria-label="Toggle theme"
      className="group relative h-9 w-9 inline-flex items-center justify-center rounded-md bg-transparent transition-colors hover:bg-accent"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[1.3rem] w-[1.3rem] transition-all duration-500
                   text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.75)]
                   dark:text-muted-foreground dark:drop-shadow-none"
      >
        {/* Radiating rays - present when the bulb is lit, retracted in the dark */}
        <g
          className="origin-center transition-all duration-500
                     opacity-100 scale-100
                     dark:opacity-0 dark:scale-50"
        >
          <line x1="12" y1="1.5" x2="12" y2="3.5" />
          <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
          <line x1="19.8" y1="4.2" x2="18.4" y2="5.6" />
          <line x1="1.5" y1="12" x2="3.5" y2="12" />
          <line x1="20.5" y1="12" x2="22.5" y2="12" />
        </g>

        {/* Glass - filled amber when lit, hollow when dark */}
        <path
          d="M9 17.5c0-1.2-.6-2.2-1.4-3A5.5 5.5 0 1 1 17 11a5.4 5.4 0 0 1-1.6 3.5c-.8.8-1.4 1.8-1.4 3"
          className="transition-all duration-500
                     fill-amber-300/70
                     dark:fill-transparent"
        />

        {/* Screw base */}
        <path d="M9.2 17.8h5.6" />
        <path d="M10 20.5h4" />
      </svg>
    </button>
  );
}
