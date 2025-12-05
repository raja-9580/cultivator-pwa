'use client';

import { usePathname } from 'next/navigation';
import Logo from '@/components/ui/Logo';

export default function Topbar() {
  const pathname = usePathname();
  const isStatusLogger = pathname?.startsWith('/status-logger');

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-13 md:h-14 glass-panel border-b-0 z-30 flex items-center px-4 md:px-6">
      <div className="flex items-center justify-between w-full">
        {/* Mobile: Minimal Logo */}
        {/* Mobile: Logo or Page Title */}
        <div className="flex items-center gap-3 md:hidden">
          {isStatusLogger ? (
            <span className="text-lg font-bold text-gray-100 tracking-tight">Status Manager</span>
          ) : (
            <>
              <Logo className="w-8 h-8 text-accent-neon-green" />
              <span className="text-lg font-bold text-gray-100 tracking-tight">Cultivator</span>
            </>
          )}
        </div>

        {/* Desktop: Context/Breadcrumb (Placeholder) */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm font-medium text-gray-400">Dashboard</span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Placeholder for future actions/profile */}
        </div>
      </div>
    </header>
  );
}
