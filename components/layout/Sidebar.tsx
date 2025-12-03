'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Logo from '@/components/ui/Logo';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Batches', href: '/batches' },
    { label: 'Baglets', href: '/baglets' },
    { label: 'Metrics', href: '/metrics' },
    { label: 'Harvest', href: '/harvest' },
    { label: 'Status Logger', href: '/status-logger' },
    { label: 'Reports', href: '/reports' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile toggle button - HIDDEN on mobile, bottom nav replaces it */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:hidden"
      >
        ☰
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Desktop/Tablet only, bottom nav replaces it on mobile */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen w-64 glass-panel border-r-0 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo/Brand - Minimal */}
        <div className="p-6 flex items-center justify-center border-b border-white/5">
          <Logo className="w-10 h-10 text-accent-neon-green" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl transition-all text-sm font-medium ${isActive(item.href)
                    ? 'bg-accent-neon-green/10 text-accent-neon-green border border-accent-neon-green/20 shadow-[0_0_15px_rgba(0,255,157,0.1)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
