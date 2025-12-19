'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronDown,
  Search,
  Database,
  Activity,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { BagletStatus, Baglet } from '@/lib/types';
import { isBagletActive } from '@/lib/baglet-workflow';
import { calculateDateRange, TimeRangeMode } from '@/lib/time-utils';
import QuickRangePicker from '@/components/ui/QuickRangePicker';
import Badge from '@/components/ui/Badge';

const statusVariantMap: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> = {
  [BagletStatus.PLANNED]: 'info',
  [BagletStatus.STERILIZED]: 'warning',
  [BagletStatus.INOCULATED]: 'warning',
  [BagletStatus.INCUBATED]: 'warning',
  [BagletStatus.PINNED]: 'info',
  [BagletStatus.HARVESTED]: 'success',
  [BagletStatus.CONTAMINATED]: 'danger',
  [BagletStatus.DISPOSED]: 'neutral',
  [BagletStatus.DELETED]: 'neutral',
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BagletsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [baglets, setBaglets] = useState<Baglet[]>([]);
  const [filterMode, setFilterMode] = useState<TimeRangeMode>('1m');
  const [syncing, setSyncing] = useState(false);

  // Client-side cache for ranges to make switching instant
  const cache = useRef<Record<string, Baglet[]>>({});

  // Multi-level Filters
  const [selectedMushroom, setSelectedMushroom] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBaglets();
  }, [filterMode]); // Re-fetch only when time range changes

  const fetchBaglets = async (forceRefresh = false) => {
    setSyncing(true);
    // 1. Check if we have the data in cache for instant toggle (unless force refreshing)
    if (!forceRefresh && cache.current[filterMode]) {
      setBaglets(cache.current[filterMode]);
      // Tiny delay to ensure the UI 'flicker' acknowledges the click
      setTimeout(() => setSyncing(false), 80);
      return;
    }

    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const { from, to } = calculateDateRange(filterMode);
      const params = new URLSearchParams({
        startDate: from,
        endDate: to,
        ...(forceRefresh && { refresh: 'true' })
      });

      const res = await fetch(`/api/baglets?${params}`);
      const data = await res.json();

      if (data.baglets) {
        setBaglets(data.baglets);
        // Store in local cache
        cache.current[filterMode] = data.baglets;
      }
    } catch (error) {
      console.error('Failed to fetch baglets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  };

  // Derived Options for Selects
  const mushroomTypes = useMemo(() =>
    ['All', ...Array.from(new Set(baglets.map(b => b.mushroomType).filter(Boolean)))].sort(),
    [baglets]
  );

  const statuses = useMemo(() =>
    ['All', ...Array.from(new Set(baglets.map(b => b.status)))].sort(),
    [baglets]
  );

  // Client-side Filtering (Type, Status, Search)
  const filteredBaglets = useMemo(() => {
    return baglets.filter(b => {
      const matchesMushroom = selectedMushroom === 'All' || b.mushroomType === selectedMushroom;
      const matchesStatus = selectedStatus === 'All' || b.status === selectedStatus;
      const matchesSearch = !searchTerm || b.id.toLowerCase().includes(searchTerm.toLowerCase()) || (b.batchId && b.batchId.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesMushroom && matchesStatus && matchesSearch;
    });
  }, [baglets, selectedMushroom, selectedStatus, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredBaglets.length;
    const active = filteredBaglets.filter(b => isBagletActive(b.status)).length;
    const successRate = total > 0 ? ((active / total) * 100).toFixed(0) : '0';

    // Calculate Average Age in days
    let avgAge = '--';
    if (total > 0) {
      const now = new Date();
      const totalDays = filteredBaglets.reduce((acc, b) => {
        const created = b.preparedDate ? new Date(b.preparedDate) : new Date(b.lastStatusChange);
        const ageInMs = now.getTime() - created.getTime();
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
        return acc + Math.max(0, ageInDays);
      }, 0);
      const avg = totalDays / total;
      avgAge = avg < 1 ? (avg * 24).toFixed(0) + 'h' : avg.toFixed(0) + 'd';
    }

    return { total, active, successRate, avgAge };
  }, [filteredBaglets]);

  if (loading && baglets.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 pt-6 animate-in fade-in duration-500 space-y-6">

      {/* Header & Time Filter */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors text-gray-400">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-lg font-black text-white tracking-tight">Baglets</h1>
          <RefreshButton onClick={() => fetchBaglets(true)} loading={refreshing} />
          {syncing && !refreshing && (
            <span className="text-[8px] font-bold text-accent-neon-green/60 animate-pulse tracking-widest uppercase">Syncing...</span>
          )}
        </div>

        <QuickRangePicker
          activeMode={filterMode}
          onChange={setFilterMode}
          modes={['1m', '3m', '6m']}
          className="shrink-0 scale-90 origin-right"
        />
      </div>

      <div className={`space-y-6 transition-all duration-300 ${syncing ? 'opacity-30 pointer-events-none scale-[0.99] grayscale' : 'opacity-100'}`}>
        {/* Overview Stats */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
          <div className="bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-gray-500 text-[8px] md:text-[9px] font-bold uppercase tracking-widest mb-0.5">
              <Database size={10} className="text-accent-neon-green" />
              <span>TOTAL</span>
            </div>
            <div className="text-base md:text-xl font-black text-white">{stats.total}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-gray-500 text-[8px] md:text-[9px] font-bold uppercase tracking-widest mb-0.5">
              <Activity size={10} className="text-blue-400" />
              <span>ACTIVE</span>
            </div>
            <div className="text-base md:text-xl font-black text-white">{stats.active}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-gray-500 text-[8px] md:text-[9px] font-bold uppercase tracking-widest mb-0.5">
              <AlertCircle size={10} className="text-accent-neon-green" />
              <span>HEALTH</span>
            </div>
            <div className="text-base md:text-xl font-black text-white">{stats.successRate}%</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl hidden md:block">
            <div className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">
              <Clock size={10} className="text-purple-400" />
              <span>AVG AGE</span>
            </div>
            <div className="text-lg md:text-xl font-black text-white">{stats.avgAge}</div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="sticky top-2 z-20 glass-panel bg-black/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl flex flex-col sm:flex-row gap-1.5 shadow-xl">

          {/* Search */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-transparent focus:border-white/20 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-gray-600 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {/* Mushroom Type Filter */}
            <div className="relative group flex-1 sm:shrink-0">
              <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 sm:bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10 font-bold">
                <span className="text-[10px] text-gray-400 font-medium">TYPE:</span>
                <span className="text-[10px] text-white truncate max-w-[70px] uppercase font-black">{selectedMushroom}</span>
                <ChevronDown size={12} className="text-gray-500" />
              </div>
              <select
                value={selectedMushroom}
                onChange={(e) => setSelectedMushroom(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {mushroomTypes.map(m => (
                  <option key={m as string} value={m as string} className="bg-black text-white">{m as string}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative group flex-1 sm:shrink-0">
              <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 sm:bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10 font-bold">
                <span className="text-[10px] text-gray-400 font-medium">STATUS:</span>
                <span className="text-[10px] text-white truncate max-w-[70px] uppercase font-black">{selectedStatus}</span>
                <ChevronDown size={12} className="text-gray-500" />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {statuses.map(s => (
                  <option key={s} value={s} className="bg-black text-white">{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Baglets List / Table */}
        <div className="space-y-4">

          {/* Mobile View: High-Density Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredBaglets.map((baglet) => (
              <div key={baglet.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors space-y-3 shadow-sm shadow-black/20">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/baglets/${baglet.id}`} className="font-mono text-[11px] text-accent-neon-green font-bold break-all leading-relaxed block mb-1">
                      {baglet.id}
                    </Link>
                    <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">
                      BATCH: <span className="text-gray-400">{baglet.batchId}</span>
                    </div>
                  </div>
                  <Badge variant={statusVariantMap[baglet.status]} className="text-[9px] uppercase font-black px-1.5 py-0.5 shrink-0">
                    {baglet.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-[8px]">Type</span>
                    <span className="text-xs font-bold text-gray-200">{baglet.mushroomType || '—'}</span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-right text-[8px]">Last Update</span>
                    <div className="text-[10px] font-bold text-white leading-none">
                      {formatDate(baglet.lastStatusChange)} <span className="text-gray-600 ml-1 font-normal opacity-60">at {new Date(baglet.lastStatusChange).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Row (Mobile) - Ultra-Dense (Single Row) */}
                <div className="flex items-start justify-between gap-2 pt-3 border-t border-white/5">
                  {baglet.weight !== null && baglet.weight !== undefined && (
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-0.5 truncate">Weight</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-accent-neon-green shrink-0" />
                        <span className="text-[10px] font-mono font-black text-white truncate">{baglet.weight}g</span>
                      </div>
                    </div>
                  )}
                  {baglet.metrics && (
                    <>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-0.5 truncate">Temp</span>
                        <span className="text-[10px] font-mono font-black text-gray-200 truncate">{baglet.metrics.temperature}°C</span>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-0.5 truncate">Humid</span>
                        <span className="text-[10px] font-mono font-black text-gray-200 truncate">{baglet.metrics.humidity}%</span>
                      </div>
                      {baglet.metrics.ph !== undefined && baglet.metrics.ph !== null && (
                        <div className="flex flex-col min-w-0 flex-1 pl-1 border-l border-white/5">
                          <span className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-0.5 truncate">pH</span>
                          <span className="text-[10px] font-mono font-black text-gray-200 truncate">{baglet.metrics.ph}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Wide Table */}
          <div className="hidden md:block overflow-x-auto bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left">
                  <th className="py-4 px-4 font-bold text-gray-500 text-[10px] uppercase tracking-widest">Baglet ID</th>
                  <th className="py-4 px-4 font-bold text-gray-500 text-[10px] uppercase tracking-widest">Type</th>
                  <th className="py-4 px-4 font-bold text-gray-500 text-[10px] uppercase tracking-widest">Status</th>
                  <th className="py-4 px-4 font-bold text-gray-500 text-[10px] uppercase tracking-widest">Metrics</th>
                  <th className="py-4 px-4 font-bold text-gray-500 text-[10px] uppercase tracking-widest text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBaglets.map((baglet) => (
                  <tr key={baglet.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 max-w-[200px]">
                      <Link href={`/baglets/${baglet.id}`} className="font-mono text-xs text-accent-neon-green hover:text-accent-neon-blue transition-colors font-bold break-all block">
                        {baglet.id}
                      </Link>
                      <div className="text-[9px] text-gray-600 mt-0.5">Batch: {baglet.batchId}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-tight">{baglet.mushroomType || '—'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={statusVariantMap[baglet.status]} className="text-[10px] uppercase font-black tracking-tighter">
                        {baglet.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {baglet.weight !== null && baglet.weight !== undefined && (
                          <div className="text-xs font-mono font-bold text-white">
                            {baglet.weight}g
                          </div>
                        )}
                        {baglet.metrics && (
                          <div className="flex gap-2 text-[10px] font-medium text-gray-500">
                            <span>{baglet.metrics.temperature}°C</span>
                            <span>{baglet.metrics.humidity}%</span>
                            {baglet.metrics.ph !== undefined && baglet.metrics.ph !== null && (
                              <span>pH {baglet.metrics.ph}</span>
                            )}
                          </div>
                        )}
                        {(!baglet.weight && !baglet.metrics) && <span className="text-gray-600">—</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-xs font-bold text-white leading-none">{formatDate(baglet.lastStatusChange)}</div>
                      <div className="text-[10px] text-gray-600 mt-1 font-mono uppercase">
                        {new Date(baglet.lastStatusChange).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBaglets.length === 0 && (
            <div className="p-20 text-center bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
              <div className="text-gray-600 text-sm font-medium mb-1">No baglets matching your criteria</div>
              <div className="text-gray-800 text-xs">Try adjusting your filters or time range</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
