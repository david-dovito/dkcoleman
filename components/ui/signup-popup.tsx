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

    // Toggle body class to disable custom cursor when popup is open
    useEffect(() => {
        if (visible && !closing) {
            document.body.classList.add('popup-open');
        } else if (!visible) {
            document.body.classList.remove('popup-open');
        }
        return () => { document.body.classList.remove('popup-open'); };
    }, [visible, closing]);

    useEffect(() => {
        const handleOpen = () => setVisible(true);
        window.addEventListener(OPEN_EVENT, handleOpen);

        const handleKey = (e: KeyboardEvent) => {
            // Always allow Escape to close
            if (e.key === 'Escape' && visible) { close(); return; }
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === '1') {
                e.preventDefault();
                setVisible(v => !v);
            }
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
                    className="relative w-full max-w-sm pointer-events-auto rounded-2xl border border-white/10 bg-black shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={close}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="px-6 pt-6 pb-2 text-center">
                        <h2 className="text-xl font-bold tracking-tight text-white">The 1159: An Email to Encourage</h2>
                        <p className="text-sm text-neutral-400 mt-1">You don&apos;t need to do it alone. Let&apos;s learn and grow together!</p>
                        <p className="text-xs text-neutral-500 mt-2">Sign up to receive a weekly encouragement email from David Coleman. No spam, just a quick note to start your week.</p>
                    </div>
                    <iframe
                        src="https://api.dovito.com/widget/form/5szVTLRB1KReKENh0Qjv"
                        className="invert hue-rotate-180"
                        style={{ width: '100%', height: '260px', border: 'none', borderRadius: '0 0 16px 16px' }}
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
