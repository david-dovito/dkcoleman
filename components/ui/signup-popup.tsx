'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'the1159_popup_dismissed';
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 5000;

export default function SignupPopup() {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            if (Date.now() - dismissedAt < DISMISS_DAYS * 86400000) return;
        }

        const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    const close = useCallback(() => {
        setClosing(true);
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        setTimeout(() => {
            setVisible(false);
            setClosing(false);
        }, 300);
    }, []);

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
                onClick={close}
            />

            {/* Modal */}
            <div
                className={`fixed z-[9999] inset-0 flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ${closing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
                <div
                    className="relative w-full max-w-md pointer-events-auto rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={close}
                        className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Form embed */}
                    <iframe
                        src="https://api.dovito.com/widget/form/5szVTLRB1KReKENh0Qjv"
                        style={{ width: '100%', height: '400px', border: 'none' }}
                        id="popup-5szVTLRB1KReKENh0Qjv"
                        data-layout="{'id':'INLINE'}"
                        data-trigger-type="alwaysShow"
                        data-trigger-value=""
                        data-activation-type="alwaysActivated"
                        data-activation-value=""
                        data-deactivation-type="neverDeactivate"
                        data-deactivation-value=""
                        data-form-name="E-Email"
                        data-height="400"
                        data-layout-iframe-id="popup-5szVTLRB1KReKENh0Qjv"
                        data-form-id="5szVTLRB1KReKENh0Qjv"
                        title="The 1159 Signup"
                    />
                </div>
            </div>
        </>
    );
}
