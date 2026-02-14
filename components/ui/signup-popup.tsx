'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const OPEN_EVENT = 'the1159:open';

/** Call from anywhere to open the popup */
export function openSignupPopup() {
    window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Nav button that triggers the popup */
export function The1159Button({ kbd }: { kbd?: React.ReactNode }) {
    return (
        <button
            onClick={openSignupPopup}
            className="text-sm hover:text-muted-foreground transition-colors group flex items-center bg-transparent border-none cursor-pointer"
        >
            1159 {kbd}
        </button>
    );
}

export default function SignupPopup() {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const close = useCallback(() => {
        setClosing(true);
        setTimeout(() => {
            setVisible(false);
            setClosing(false);
        }, 300);
    }, []);

    useEffect(() => {
        const handleOpen = () => setVisible(true);
        window.addEventListener(OPEN_EVENT, handleOpen);

        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === '1') {
                e.preventDefault();
                setVisible(v => !v);
            }
            if (e.key === 'Escape' && visible) close();
        };
        window.addEventListener('keydown', handleKey);

        return () => {
            window.removeEventListener(OPEN_EVENT, handleOpen);
            window.removeEventListener('keydown', handleKey);
        };
    }, [visible, close]);

    if (!visible || !mounted) return null;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
                onClick={close}
            />
            <div
                className={`fixed z-[9999] inset-0 flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ${closing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
                <div
                    className="relative w-full max-w-sm pointer-events-auto rounded-2xl border border-border/30 bg-background backdrop-blur-xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={close}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="px-6 pt-6 pb-2 text-center">
                        <h2 className="text-xl font-bold tracking-tight">The 1159: An Email to Encourage</h2>
                        <p className="text-sm text-muted-foreground mt-1">You don&apos;t need to do it alone. Let&apos;s learn and grow together!</p>
                        <p className="text-xs text-muted-foreground/60 mt-2">Sign up to receive a weekly encouragement email from David Coleman. No spam, just a quick note to start your week.</p>
                    </div>
                    <iframe
                        src="https://api.dovito.com/widget/form/5szVTLRB1KReKENh0Qjv"
                        style={{ width: '100%', height: '260px', border: 'none', borderRadius: '0 0 16px 16px', colorScheme: 'auto' }}
                        id="popup-5szVTLRB1KReKENh0Qjv"
                        data-layout="{'id':'INLINE'}"
                        data-trigger-type="alwaysShow"
                        data-trigger-value=""
                        data-activation-type="alwaysActivated"
                        data-activation-value=""
                        data-deactivation-type="neverDeactivate"
                        data-deactivation-value=""
                        data-form-name="E-Email"
                        data-height="260"
                        data-layout-iframe-id="popup-5szVTLRB1KReKENh0Qjv"
                        data-form-id="5szVTLRB1KReKENh0Qjv"
                        title="The 1159 Signup"
                    />
                </div>
            </div>
        </>,
        document.body
    );
}
