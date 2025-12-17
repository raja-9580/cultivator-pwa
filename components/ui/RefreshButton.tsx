'use client';

import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
    onClick: () => void;
    className?: string;
    loading?: boolean;
}

export function RefreshButton({ onClick, className, loading = false }: RefreshButtonProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            disabled={loading}
            className={cn(
                "p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all",
                loading && "opacity-50 cursor-not-allowed",
                className
            )}
            title="Refresh Data"
        >
            <RotateCw
                size={14}
                className={cn("transition-transform", loading && "animate-spin")}
            />
        </button>
    );
}
