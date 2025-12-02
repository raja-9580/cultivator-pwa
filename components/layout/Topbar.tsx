'use client';

import Logo from '@/components/ui/Logo';

export default function Topbar() {
  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-13 md:h-14 bg-dark-surface/95 backdrop-blur-sm border-b border-gray-800/40 z-30 flex items-center px-3 md:px-6">
      <div className="flex items-center justify-between w-full">
        {/* Mobile: Akaththi Farm Branding */}
        <div className="flex items-center gap-2 md:hidden">
          <Logo className="w-7 h-7" />
          <div>
            <h1 className="text-sm font-semibold text-accent-leaf">Akaththi Farm</h1>
            <p className="text-[10px] text-gray-500">Smart Cultivation</p>
          </div>
        </div>

        {/* Desktop: Generic Title */}
        <div className="hidden md:flex items-center gap-3">
          <Logo className="w-7 h-7" />
          <h2 className="text-lg font-normal text-gray-200">
            Cultivation Management System
          </h2>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 md:w-9 h-8 md:h-9 rounded-full bg-accent-leaf/5 border border-accent-leaf/20 flex items-center justify-center text-xs font-medium text-accent-leaf hover-glow">
            ◉
          </div>
        </div>
      </div>
    </header>
  );
}
