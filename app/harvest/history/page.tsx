'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, TrendingUp, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { HarvestHistoryResult, HarvestHistoryItem } from '@/lib/harvest-actions';

type GroupBy = 'day' | 'week' | 'month';

export default function HarvestHistoryPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<HarvestHistoryResult | null>(null);
    const [groupBy, setGroupBy] = useState<GroupBy>('day');

    // Filters: '1m', '3m', '6m'
    const [filterMode, setFilterMode] = useState<'1m' | '3m' | '6m'>('1m');

    // Pagination: Limit number of Groups displayed (not items)
    const [groupLimit, setGroupLimit] = useState(20);

    // Collapsible Groups State
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Client-Side Filters
    const [selectedMushroom, setSelectedMushroom] = useState<string>('All');
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        // Reset limits when filters change
        setGroupLimit(20);
        setExpandedGroups({});
        fetchHistory();
    }, [filterMode]);

    // Adjust view when grouping changes
    useEffect(() => {
        setExpandedGroups({});
        // For Day view, 20 days is good (~1 screen). For Month/Week 20 is plenty to show all.
        setGroupLimit(20);
    }, [groupBy]);

    const fetchHistory = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            const now = new Date();
            const start = new Date(now);

            if (filterMode === '1m') {
                start.setDate(now.getDate() - 30);
            } else if (filterMode === '3m') {
                start.setDate(now.getDate() - 90);
            } else {
                start.setDate(now.getDate() - 180); // 6m
            }

            params.set('startDate', start.toISOString().split('T')[0]);
            params.set('activeOnly', 'false');

            const res = await fetch(`/api/harvest/history?${params}&_t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
                // Reset mushroom filter if the current selection is no longer available?
                // For now keep 'All' or existing if valid
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Derived Data for Filters
    const mushroomTypes = ['All', ...Array.from(new Set(data?.items.map(i => i.mushroomName) || []))].sort();

    // Grouping Logic - Groups ALL data first, then we paginate the groups
    const groupedItems = (() => {
        if (!data?.items) return {};

        const groups: Record<string, { items: HarvestHistoryItem[], totalWeight: number }> = {};

        // Filter first
        const filtered = data.items.filter(item => {
            if (selectedMushroom !== 'All' && item.mushroomName !== selectedMushroom) return false;
            // Date Filter (YYYY-MM-DD)
            if (selectedDate && !item.timestamp.startsWith(selectedDate)) return false;
            return true;
        });

        // Group everything (Full Dataset)
        filtered.forEach(item => {
            const date = new Date(item.timestamp);
            let key = '';

            if (groupBy === 'day') {
                key = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            } else if (groupBy === 'month') {
                key = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
            } else {
                // Week with Date Range
                const d = new Date(date);
                const day = d.getDay();
                // Calculate Monday
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d.setDate(diff));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);

                const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                const pastDays = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
                const weekNum = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);

                const fmtDate = (dt: Date) => dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                key = `Week ${weekNum}, ${date.getFullYear()} (${fmtDate(monday)} - ${fmtDate(sunday)})`;
            }

            if (!groups[key]) {
                groups[key] = { items: [], totalWeight: 0 };
            }
            groups[key].items.push(item);
            groups[key].totalWeight += item.weight;
        });

        return groups;
    })();

    // Recalculate Summary Stats based on Client Filters
    const filteredStats = (() => {
        if (!data?.items) return { totalWeight: 0, totalCount: 0, topMushroom: '-' };

        // Re-run filter logic (or can I access 'filtered' from above? No, scope issue unless refactored)
        // I'll just filter again for clarity and safety
        const filtered = data.items.filter(item => {
            if (selectedMushroom !== 'All' && item.mushroomName !== selectedMushroom) return false;
            if (selectedDate && !item.timestamp.startsWith(selectedDate)) return false;
            return true;
        });

        const totalWeight = filtered.reduce((sum, start) => sum + start.weight, 0);
        const totalCount = filtered.length;

        // Top Mushroom
        const counts: Record<string, number> = {};
        let maxCount = 0;
        let top = '-';
        filtered.forEach(i => {
            counts[i.mushroomName] = (counts[i.mushroomName] || 0) + 1;
            if (counts[i.mushroomName] > maxCount) {
                maxCount = counts[i.mushroomName];
                top = i.mushroomName;
            }
        });

        return { totalWeight, totalCount, topMushroom: top };
    })();

    // Helper to format large numbers
    const fmtWeight = (g: number) => {
        if (g >= 1000) return `${(g / 1000).toFixed(1)}kg`;
        return `${g.toFixed(0)}g`;
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-48 h-8" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center text-gray-400">Failed to load history</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 pb-20 pt-6 animate-in fade-in duration-500 space-y-6">

            {/* Top Navigation & Time Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/harvest" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white">Harvest History</h1>
                    </div>
                </div>

                {/* Segmented Control for Time */}
                <div className="bg-white/5 p-1 rounded-xl flex self-start md:self-auto w-full md:w-auto">
                    {(['1m', '3m', '6m'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setFilterMode(mode)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide ${filterMode === mode
                                ? 'bg-accent-leaf text-black shadow-lg scale-100'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* HERO STATS CARD (Ultra Compact) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-900/40 to-black border border-white/10 p-3 md:p-5 shadow-xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-accent-leaf/10 blur-3xl rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-5">
                    {/* Main Metric: Yield */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5 text-green-400/80 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                            <TrendingUp size={12} />
                            <span>Total Yield</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl md:text-5xl font-black text-white tracking-tight">
                                {fmtWeight(filteredStats.totalWeight)}
                            </span>
                            <span className="text-[10px] md:text-sm font-medium text-white/50">produced</span>
                        </div>
                    </div>

                    {/* Secondary Metrics (Horizontal) */}
                    <div className="flex gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-6">
                        <div className="flex flex-col justify-end">
                            <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Harvests</span>
                            <div className="flex items-center gap-1.5 text-white">
                                <span className="text-base md:text-lg font-bold">{filteredStats.totalCount}</span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end">
                            <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Top Strain</span>
                            <div className="flex items-center gap-1.5 text-white">
                                <span className="text-base md:text-lg font-bold truncate max-w-[120px]">{filteredStats.topMushroom}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Filters Bar */}
            <div className="sticky top-2 z-20 glass-panel bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex items-center gap-1.5 shadow-xl">
                {/* Type Filter */}
                <div className="relative flex-1 group min-w-0">
                    <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedMushroom === 'All' ? 'bg-white' : 'bg-accent-leaf'}`}></div>
                            <span className="text-xs font-medium text-gray-200 truncate">
                                {selectedMushroom === 'All' ? 'All Strains' : selectedMushroom}
                            </span>
                        </div>
                        <ChevronDown size={14} className="text-gray-500 shrink-0 ml-1" />
                    </div>
                    <select
                        value={selectedMushroom}
                        onChange={(e) => setSelectedMushroom(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                        <option value="All" className="text-black bg-white">All Strains</option>
                        {mushroomTypes.filter(m => m !== 'All').map(m => (
                            <option key={m} value={m} className="text-black bg-white">{m}</option>
                        ))}
                    </select>
                </div>

                {/* View/Group Toggle */}
                <div className="relative group shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                        <span className="text-xs text-gray-400 capitalize">{groupBy}</span>
                        <ChevronDown size={14} className="text-gray-500" />
                    </div>
                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                        {(['day', 'week', 'month'] as const).map(g => (
                            <option key={g} value={g} className="text-black bg-white">
                                By {g.charAt(0).toUpperCase() + g.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Separator */}
                <div className="w-px h-5 bg-white/10 shrink-0"></div>

                {/* Date Filter */}
                <div className="relative group shrink-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent ${selectedDate ? 'border-accent-leaf/30 bg-accent-leaf/5' : ''}`}>
                        <Calendar size={14} className={selectedDate ? 'text-accent-leaf' : 'text-gray-400'} />
                        <span className={`text-xs font-medium ${selectedDate ? 'text-white' : 'text-gray-400'}`}>
                            {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date'}
                        </span>
                        {selectedDate && (
                            <button onClick={(e) => { e.stopPropagation(); setSelectedDate(''); }} className="ml-1 text-gray-500 hover:text-white">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            </div>

            {/* History List */}
            <div className="space-y-6">
                {Object.entries(groupedItems).slice(0, groupLimit).map(([groupLabel, group]) => {
                    // Always collapsed by default for performance and cleanliness
                    const isExpanded = expandedGroups[groupLabel] ?? false;
                    const toggleExpand = () => setExpandedGroups(prev => ({ ...prev, [groupLabel]: !isExpanded }));

                    return (
                        <div key={groupLabel} className="space-y-3">
                            {/* Group Header (Clickable) */}
                            <button
                                onClick={toggleExpand}
                                className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-2 min-w-0 mr-2">
                                    {isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Calendar size={16} className="text-accent-leaf shrink-0 hidden md:block" />
                                        <h3 className="text-xs md:text-sm font-semibold text-white truncate">
                                            {groupLabel}
                                        </h3>
                                    </div>
                                </div>
                                <span className="text-xs font-mono font-bold text-accent-leaf bg-black/40 px-2 py-1 rounded border border-white/10 group-hover:bg-black/60 transition-colors">
                                    {fmtWeight(group.totalWeight)}
                                </span>
                            </button>

                            {/* List Items based on group */}
                            {isExpanded && (
                                <div className="bg-dark-surface-light/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm animate-slide-down">
                                    <div className="divide-y divide-white/5">
                                        {group.items.map(item => (
                                            <div key={item.id} className="p-3 md:p-4 hover:bg-white/5 transition-colors grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 items-start">

                                                {/* Row 1 Left: Name */}
                                                <div className="text-white font-bold text-sm tracking-wide">
                                                    {item.mushroomName}
                                                </div>

                                                {/* Row 1 Right: Weight */}
                                                <div className="text-accent-leaf font-bold font-mono text-base text-right">
                                                    {item.weight}g
                                                </div>

                                                {/* Row 2 Left: Date & Time */}
                                                <div className="text-gray-500 text-xs font-mono">
                                                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    <span className="text-gray-700 mx-1.5">|</span>
                                                    {new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </div>

                                                {/* Row 2 Right: Status */}
                                                <div className="text-right">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-white/5 text-gray-400 border border-white/5 uppercase tracking-wider font-bold">
                                                        {item.currentStatus}
                                                    </span>
                                                </div>

                                                {/* Row 3 (Full Width): Baglet ID + Notes */}
                                                <div className="col-span-2 flex items-center justify-between border-t border-white/5 pt-1.5 mt-0.5">
                                                    <code className="text-[10px] text-gray-500 font-mono tracking-tight">
                                                        {item.bagletId}
                                                    </code>
                                                    {item.notes && (
                                                        <span className="text-[10px] text-gray-600 italic truncate max-w-[150px]">
                                                            {item.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {Object.keys(groupedItems).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No harvest records found.
                    </div>
                )}

                {/* Load More Groups */}
                {Object.keys(groupedItems).length > groupLimit && (
                    <div className="flex justify-center pt-4 pb-8">
                        <button
                            onClick={() => setGroupLimit(prev => prev + 20)}
                            className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-6 py-3 rounded-full text-sm font-medium transition-colors backdrop-blur-sm border border-white/5"
                        >
                            Load Older Records ({Object.keys(groupedItems).length - groupLimit} more groups)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
