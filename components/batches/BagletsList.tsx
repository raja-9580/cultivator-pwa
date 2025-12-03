'use client';

import Card from '@/components/ui/Card';
import { useState } from 'react';

interface Baglet {
    id: string;
    batchId: string;
    sequence: number;
    status: string;
    statusUpdatedAt: string;
    weight: number | null;
    temperature: number | null;
    humidity: number | null;
    contaminated: boolean;
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
                        className="w-full px-3 py-2 bg-dark-surface-light/20 border border-gray-800/30 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-leaf/50"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-surface-light/20 border border-gray-800/30 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-leaf/50"
                    >
                        <option value="">All Statuses</option>
                        {uniqueStatuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Mobile: Card List */}
                <div className="md:hidden space-y-3">
                    {filteredBaglets.map((baglet) => (
                        <div
                            key={baglet.id}
                            className="bg-dark-surface-light/20 border border-gray-800/30 rounded-lg p-3"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <a
                                    href={`/baglets?search=${encodeURIComponent(baglet.id)}`}
                                    className="text-sm font-medium text-accent-leaf hover:text-accent-sky transition-colors"
                                >
                                    #{baglet.sequence.toString().padStart(3, '0')}
                                </a>
                                <span
                                    className={`text-xs px-2 py-1 rounded-md font-medium ${STATUS_COLORS[baglet.status] || 'bg-gray-700 text-gray-300'
                                        }`}
                                >
                                    {baglet.status}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 font-mono mb-2">
                                {baglet.id}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                {baglet.weight !== null && (
                                    <div>
                                        <span className="text-gray-500">Weight:</span>
                                        <span className="text-gray-300 ml-1">{baglet.weight}g</span>
                                    </div>
                                )}
                                {baglet.temperature !== null && (
                                    <div>
                                        <span className="text-gray-500">Temp:</span>
                                        <span className="text-gray-300 ml-1">{baglet.temperature}°C</span>
                                    </div>
                                )}
                                {baglet.humidity !== null && (
                                    <div>
                                        <span className="text-gray-500">RH:</span>
                                        <span className="text-gray-300 ml-1">{baglet.humidity}%</span>
                                    </div>
                                )}
                            </div>
                            {baglet.contaminated && (
                                <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span>Contaminated</span>
                                </div>
                            )}
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
                                <th className="text-left py-3 px-4 font-semibold text-gray-200 text-xs">
                                    #
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-200 text-xs">
                                    Baglet ID
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-200 text-xs">
                                    Status
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-200 text-xs">
                                    Weight
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-200 text-xs">
                                    Temp
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-200 text-xs">
                                    Humidity
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-200 text-xs">
                                    Flags
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
                                        <span className="text-gray-400 font-mono text-xs">
                                            #{baglet.sequence.toString().padStart(3, '0')}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <a
                                            href={`/baglets?search=${encodeURIComponent(baglet.id)}`}
                                            className="text-accent-leaf hover:text-accent-sky transition-colors font-mono text-xs"
                                        >
                                            {baglet.id}
                                        </a>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-md font-medium ${STATUS_COLORS[baglet.status] || 'bg-gray-700 text-gray-300'
                                                }`}
                                        >
                                            {baglet.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-400">
                                        {baglet.weight !== null ? `${baglet.weight} g` : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-gray-400">
                                        {baglet.temperature !== null ? `${baglet.temperature}°C` : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-gray-400">
                                        {baglet.humidity !== null ? `${baglet.humidity}%` : '—'}
                                    </td>
                                    <td className="py-3 px-4">
                                        {baglet.contaminated && (
                                            <span className="text-red-400 text-xs">⚠️ Contaminated</span>
                                        )}
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
