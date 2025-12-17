'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, TrendingUp, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { HarvestHistoryResult, HarvestHistoryItem } from '@/lib/harvest-actions';
import { formatDateToIST } from '@/lib/utils';

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
    const [showBreakdown, setShowBreakdown] = useState(false);

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

    const fetchHistory = async (forceRefresh = false) => {
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

            params.set('startDate', formatDateToIST(start));
            params.set('endDate', formatDateToIST(now));
            if (forceRefresh) params.set('refresh', 'true');

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
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-white">Harvest History</h1>
                        <RefreshButton onClick={() => fetchHistory(true)} loading={loading} />
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

            {/* HERO STATS: Zerodha Kite Style (Compact Total + Breakdown Logic) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-accent-leaf/5 to-black border border-accent-leaf/10 shadow-xl">
                {(() => {
                    // Logic to compute types
                    const statsByType: Record<string, { totalWeight: number, count: number }> = {};
                    const dateFilteredItems = data.items.filter(item => {
                        if (selectedDate && !item.timestamp.startsWith(selectedDate)) return false;
                        return true;
                    });
                    dateFilteredItems.forEach(item => {
                        if (!statsByType[item.mushroomName]) {
                            statsByType[item.mushroomName] = { totalWeight: 0, count: 0 };
                        }
                        statsByType[item.mushroomName].totalWeight += item.weight;
                        statsByType[item.mushroomName].count += 1;
                    });
                    const sortedStats = Object.entries(statsByType)
                        .map(([name, stats]) => ({ name, ...stats }))
                        .sort((a, b) => b.totalWeight - a.totalWeight);

                    const topStat = sortedStats[0];
                    const otherStats = sortedStats.slice(1);

                    return (
                        <>
                            <div className="p-4">
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest opacity-80">
                                            <TrendingUp size={10} className="text-accent-leaf" />
                                            <span>Total Yield</span>
                                        </div>
                                        {/* Display Grand Total from filtered stats */}
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-white tracking-tight">
                                                {fmtWeight(filteredStats.totalWeight)}
                                            </span>
                                            {filteredStats.totalCount > 0 && (
                                                <div className="flex flex-col leading-tight -mb-1">
                                                    <span className="text-[10px] font-mono font-bold text-accent-leaf">
                                                        Avg {Math.round(filteredStats.totalWeight / filteredStats.totalCount)}g
                                                    </span>
                                                    <span className="text-[9px] text-gray-600 font-medium">
                                                        / {filteredStats.totalCount} harvests
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Mini Chart or Indicator placeholder could go here */}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-white/5 mb-3"></div>

                                {/* List of Types */}
                                <div className="space-y-1">
                                    {/* Header Row */}
                                    <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider pb-1 border-b border-white/5 mb-1 px-1">
                                        <div className="flex-1">Mushroom</div>
                                        <div className="text-right w-20">Total</div>
                                        <div className="text-right w-12">Avg</div>
                                    </div>

                                    {/* Top 1 Strain (Always Visible) */}
                                    {topStat && (
                                        <div className="group flex items-center py-1.5 px-1 hover:bg-white/5 rounded-lg transition-colors cursor-default">
                                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent-leaf box-shadow-glow flex-shrink-0"></div>
                                                <span className="text-sm font-bold text-gray-200 truncate">{topStat.name}</span>
                                            </div>
                                            <div className="w-20 text-right font-mono font-bold text-white text-xs">
                                                {fmtWeight(topStat.totalWeight)}
                                            </div>
                                            <div className="w-12 text-right font-mono font-bold text-accent-leaf text-xs">
                                                {(topStat.totalWeight / topStat.count).toFixed(0)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Collapsible Others */}
                                    {otherStats.length > 0 && (
                                        <>
                                            {showBreakdown && (
                                                <div className="space-y-1 pt-1 animate-in slide-in-from-top-1 duration-300">
                                                    {otherStats.map(stat => (
                                                        <div key={stat.name} className="group flex items-center py-1.5 px-1 hover:bg-white/5 rounded-lg transition-colors opacity-80 hover:opacity-100 cursor-default">
                                                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                                                <div className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-gray-400 flex-shrink-0"></div>
                                                                <span className="text-xs font-medium text-gray-300 truncate">{stat.name}</span>
                                                            </div>
                                                            <div className="w-20 text-right font-mono font-medium text-gray-300 text-xs">
                                                                {fmtWeight(stat.totalWeight)}
                                                            </div>
                                                            <div className="w-12 text-right font-mono font-medium text-accent-leaf/80 text-xs">
                                                                {(stat.totalWeight / stat.count).toFixed(0)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Toggle Button */}
                                            <button
                                                onClick={() => setShowBreakdown(!showBreakdown)}
                                                className="w-full mt-2 py-1.5 flex items-center justify-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-wider"
                                            >
                                                <span>{showBreakdown ? 'Hide' : `+ ${otherStats.length} Others`}</span>
                                                <ChevronDown size={12} className={`transition-transform duration-300 ${showBreakdown ? 'rotate-180' : ''}`} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* Smart Filters Bar */}
            <div className="sticky top-2 z-20 glass-panel bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex items-center gap-1.5 shadow-xl">
                <div className="relative flex-1 group min-w-0">
                    <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedMushroom === 'All' ? 'bg-white' : 'bg-accent-leaf'}`}></div>
                            <span className="text-xs font-medium text-gray-200 truncate">
                                {selectedMushroom === 'All' ? 'All Mushrooms' : selectedMushroom}
                            </span>
                        </div>
                        <ChevronDown size={14} className="text-gray-500 shrink-0 ml-1" />
                    </div>
                    <select
                        value={selectedMushroom}
                        onChange={(e) => setSelectedMushroom(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                        <option value="All" className="text-black bg-white">All Mushrooms</option>
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
                                        {group.items.map(item => {
                                            // Robust check for terminal states
                                            const TERMINAL_STATUSES = ['DISPOSED', 'CONTAMINATED', 'SOLD'];
                                            const isDisposed = TERMINAL_STATUSES.includes(item.currentStatus?.toUpperCase() || '');

                                            // Calculate offset from average if valid
                                            const isAboveAvg = item.bagletAverageWeight > 0 && item.weight >= item.bagletAverageWeight;
                                            const weightDiff = item.bagletAverageWeight > 0 ? Math.abs(item.weight - item.bagletAverageWeight) : 0;

                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={`/baglets/${item.bagletId}`}
                                                    className={`block group/item relative p-3 md:p-4 hover:bg-white/5 transition-all border-l-4 ${!isDisposed ? 'border-l-accent-leaf bg-gradient-to-r from-accent-leaf/5 to-transparent' : 'border-l-transparent opacity-60 hover:opacity-100 grayscale-[0.3] hover:grayscale-0'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start gap-4">
                                                        {/* LEFT COLUMN */}
                                                        <div className="space-y-1.5 flex-1 min-w-0">
                                                            {/* Name - Restored to White for contrast */}
                                                            <div className="text-white font-bold text-sm md:text-base tracking-wide truncate">
                                                                {item.mushroomName}
                                                            </div>

                                                            {/* Metadata Badges Row */}
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {/* Date - Slightly brighter gray */}
                                                                <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                                                    <span>{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-500"></span>
                                                                    <span>{new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>

                                                                {/* Flush Count Pill - Restored visibility */}
                                                                <div className="text-[10px] font-mono font-medium flex items-center gap-1 bg-accent-leaf/10 text-accent-leaf px-2 py-0.5 rounded border border-accent-leaf/20">
                                                                    <span>Flush #{item.flushNumber}</span>
                                                                    <span className="opacity-60 text-[9px]">of {item.totalFlushes}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* RIGHT COLUMN: Metrics */}
                                                        <div className="text-right shrink-0">
                                                            {/* Restored full accent brightness */}
                                                            <div className="text-accent-leaf font-bold font-mono text-lg md:text-xl leading-none">
                                                                {item.weight}g
                                                            </div>

                                                            {/* Average Context */}
                                                            {item.bagletAverageWeight > 0 && (
                                                                <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px]">
                                                                    <span className="text-gray-500 font-medium">Avg {Math.round(item.bagletAverageWeight)}g</span>
                                                                    {Math.round(weightDiff) > 0 && (
                                                                        <span className={`px-1 rounded-sm ${isAboveAvg ? 'text-green-400 bg-green-400/10' : 'text-orange-400 bg-orange-400/10'}`}>
                                                                            {isAboveAvg ? '▲' : '▼'} {Math.round(weightDiff)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* FOOTER ROW: ID Only */}
                                                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between gap-4">
                                                        <code className="text-[10px] text-gray-600 font-mono tracking-tight group-hover/item:text-gray-500 transition-colors">
                                                            {item.bagletId}
                                                        </code>
                                                    </div>
                                                </Link>
                                            );
                                        })}
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
