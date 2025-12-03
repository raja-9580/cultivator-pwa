'use client';

import Logo from '@/components/ui/Logo';

export default function Topbar() {
  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-13 md:h-14 glass-panel border-b-0 z-30 flex items-center px-4 md:px-6">
      <div className="flex items-center justify-between w-full">
        {/* Mobile: Minimal Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <Logo className="w-8 h-8 text-accent-neon-green" />
          <span className="text-lg font-bold text-gray-100 tracking-tight">Cultivator</span>
        </div>

        {/* Desktop: Context/Breadcrumb (Placeholder) */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm font-medium text-gray-400">Dashboard</span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 md:w-9 h-8 md:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-medium text-accent-neon-green hover:bg-accent-neon-green/10 transition-colors cursor-pointer">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-neon-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-neon-green"></span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
