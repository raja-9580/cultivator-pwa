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
        className={`hidden md:flex fixed left-0 top-0 h-screen w-64 bg-dark-surface border-r border-gray-800/20 shadow-lg z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-800/20">
          <div className="flex items-center gap-3 mb-1">
            <Logo className="w-8 h-8" />
            <h1 className="text-xl font-semibold text-accent-leaf">Akaththi Farm</h1>
          </div>
          <p className="text-xs text-gray-500 ml-11">Smart Cultivation</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-2 py-1.5 rounded-lg transition-all border-l-2 text-sm ${isActive(item.href)
                    ? 'border-l-accent-leaf text-accent-leaf font-medium pl-2.5 bg-accent-leaf/5 nav-highlight'
                    : 'text-gray-400 hover:bg-dark-surface-light/20 hover:text-gray-200 border-l-transparent'
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-gray-800/20 text-xs text-gray-500">
          <p className="text-gray-400">
            Engineered by{' '}
            <span className="text-accent-leaf font-semibold">Raja Selvaraj</span>
          </p>
        </div>
      </aside>
    </>
  );
}
