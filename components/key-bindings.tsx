'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function KeyBindings() {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isInput = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                (activeElement as HTMLElement).isContentEditable
            );

            if (isInput) return;
            if (event.ctrlKey || event.metaKey || event.altKey) return;

            // 1, 2, 3 are handled by mega-menu.tsx and signup-popup.tsx
            if (event.key.toUpperCase() === 'H') {
                router.push('/');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return null;
}
