'use client';

import Card from '@/components/ui/Card';
import { useState } from 'react';
import Link from 'next/link';

interface Baglet {
    id: string;
    batchId: string;
    sequence: number;
    status: string;
    statusUpdatedAt: string;
    weight: number | null;
    temperature: number | null;
    humidity: number | null;
    ph?: number | null;
    createdAt: string;
}

interface BagletsListProps {
    baglets: Baglet[];
}

const STATUS_COLORS: Record<string, string> = {
    PLANNED: 'bg-gray-700 text-gray-300',
    PREPARED: 'bg-blue-700 text-blue-200',
    STERILIZED: 'bg-orange-700 text-orange-200',
    INOCULATED: 'bg-purple-700 text-purple-200',
    INCUBATED: 'bg-yellow-700 text-yellow-200',
    PINNED: 'bg-green-700 text-green-200',
    HARVESTED: 'bg-accent-leaf text-gray-900',
    CONTAMINATED: 'bg-red-700 text-red-200',
    DISPOSED: 'bg-gray-800 text-gray-400',
};

export default function BagletsList({ baglets }: BagletsListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Get unique statuses
    const uniqueStatuses = Array.from(new Set(baglets.map((b) => b.status))).sort();

    // Filter baglets
    const filteredBaglets = baglets.filter((baglet) => {
        const matchesSearch = baglet.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || baglet.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <Card className="border border-gray-800/30">
            <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg md:text-xl font-semibold text-accent-leaf">
                        Baglets ({baglets.length})
                    </h2>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Search by Baglet ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-800/30 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-leaf/50"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-800/30 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-leaf/50"
                    >
                        <option value="" className="bg-gray-900 text-gray-200">All Statuses</option>
                        {uniqueStatuses.map((status) => (
                            <option key={status} value={status} className="bg-gray-900 text-gray-200">
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Mobile: Card List */}
                <div className="md:hidden flex flex-col gap-3">
                    {filteredBaglets.map((baglet) => (
                        <div
                            key={baglet.id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors space-y-3 shadow-sm shadow-black/20"
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-start gap-3">
                                    <Link
                                        href={`/baglets/${baglet.id}`}
                                        className="text-[11px] font-bold text-accent-neon-green hover:text-accent-neon-blue transition-colors font-mono break-all leading-relaxed"
                                    >
                                        {baglet.id}
                                    </Link>
                                    <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter shrink-0 ${STATUS_COLORS[baglet.status] || 'bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        {baglet.status}
                                    </span>
                                </div>

                                <div className="flex items-start justify-between gap-2 pt-3 border-t border-white/5">
                                    {baglet.weight !== null && (
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-0.5 truncate">Weight</span>
                                            <span className="text-[10px] font-mono font-black text-white truncate">{baglet.weight}g</span>
                                        </div>
                                    )}
                                    {baglet.temperature !== null && (
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-0.5 truncate">Temp</span>
                                            <span className="text-[10px] font-mono font-black text-gray-200 truncate">{baglet.temperature}°C</span>
                                        </div>
                                    )}
                                    {baglet.humidity !== null && (
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-0.5 truncate">Humid</span>
                                            <span className="text-[10px] font-mono font-black text-gray-200 truncate">{baglet.humidity}%</span>
                                        </div>
                                    )}
                                    {baglet.ph !== undefined && baglet.ph !== null && (
                                        <div className="flex flex-col min-w-0 flex-1 pl-1 border-l border-white/5">
                                            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-0.5 truncate">pH</span>
                                            <span className="text-[10px] font-mono font-black text-gray-200 truncate">{baglet.ph}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredBaglets.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No baglets found matching your filters
                        </div>
                    )}
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800/20 bg-dark-surface-light/60">
                                <th className="text-left py-3 px-4 font-semibold text-gray-200 text-xs w-1/3">
                                    Baglet ID
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-200 text-xs">
                                    Status
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-200 text-xs">
                                    Weight
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-200 text-xs">
                                    Temp
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-200 text-xs">
                                    RH
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-200 text-xs">
                                    pH
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBaglets.map((baglet) => (
                                <tr
                                    key={baglet.id}
                                    className="border-b border-gray-800/20 hover:bg-dark-surface-light/20 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <Link
                                            href={`/baglets/${baglet.id}`}
                                            className="text-accent-leaf hover:text-accent-sky transition-colors font-mono text-xs block truncate"
                                        >
                                            {baglet.id}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-md font-medium ${STATUS_COLORS[baglet.status] || 'bg-gray-700 text-gray-300'
                                                }`}
                                        >
                                            {baglet.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-400 text-right font-mono">
                                        {baglet.weight !== null ? `${baglet.weight} g` : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-gray-400 text-right font-mono">
                                        {baglet.temperature !== null ? `${baglet.temperature}°C` : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-gray-400 text-right font-mono">
                                        {baglet.humidity !== null ? `${baglet.humidity}%` : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-gray-400 text-right font-mono">
                                        {baglet.ph !== undefined && baglet.ph !== null ? baglet.ph : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                    {filteredBaglets.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No baglets found matching your filters
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
