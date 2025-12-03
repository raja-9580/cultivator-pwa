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
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-45 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className="fixed bottom-20 right-5 md:hidden flex flex-col items-end gap-3 z-50">
        {isOpen && (
          <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2">
            {actions.map((action, idx) => (
              <React.Fragment key={idx}>
                {action.href ? (
                  <Link
                    href={action.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 bg-dark-surface border border-gray-700 rounded-full px-5 py-3 text-sm font-medium text-gray-200 shadow-xl active:scale-95 transition-all"
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
                    className="flex items-center gap-3 bg-dark-surface border border-gray-700 rounded-full px-5 py-3 text-sm font-medium text-gray-200 shadow-xl active:scale-95 transition-all"
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
          className={`
            w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
            ${isOpen
              ? 'bg-gray-700 text-gray-200 rotate-45'
              : 'bg-accent-leaf text-black hover:bg-accent-leaf/90 hover:scale-105'
            }
          `}
        >
          <span className="text-2xl font-bold">+</span>
        </button>
      </div>
    </>
  );
}
