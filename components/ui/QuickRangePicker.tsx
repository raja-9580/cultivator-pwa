
'use client';

import React from 'react';
import { TimeRangeMode } from '@/lib/time-utils';

interface QuickRangePickerProps {
    activeMode: TimeRangeMode;
    onChange: (mode: TimeRangeMode) => void;
    modes?: TimeRangeMode[];
    className?: string;
}

export default function QuickRangePicker({
    activeMode,
    onChange,
    modes = ['1m', '3m', 'all'],
    className = ''
}: QuickRangePickerProps) {
    return (
        <div className={`flex bg-white/5 p-1 rounded-lg border border-white/10 ${className}`}>
            {modes.map((mode) => (
                <button
                    key={mode}
                    onClick={() => onChange(mode)}
                    className={`px-3 py-1 text-[10px] md:text-xs rounded-md transition-all font-bold uppercase tracking-wide ${activeMode === mode
                        ? 'bg-accent-leaf text-white shadow-lg scale-100'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {mode === 'all' ? 'ALL' : mode.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
