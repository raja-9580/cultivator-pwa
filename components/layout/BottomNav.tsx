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
            href: '/baglets',
            label: 'Baglets',
            icon: '📦',
            active: pathname?.startsWith('/baglets')
        },
        {
            href: '/status-logger',
            label: 'Status',
            icon: '📊',
            active: pathname === '/status-logger'
        },
        {
            label: 'More',
            icon: '☰',
            // Active if any of the hidden paths are active
            active: ['/harvest', '/crc', '/reports', '/profile'].some(path => pathname?.startsWith(path)),
            isButton: true
        },
    ];

    const moreItems = [
        { href: '/harvest', label: '🌿 Harvest', active: pathname === '/harvest' },
        { href: '/crc', label: '🧪 CRC Analysis', active: pathname?.startsWith('/crc') },
        { href: '/reports', label: '📈 Reports', active: pathname === '/reports' },
        { href: '/profile', label: '👤 Profile', active: pathname === '/profile' },
    ];

    return (
        <>
            {/* Bottom Navigation - Mobile Only */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-gray-800/50 backdrop-blur-lg z-40 safe-area-inset-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => (
                        item.isButton ? (
                            <button
                                key={item.label}
                                onClick={() => setShowMore(true)}
                                className={`
                                    flex flex-col items-center justify-center
                                    min-w-[64px] h-12 px-2 rounded-lg
                                    transition-all duration-200
                                    ${item.active ? 'text-accent-sky bg-accent-sky/10' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'}
                                `}
                            >
                                <span className="text-xl mb-0.5">{item.icon}</span>
                                <span className="text-[10px] font-medium">{item.label}</span>
                                {item.active && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-sky rounded-full" />
                                )}
                            </button>
                        ) : (
                            <Link
                                key={item.href}
                                href={item.href!}
                                className={`
                                    flex flex-col items-center justify-center
                                    min-w-[64px] h-12 px-2 rounded-lg
                                    transition-all duration-200
                                    ${item.active ? 'text-accent-sky bg-accent-sky/10' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'}
                                `}
                            >
                                <span className="text-xl mb-0.5">{item.icon}</span>
                                <span className="text-[10px] font-medium">{item.label}</span>
                                {item.active && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-sky rounded-full" />
                                )}
                            </Link>
                        )
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
                    <div className="md:hidden fixed bottom-16 left-0 right-0 bg-dark-surface border-t border-gray-800/50 shadow-2xl z-50 animate-slide-up rounded-t-2xl">
                        <div className="p-4 space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-2">More Options</p>
                            {moreItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setShowMore(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl
                                        transition-all duration-200
                                        ${item.active ? 'bg-accent-sky/10 text-accent-sky' : 'hover:bg-gray-800/30 text-gray-300'}
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

        </>
    );
}
