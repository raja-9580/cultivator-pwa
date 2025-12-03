'use client';

import * as React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export default function BottomSheet({
    isOpen,
    onClose,
    children,
    title,
    className,
}: BottomSheetProps) {
    // Drag logic
    const onDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Close if dragged down sufficiently
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={onDragEnd}
                        className={cn(
                            "fixed bottom-0 left-0 right-0 z-[60] bg-dark-surface border-t border-gray-800 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col",
                            className
                        )}
                    >
                        {/* Handle for dragging */}
                        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none">
                            <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-4 py-2 flex items-center justify-between border-b border-gray-800/50 shrink-0">
                            {title && <h2 className="text-lg font-semibold text-gray-100">{title}</h2>}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-full hover:bg-gray-800/50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 overscroll-contain pb-safe">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
