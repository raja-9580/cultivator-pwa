'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function BottomNav() {
    const pathname = usePathname();
    const [showMore, setShowMore] = useState(false);

    const navItems = [
        {
            href: '/',
            label: 'Home',
            icon: '🏠',
            active: pathname === '/'
        },
        {
            href: '/batches',
            label: 'Batches',
            icon: '🌾',
            active: pathname?.startsWith('/batches')
        },
        {
            href: '/metrics',
            label: 'Scan',
            icon: '📱',
            active: pathname === '/metrics',
            highlight: true // Special scan button
        },
        {
            href: '/status-logger',
            label: 'Status',
            icon: '📊',
            active: pathname === '/status-logger'
        },
        {
            href: '#',
            label: 'More',
            icon: '⋯',
            onClick: () => setShowMore(!showMore),
            active: false
        },
    ];

    const moreItems = [
        { href: '/baglets', label: '🏷️ Baglets', active: pathname === '/baglets' },
        { href: '/harvest', label: '🌿 Harvest', active: pathname === '/harvest' },
        { href: '/reports', label: '📈 Reports', active: pathname === '/reports' },
    ];

    return (
        <>
            {/* Bottom Navigation - Mobile Only */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-gray-800/50 backdrop-blur-lg z-40 safe-area-inset-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => {
                                if (item.onClick) {
                                    e.preventDefault();
                                    item.onClick();
                                }
                            }}
                            className={`
                flex flex-col items-center justify-center
                min-w-[64px] h-12 px-2 rounded-lg
                transition-all duration-200
                ${item.active
                                    ? 'text-accent-sky bg-accent-sky/10'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                                }
                ${item.highlight
                                    ? 'relative -mt-2 scale-110 bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
                                    : ''
                                }
              `}
                        >
                            <span className={`text-xl mb-0.5 ${item.highlight ? 'text-2xl' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-medium ${item.highlight ? 'text-xs' : ''}`}>
                                {item.label}
                            </span>
                            {item.active && !item.highlight && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-sky rounded-full" />
                            )}
                        </Link>
                    ))}
                </div>
            </nav>

            {/* More Menu Overlay */}
            {showMore && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => setShowMore(false)}
                    />

                    {/* More Menu */}
                    <div className="md:hidden fixed bottom-16 left-0 right-0 bg-dark-surface border-t border-gray-800/50 shadow-2xl z-50 animate-slide-up">
                        <div className="p-4 space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">More Options</p>
                            {moreItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setShowMore(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${item.active
                                            ? 'bg-accent-sky/10 text-accent-sky'
                                            : 'hover:bg-gray-800/30 text-gray-300'
                                        }
                  `}
                                >
                                    <span className="text-lg">{item.label}</span>
                                </Link>
                            ))}

                            {/* Close Button */}
                            <button
                                onClick={() => setShowMore(false)}
                                className="w-full mt-4 px-4 py-3 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Spacer - Prevents content from being hidden behind nav */}
            <div className="md:hidden h-20" />

            {/* Signature - Mobile only, below bottom nav */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 bg-dark-surface/60 backdrop-blur-sm border-t border-gray-800/20 py-1.5 z-35 text-center">
                <p className="text-[9px] text-gray-500">
                    Engineered by{' '}
                    <span className="text-accent-leaf font-semibold">Raja Selvaraj</span>
                </p>
            </div>
        </>
    );
}
