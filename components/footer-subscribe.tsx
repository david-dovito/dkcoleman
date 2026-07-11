'use client';

import { openSignupPopup } from '@/components/ui/signup-popup';

/**
 * Footer "Subscribe" control. A link-styled button that opens the shared 1159
 * signup popup. Lives as its own client island so the footer in the (server)
 * root layout can stay a server component.
 */
export function FooterSubscribe({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openSignupPopup}
      className={`text-left hover:text-foreground transition-colors ${className}`}
    >
      Subscribe
    </button>
  );
}
