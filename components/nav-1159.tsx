'use client';

import SignupPopup, { openSignupPopup } from '@/components/ui/signup-popup';

export function Nav1159Button({ kbdClass }: { kbdClass?: string }) {
    return (
        <>
            <button
                onClick={openSignupPopup}
                className="text-sm hover:text-muted-foreground transition-colors group flex items-center bg-transparent border-none cursor-pointer"
            >
                1159
                {kbdClass && (
                    <kbd className={kbdClass}>1</kbd>
                )}
            </button>
            <SignupPopup />
        </>
    );
}
