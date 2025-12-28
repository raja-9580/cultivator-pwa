'use client';

import Link from 'next/link';
import { Batch } from '@/lib/types';
import { getBatchWorkflowStage, INOCULATION_TRANSITION, getStatusCount } from '@/lib/baglet-workflow';
import { FileText, Info } from 'lucide-react';

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
    onPrepare: (batchId: string) => void;
    updatingBatch: string | null;
    openSubstrateId: string | null;
    onToggleSubstrate: (batchId: string) => void;
}

export default function BatchCard({ batch, onStatusUpdate, onPrepare, updatingBatch, openSubstrateId, onToggleSubstrate }: BatchCardProps) {
    const isUpdating = updatingBatch === batch.id;
    const stage = getBatchWorkflowStage(batch.bagletStatusCounts);
    const isSubstrateOpen = openSubstrateId === batch.id;

    return (
        <div className="card space-y-3 shadow-sm shadow-black/20 hover:bg-white/10">
            {/* Header: ID and Status */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <Link
                        href={`/batches/${batch.id}`}
                        className="font-mono text-xs text-accent-leaf font-bold break-all leading-relaxed block mb-1"
                    >
                        {batch.id}
                    </Link>
                    <div className="text-xxs text-gray-500 font-medium uppercase tracking-wider">
                        SEQ: <span className="text-gray-400">#{batch.batchSequence}</span>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xxs font-black uppercase tracking-wider border ${batch.actualBagletCount < batch.plannedBagletCount
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                    : 'bg-accent-leaf/10 border-accent-leaf/20 text-accent-leaf'
                    }`}>
                    {batch.actualBagletCount} / {batch.plannedBagletCount} UNITS
                </div>
            </div>

            {/* Info Row: Meta info (Type, Vendor, Date) */}
            <div className="flex items-center justify-between py-2 border-y border-white/5">
                <div className="flex flex-col min-w-0 pr-4">
                    <span className="text-xxs text-gray-600 font-bold uppercase tracking-widest mb-0.5">Mushroom</span>
                    <span className="text-xs font-bold text-gray-200 truncate">{batch.mushroomType}</span>
                </div>

                <div className="flex flex-col items-end min-w-0 flex-1">
                    <span className="text-xxs text-gray-600 font-bold uppercase tracking-widest text-right mb-0.5">Prepared</span>
                    <div className="text-xxs font-bold text-white leading-none">
                        {formatDate(batch.preparedDate)}
                    </div>
                </div>
            </div>

            {/* Footer: Actions and Extra Details */}
            <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col min-w-0 max-w-[100px]">
                        <span className="text-xxs text-gray-500 font-bold uppercase tracking-[0.1em] mb-0.5 truncate">Vendor</span>
                        <span className="text-xxs font-bold text-gray-400 truncate">{batch.vendorName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Substrate Popover */}
                    <div className="relative">
                        <button
                            onClick={() => onToggleSubstrate(batch.id)}
                            className={`p-2 rounded-lg border transition-colors active:scale-95 ${isSubstrateOpen
                                ? 'bg-accent-leaf text-black border-accent-leaf'
                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-accent-leaf'
                                }`}
                        >
                            <Info size={14} />
                        </button>
                        {isSubstrateOpen && (
                            <div key={`${batch.id}_details_mobile`} className="absolute bottom-full right-0 mb-3 w-56 p-3 rounded-xl bg-[#111] border border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex flex-col gap-2">
                                    <span className="text-xxs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-1">Batch Details</span>

                                    <span className="text-xs text-gray-300 font-medium leading-relaxed">{batch.substrateDescription}</span>
                                    <span className="text-xxs text-gray-600 font-mono uppercase tracking-tighter">{batch.substrateCode}</span>

                                    <div className="flex justify-between items-center py-0.5 border-t border-white/5 mt-1 pt-1">
                                        <span className="text-xxs text-gray-400 font-bold uppercase tracking-wider">EXP. RATIO</span>
                                        <span className={`text-xs font-mono font-black tracking-tight ${batch.actualExpansionRatio ? 'text-accent-leaf' : 'text-gray-600'}`}>
                                            {batch.actualExpansionRatio ? `${batch.actualExpansionRatio}x` : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Workflow Action */}
                    {(stage === 'PREPARE' || stage === 'RESUME') && (
                        <button
                            onClick={() => onPrepare(batch.id)}
                            disabled={isUpdating}
                            className="h-8 px-4 rounded-lg bg-accent-leaf text-black text-xxs font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-accent-leaf/10"
                        >
                            {isUpdating ? '...' : (stage === 'RESUME' ? 'RESUME' : 'PREPARE')}
                        </button>
                    )}

                    {stage === 'STERILIZE' && (
                        <button
                            onClick={() => onStatusUpdate(batch.id, 'sterilize')}
                            disabled={isUpdating}
                            className="h-8 px-4 rounded-lg bg-orange-600 text-white text-xxs font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-600/10 transition-all"
                        >
                            {isUpdating ? '...' : 'STERILIZE'}
                        </button>
                    )}

                    {stage === 'INOCULATE' && (
                        <button
                            onClick={() => onStatusUpdate(batch.id, 'inoculate')}
                            disabled={isUpdating}
                            className="h-8 px-4 rounded-lg bg-blue-600 text-white text-xxs font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/10 transition-all"
                        >
                            {isUpdating ? '...' : 'INOCULATE'}
                        </button>
                    )}

                    {getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.to) > 0 && (
                        <button
                            onClick={() => {
                                window.location.href = `/api/batches/${batch.id}/export-labels`;
                            }}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-colors"
                        >
                            <FileText size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
