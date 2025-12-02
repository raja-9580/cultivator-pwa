import React, { useState } from 'react';
import Link from 'next/link';

interface FABAction {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
}

export default function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 md:hidden flex flex-col items-end gap-3 z-40">
      {isOpen && (
        <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2">
          {actions.map((action, idx) => (
            <React.Fragment key={idx}>
              {action.href ? (
                <Link
                  href={action.href}
                  className="flex items-center gap-2 bg-dark-surface border border-gray-800/40 rounded-lg px-4 py-3 text-sm text-gray-300 hover:text-accent-leaf hover:border-accent-leaf/40 transition-all min-h-[44px]"
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="whitespace-nowrap">{action.label}</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    action.onClick?.();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 bg-dark-surface border border-gray-800/40 rounded-lg px-4 py-3 text-sm text-gray-300 hover:text-accent-leaf hover:border-accent-leaf/40 transition-all min-h-[44px]"
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="whitespace-nowrap">{action.label}</span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-accent-leaf/20 border-2 border-accent-leaf text-accent-leaf flex items-center justify-center shadow-lg hover:bg-accent-leaf/30 transition-all hover-glow"
      >
        <span className="text-xl font-bold">{isOpen ? '✕' : '+'}</span>
      </button>
    </div>
  );
}
