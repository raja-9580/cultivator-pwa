'use client';

import Link from 'next/link';
import { Batch } from '@/lib/types';
import { getBatchWorkflowStage, INOCULATION_TRANSITION, getStatusCount } from '@/lib/baglet-workflow';
import { FileText, Database } from 'lucide-react';

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
}

export default function BatchCard({ batch, onStatusUpdate, onPrepare, updatingBatch }: BatchCardProps) {
    const isUpdating = updatingBatch === batch.id;
    const stage = getBatchWorkflowStage(batch.bagletStatusCounts);

    return (
        <div className="bg-[#0A0A0A] border border-white/[0.05] rounded-xl p-3.5 hover:border-accent-leaf/30 transition-all duration-300 relative group overflow-hidden flex flex-col">
            {/* Top Row: Mushroom & Vital Stats */}
            <div className="flex justify-between items-start gap-3 mb-0.5">
                <span className="text-[13px] font-black text-white leading-tight uppercase tracking-tight truncate flex-1">
                    {batch.mushroomType}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black text-gray-700 tabular-nums">#{batch.batchSequence}</span>
                    <div className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-black tabular-nums leading-none border ${batch.actualBagletCount < batch.plannedBagletCount
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                        : 'bg-accent-leaf/5 border-accent-leaf/10 text-accent-leaf/80'
                        }`}>
                        {batch.actualBagletCount}/{batch.plannedBagletCount}
                    </div>
                </div>
            </div>

            {/* Vendor Row: Compact but full visibility */}
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-snug mb-3 line-clamp-2 min-h-[1.5rem]">
                {batch.vendorName}
            </div>

            {/* Center: The Primary ID */}
            <div className="mb-4">
                <Link
                    href={`/batches/${batch.id}`}
                    className="text-lg font-black text-accent-leaf hover:text-white transition-all tracking-tighter break-all block leading-none"
                >
                    {batch.id}
                </Link>
            </div>

            {/* Footer: Multi-info Row */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.03]">
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                        <span>{formatDate(batch.preparedDate)}</span>
                        <span className="text-gray-700">•</span>
                        <span className="text-gray-600 truncate max-w-[60px]">{(batch.createdBy?.split('@')[0] || '—').toLowerCase()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Substrate Popover */}
                    <details className="group/sub relative">
                        <summary className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-gray-600 hover:text-accent-leaf list-none cursor-pointer transition-colors active:scale-90">
                            <Database size={13} />
                        </summary>
                        <div className="absolute bottom-full right-0 mb-3 w-56 p-3 rounded-xl bg-[#111] border border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-1">Substrate Context</span>
                                <span className="text-[11px] text-gray-300 font-medium leading-relaxed">{batch.substrateDescription}</span>
                                <span className="text-[9px] text-gray-600 font-mono uppercase tracking-tighter">{batch.substrateCode}</span>
                            </div>
                        </div>
                    </details>

                    {/* Workflow Action */}
                    {(stage === 'PREPARE' || stage === 'RESUME') && (
                        <button
                            onClick={() => onPrepare(batch.id)}
                            disabled={isUpdating}
                            className="h-8 px-4 rounded-lg bg-accent-leaf text-black text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all"
                        >
                            {isUpdating ? '...' : (stage === 'RESUME' ? 'RESUME' : 'PREPARE')}
                        </button>
                    )}

                    {stage === 'STERILIZE' && (
                        <button
                            onClick={() => onStatusUpdate(batch.id, 'sterilize')}
                            disabled={isUpdating}
                            className="h-8 px-4 rounded-lg bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-600/10 transition-all"
                        >
                            {isUpdating ? '...' : 'STERILIZE'}
                        </button>
                    )}

                    {stage === 'INOCULATE' && (
                        <button
                            onClick={() => onStatusUpdate(batch.id, 'inoculate')}
                            disabled={isUpdating}
                            className="h-8 px-4 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/10 transition-all"
                        >
                            {isUpdating ? '...' : 'INOCULATE'}
                        </button>
                    )}

                    {getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.to) > 0 && (
                        <button
                            onClick={() => {
                                window.location.href = `/api/batches/${batch.id}/export-labels`;
                            }}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <FileText size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
