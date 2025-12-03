'use client';

import Link from 'next/link';

import Button from '@/components/ui/Button';
import { Batch } from '@/lib/types';



function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

interface BatchCardProps {
    batch: Batch;
    onStatusUpdate: (batchId: string, action: 'sterilize' | 'inoculate') => void;
    updatingBatch: string | null;
}

export default function BatchCard({ batch, onStatusUpdate, updatingBatch }: BatchCardProps) {
    const isUpdating = updatingBatch === batch.id;

    return (
        <div className="bg-dark-surface border border-gray-800/30 rounded-xl p-4 hover:border-gray-700/50 transition-all duration-200 shadow-sm hover:shadow-md">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <Link
                        href={`/batches/${batch.id}`}
                        className="text-accent-leaf hover:text-accent-sky font-semibold text-sm transition-colors block truncate"
                    >
                        🌾 {batch.id}
                    </Link>
                    <p className="text-gray-400 text-xs mt-0.5">{batch.mushroomType}</p>
                </div>

            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-800/30">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Baglets</p>
                    <p className="text-sm font-medium text-gray-200">
                        {batch.actualBagletCount} / {batch.plannedBagletCount}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Created</p>
                    <p className="text-sm font-medium text-gray-200">{formatDate(batch.createdDate)}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
                <Link
                    href={`/batches/${batch.id}`}
                    className="flex-1 min-w-[100px] text-center bg-gray-800/40 hover:bg-gray-800/60 text-gray-200 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                    View Details
                </Link>

                {(batch.bagletStatusCounts?.['PLANNED'] ?? 0) > 0 && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-3 py-2"
                        onClick={() => onStatusUpdate(batch.id, 'sterilize')}
                        disabled={isUpdating}
                    >
                        {isUpdating ? '...' : '🔥 Sterilize'}
                    </Button>
                )}

                {(batch.bagletStatusCounts?.['STERILIZED'] ?? 0) > 0 && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-3 py-2"
                        onClick={() => onStatusUpdate(batch.id, 'inoculate')}
                        disabled={isUpdating}
                    >
                        {isUpdating ? '...' : '💉 Inoculate'}
                    </Button>
                )}
            </div>
        </div>
    );
}
