'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { openSignupPopup } from '@/components/ui/signup-popup';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/projects', label: 'Projects' },
    { href: '/resources', label: 'Resources' },
    { href: '/resume', label: 'Resume' },
    { href: '/about', label: 'About' },
    { href: 'https://wedding.dkcoleman.com', label: 'Wedding', external: true },
];

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const toggleMenu = () => {
        if (isOpen) {
            closeMenu();
        } else {
            setIsOpen(true);
            setIsClosing(false);
        }
    };

    const closeMenu = () => {
        setIsClosing(true);
        // Wait for slide-out animation to complete (last item delay + animation duration)
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 250 + (navLinks.length - 1) * 50); // Last item delay + animation duration
    };

    // Listen for toggle event from external button
    useEffect(() => {
        const handleToggle = () => {
            if (isOpen) {
                closeMenu();
            } else {
                setIsOpen(true);
                setIsClosing(false);
            }
        };
        window.addEventListener('toggle-mobile-nav', handleToggle);
        return () => window.removeEventListener('toggle-mobile-nav', handleToggle);
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className={`fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300 ${
                        isClosing ? 'opacity-0' : 'opacity-100'
                    }`}
                    onClick={closeMenu}
                />
            )}

            {/* Close Button - Positioned over hamburger */}
            {isOpen && (
                <button
                    onClick={closeMenu}
                    className={`fixed top-4 right-4 z-[70] p-3 rounded-full bg-background/90 backdrop-blur-xl border border-border/50 shadow-2xl hover:scale-110 transition-all duration-300 md:hidden ${
                        isClosing ? 'animate-[slideOut_0.2s_ease-in_forwards]' : 'animate-[slideIn_0.2s_ease-out_forwards]'
                    }`}
                    aria-label="Close menu"
                    style={{ opacity: 0 }}
                >
                    <X className="h-5 w-5" />
                </button>
            )}

            {/* Floating Pills Container */}
            {isOpen && (
                <div className="fixed inset-0 z-[65] md:hidden flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col gap-3 items-center pointer-events-auto">
                        {/* Navigation Pills */}
                        {navLinks.map((link, index) => {
                            const pillClass = `w-40 px-6 py-3 rounded-full backdrop-blur-xl border shadow-xl hover:scale-105 transition-all duration-300 text-center ${
                                isClosing
                                    ? 'animate-[slideOut_0.25s_ease-in_forwards]'
                                    : 'animate-[slideIn_0.25s_ease-out_forwards]'
                            } ${pathname === link.href
                                ? 'bg-primary/90 border-primary/50 text-primary-foreground shadow-primary/30'
                                : 'bg-background/90 border-border/50 hover:border-primary/30 hover:shadow-primary/20'
                            }`;
                            const pillStyle = {
                                animationDelay: `${index * 50}ms`,
                                opacity: isClosing ? 1 : 0
                            };
                            return link.external ? (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={closeMenu}
                                    className={pillClass}
                                    style={pillStyle}
                                >
                                    <span className="font-medium whitespace-nowrap">{link.label}</span>
                                </a>
                            ) : (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={closeMenu}
                                    className={pillClass}
                                    style={pillStyle}
                                >
                                    <span className="font-medium whitespace-nowrap">{link.label}</span>
                                </Link>
                            );
                        })}
                        {/* 1159 Signup Button */}
                        <button
                            onClick={() => { closeMenu(); openSignupPopup(); }}
                            className={`w-40 px-6 py-3 rounded-full backdrop-blur-xl border shadow-xl hover:scale-105 transition-all duration-300 text-center bg-transparent border-border/50 hover:border-primary/30 hover:shadow-primary/20 ${
                                isClosing
                                    ? 'animate-[slideOut_0.25s_ease-in_forwards]'
                                    : 'animate-[slideIn_0.25s_ease-out_forwards]'
                            }`}
                            style={{
                                animationDelay: `${navLinks.length * 50}ms`,
                                opacity: isClosing ? 1 : 0
                            }}
                        >
                            <span className="font-medium whitespace-nowrap">1159</span>
                        </button>
                        {/* Theme Toggle - hidden on home page */}
                        {pathname !== '/' && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className={`w-40 px-6 py-3 rounded-full backdrop-blur-xl border shadow-xl hover:scale-105 transition-all duration-300 text-center bg-transparent border-border/50 hover:border-primary/30 hover:shadow-primary/20 flex items-center justify-center gap-2 ${
                                    isClosing
                                        ? 'animate-[slideOut_0.25s_ease-in_forwards]'
                                        : 'animate-[slideIn_0.25s_ease-out_forwards]'
                                }`}
                                style={{
                                    animationDelay: `${(navLinks.length + 1) * 50}ms`,
                                    opacity: isClosing ? 1 : 0
                                }}
                            >
                                <Sun className="h-4 w-4 dark:hidden" />
                                <Moon className="h-4 w-4 hidden dark:block" />
                                <span className="font-medium whitespace-nowrap">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

                    <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(50px);
          }
        }
      `}</style>
                </>
            );
}
