'use client';


import Logo from '@/components/ui/Logo';

import { APP_CONFIG } from '@/lib/app-config';

export default function Topbar() {


  return (
    <header className="fixed top-0 left-0 right-0 h-13 md:hidden glass-panel border-b-0 z-30 flex items-center px-4">
      <div className="flex items-center justify-between w-full">
        {/* Mobile: Minimal Logo */}
        {/* Mobile: Logo or Page Title */}
        <div className="flex items-center gap-3 md:hidden">
          <Logo className="w-8 h-8 text-accent-neon-green" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-wide leading-none">{APP_CONFIG.company}</span>
            <span className="text-[10px] text-accent-neon-green/80 tracking-wider leading-none mt-0.5">{APP_CONFIG.name}</span>
          </div>
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
