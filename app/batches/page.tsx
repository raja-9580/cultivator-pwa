'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { FileText, Database } from 'lucide-react';

import FloatingActionButton from '@/components/ui/FloatingActionButton';
import PlanBatchModal from '@/components/batches/PlanBatchModal';
import BatchPreparationGrid from '@/components/batches/BatchPreparationGrid';

import BatchCard from '@/components/batches/BatchCard';
import QrScanner from '@/components/ui/QrScanner';
import { Batch, BatchDetails } from '@/lib/types';
import { getBatchWorkflowStage, BATCH_ACTIONS, INOCULATION_TRANSITION, getStatusCount } from '@/lib/baglet-workflow';
import { BATCH_LABELS, COMMON_LABELS } from '@/lib/labels';
import { calculateDateRange, TimeRangeMode } from '@/lib/time-utils';
import QuickRangePicker from '@/components/ui/QuickRangePicker';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';



function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function BatchesPage() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Use utility to get initial range
  const initialRange = calculateDateRange('3m');

  const [filters, setFilters] = useState({
    mushroomType: '',
    dateFrom: initialRange.from,
    dateTo: initialRange.to,
    activeOnly: false,
    mode: '3m' as TimeRangeMode,
    groupBy: 'none' as 'none' | 'day' | 'week' | 'month' | 'mushroomType',
  });

  // Expanded Groups State (Collapsed by default)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Grouping Helper
  const groupBatches = (batches: Batch[]) => {
    if (filters.groupBy === 'none') {
      const totalPlanned = batches.reduce((sum, b) => sum + b.plannedBagletCount, 0);
      const totalActual = batches.reduce((sum, b) => sum + b.actualBagletCount, 0);
      return [{
        title: '',
        items: batches,
        stats: { count: batches.length, planned: totalPlanned, actual: totalActual }
      }];
    }

    const groups: Record<string, Batch[]> = {};

    batches.forEach(batch => {
      let key = '';
      const date = new Date(batch.preparedDate);

      if (filters.groupBy === 'day') {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else if (filters.groupBy === 'week') {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const fmtDate = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        key = `Week of ${fmtDate(monday)} - ${fmtDate(sunday)}`;
      } else if (filters.groupBy === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else if (filters.groupBy === 'mushroomType') {
        key = batch.mushroomType;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(batch);
    });

    return Object.entries(groups).map(([title, items]) => {
      const totalPlanned = items.reduce((sum, b) => sum + b.plannedBagletCount, 0);
      const totalActual = items.reduce((sum, b) => sum + b.actualBagletCount, 0);

      return {
        title,
        items,
        stats: {
          count: items.length,
          planned: totalPlanned,
          actual: totalActual
        }
      };
    });
  };


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [updatingBatch, setUpdatingBatch] = useState<string | null>(null);

  // Preparation State
  const [preparingBatchData, setPreparingBatchData] = useState<BatchDetails | null>(null);
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);

  const router = useRouter();
  const { data: session } = useSession();
  const userEmail = session?.user?.email || 'user@example.com';

  async function fetchBatches() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set('startDate', filters.dateFrom);
      if (filters.dateTo) params.set('endDate', filters.dateTo);
      if (filters.mushroomType) params.set('mushroomType', filters.mushroomType);
      if (filters.activeOnly) params.set('activeOnly', 'true');
      params.set('_t', Date.now().toString());

      const res = await fetch(`/api/batches?${params.toString()}`);
      const data = await res.json();
      if (data.batches) {
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrepare(batchId: string) {
    try {
      setUpdatingBatch(batchId);
      const res = await fetch(`/api/batches/${batchId}`);
      const data = await res.json();

      if (data.id) {
        setPreparingBatchData(data);
        setIsPrepareModalOpen(true);
      } else {
        alert('Failed to load batch details');
      }
    } catch (e) {
      console.error(e);
      alert('Error loading batch');
    } finally {
      setUpdatingBatch(null);
    }
  }

  async function handleStatusUpdate(batchId: string, action: 'sterilize' | 'inoculate') {
    const transition = BATCH_ACTIONS[action];
    const actionName = transition.to;
    const currentStatus = transition.from;

    // Find the batch to get the count
    const batch = batches.find(b => b.id === batchId);
    const count = batch?.bagletStatusCounts?.[currentStatus] ?? 0;

    if (count === 0) {
      alert(`No baglets found in ${currentStatus} status`);
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Do you want to update the status of all ${count} baglets in Batch "${batchId}" to '${actionName}'?`
    );

    if (!confirmed) return;

    setUpdatingBatch(batchId);
    try {
      const res = await fetch(`/api/batches/${batchId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          updated_by: userEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      const actionMessage = action === 'sterilize'
        ? BATCH_LABELS.STERILIZATION_COMPLETE(data.updated_count)
        : BATCH_LABELS.INOCULATION_COMPLETE(data.updated_count);

      alert(actionMessage);
      await fetchBatches(); // Refresh the list
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUpdatingBatch(null);
    }
  }

  const handleScan = (decodedText: string) => {
    setIsScannerOpen(false);
    // Navigate to baglets page with search filter
    // Assuming the QR code contains the Baglet ID directly
    router.push(`/baglets?search=${encodeURIComponent(decodedText)}`);
  };

  useEffect(() => {
    fetchBatches();
  }, [filters.dateFrom, filters.dateTo, filters.mushroomType, filters.activeOnly]);

  const setQuickRange = (range: TimeRangeMode) => {
    const { from, to } = calculateDateRange(range);

    setFilters(prev => ({
      ...prev,
      dateFrom: from,
      dateTo: range === 'all' ? '' : to,
      mode: range,
      activeOnly: range === 'active'
    }));
  };

  const filteredBatches = batches; // Primary filtering now happens on server

  const groupedBatches = useMemo(() => {
    return groupBatches(filteredBatches);
  }, [filteredBatches, filters.groupBy]);

  return (
    <div>
      {/* Integrated Header & Summary */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-lg font-black text-white tracking-tight shrink-0">Batches</h1>
            {!loading && batches.length > 0 && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 shrink-0 tabular-nums">
                <span className="text-base font-black text-white leading-none">{batches.length}</span>
                <div className="w-[1px] h-3.5 bg-white/20" />
                <span className="text-base font-black text-accent-leaf leading-none">
                  {batches.reduce((sum, b) => sum + (b.actualBagletCount || 0), 0)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <QuickRangePicker
              activeMode={filters.mode}
              onChange={setQuickRange}
              className="h-8 md:h-9 bg-white/[0.03] border-white/10 flex-nowrap"
            />
          </div>
        </div>

        {/* Mushroom Distribution: Pure Scroll, No Truncation */}
        {!loading && batches.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {Object.entries(
              batches.reduce((acc, b) => {
                acc[b.mushroomType] = (acc[b.mushroomType] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] shrink-0">
                  <span className="w-1 h-1 rounded-full bg-accent-leaf/40" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">{type}</span>
                  <span className="text-[10px] font-black text-white/90">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Action Bar: Filters Left, Plan Right */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Select
            className="!h-8 !md:h-9 !py-1 !px-2.5 w-40 md:w-48 !text-[10px] font-black bg-white/[0.03] border-white/10 uppercase tracking-widest flex-shrink-0"
            options={[
              { value: '', label: 'ALL MUSHROOMS' },
              ...Array.from(new Set(batches.map(b => b.mushroomType)))
                .sort()
                .map((type) => ({ value: type, label: type.toUpperCase() })),
            ]}
            value={filters.mushroomType}
            onChange={(e) => {
              setLoading(true);
              setFilters({ ...filters, mushroomType: e.target.value });
              setTimeout(() => setLoading(false), 100);
            }}
          />
          <Select
            className="!h-8 !md:h-9 !py-1 !px-2.5 w-32 md:w-40 !text-[10px] font-black bg-white/[0.03] border-white/10 uppercase tracking-widest flex-shrink-0"
            options={[
              { value: 'none', label: 'NO GROUPING' },
              { value: 'day', label: 'GROUP: DAY' },
              { value: 'week', label: 'GROUP: WEEK' },
              { value: 'month', label: 'GROUP: MONTH' },
              { value: 'mushroomType', label: 'GROUP: MUSHROOM' },
            ]}
            value={filters.groupBy}
            onChange={(e: any) => {
              setLoading(true);
              setFilters({ ...filters, groupBy: e.target.value });
              setTimeout(() => setLoading(false), 100);
            }}
          />
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-7 px-4 rounded-lg bg-accent-leaf text-black text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95 shadow-lg shadow-accent-leaf/10 flex-shrink-0"
        >
          Plan
        </button>
      </div>

      {/* Mobile: Card Grid with Separator */}
      <div className="md:hidden mb-4">
        <div className="border-t border-white/20 shadow-lg shadow-white/5 my-5" />
        <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          {groupedBatches.map((group) => (
            <div key={group.title} className="space-y-1.5">
              {group.title && (
                <div className="sticky top-0 z-10 py-2 bg-dark-bg/95 backdrop-blur-md -mx-1 px-1">
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-dark-surface border border-white/[0.03] group active:scale-[0.98] transition-all shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] text-accent-leaf transition-transform duration-300 ${expandedGroups[group.title] ? '' : '-rotate-90'}`}>▼</span>
                      <span className="text-[11px] font-black text-white uppercase tracking-wider">{group.title}</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-accent-leaf/5 border border-accent-leaf/10">
                      <span className="text-[10px] font-black text-accent-leaf/80 tabular-nums">
                        {group.stats.actual} <span className="text-[8px] opacity-40">/</span> {group.stats.planned}
                      </span>
                      <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter ml-1">UNITS</span>
                    </div>
                  </button>
                </div>
              )}
              {(!group.title || expandedGroups[group.title]) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {group.items.map((batch) => (
                    <BatchCard
                      key={batch.id}
                      batch={batch}
                      onStatusUpdate={handleStatusUpdate}
                      onPrepare={handlePrepare}
                      updatingBatch={updatingBatch}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {batches.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No batches found matching your filters.
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Ultra-Dense Table */}
      <Card className={`hidden md:block transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'} bg-dark-surface/40 border-white/5 p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left py-2 px-4 font-black text-gray-500 text-[10px] uppercase tracking-widest">Batch</th>
                <th className="text-left py-2 px-4 font-black text-gray-500 text-[10px] uppercase tracking-widest">Mushroom</th>
                <th className="text-left py-2 px-4 font-black text-gray-500 text-[10px] uppercase tracking-widest">Operator</th>
                <th className="text-left py-2 px-4 font-black text-gray-500 text-[10px] uppercase tracking-widest">Date</th>
                <th className="text-right py-2 px-4 font-black text-gray-500 text-[10px] uppercase tracking-widest">Workflow</th>
              </tr>
            </thead>
            <tbody>
              {groupedBatches.map((group) => (
                <Fragment key={group.title}>
                  {group.title && (
                    <tr
                      className="cursor-pointer group/header hover:bg-white/[0.03] transition-colors bg-white/[0.01]"
                      onClick={() => toggleGroup(group.title)}
                    >
                      <td colSpan={5} className="py-2.5 px-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <span className={`text-[8px] transition-transform duration-200 ${expandedGroups[group.title] ? '' : '-rotate-90'}`}>▼</span>
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{group.title}</span>
                          <div className="h-[1px] flex-1 bg-white/5" />
                          <span className="text-[10px] font-black text-accent-leaf tabular-nums">
                            {group.stats.actual} <span className="opacity-30">/</span> {group.stats.planned}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {(!group.title || expandedGroups[group.title]) && group.items.map((batch) => (
                    <tr key={batch.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all group/row">
                      <td className="py-2 px-4 align-middle">
                        <div className="flex flex-col">
                          <Link href={`/batches/${batch.id}`} className="text-[13px] font-black text-accent-leaf hover:text-white transition-all tracking-tighter">
                            {batch.id}
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-600">#{batch.batchSequence}</span>
                            <span className="text-[9px] font-black text-accent-leaf/60 uppercase tracking-tighter">{batch.actualBagletCount} UNITS</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold text-white uppercase truncate max-w-[150px] leading-tight">{batch.mushroomType}</span>
                            <span className="text-[9px] text-gray-600 font-bold tracking-tight uppercase truncate max-w-[150px] line-clamp-1">{batch.vendorName}</span>
                          </div>
                          <details className="group/substrate relative">
                            <summary className="p-1 px-1.5 rounded bg-white/[0.03] border border-white/10 text-gray-600 hover:text-accent-leaf list-none cursor-pointer transition-colors active:scale-90">
                              <Database size={11} />
                            </summary>
                            <div className="absolute bottom-full left-0 mb-3 w-56 p-3 rounded-xl bg-[#111] border border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                              <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-1">Substrate</span>
                                <span className="text-[11px] text-gray-300 font-medium leading-relaxed">{batch.substrateDescription}</span>
                                <span className="text-[9px] text-gray-600 font-mono uppercase tracking-tighter">{batch.substrateCode}</span>
                              </div>
                            </div>
                          </details>
                        </div>
                      </td>
                      <td className="py-2 px-4 align-middle">
                        <span className="text-[11px] font-bold text-gray-400 capitalize">
                          {(batch.createdBy?.split('@')[0] || '—').toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2 px-4 align-middle text-[11px] font-bold text-gray-500 whitespace-nowrap">
                        {formatDate(batch.preparedDate)}
                      </td>
                      <td className="py-2 px-4 align-middle text-right">
                        <div className="flex gap-2 justify-end items-center">
                          {['PREPARE', 'RESUME'].includes(getBatchWorkflowStage(batch.bagletStatusCounts)) && (
                            <button onClick={() => handlePrepare(batch.id)} className="h-7 px-3 rounded-md bg-accent-leaf text-black text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                              {getBatchWorkflowStage(batch.bagletStatusCounts) === 'RESUME' ? 'RESUME' : 'PREPARE'}
                            </button>
                          )}
                          {getBatchWorkflowStage(batch.bagletStatusCounts) === 'STERILIZE' && (
                            <button onClick={() => handleStatusUpdate(batch.id, 'sterilize')} className="h-7 px-4 rounded-md bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                              STERILIZE
                            </button>
                          )}
                          {getBatchWorkflowStage(batch.bagletStatusCounts) === 'INOCULATE' && (
                            <button onClick={() => handleStatusUpdate(batch.id, 'inoculate')} className="h-7 px-4 rounded-md bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                              INOCULATE
                            </button>
                          )}
                          {getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.to) > 0 && (
                            <button onClick={() => { window.location.href = `/api/batches/${batch.id}/export-labels`; }} className="p-1.5 rounded-md bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-colors">
                              <FileText size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {batches.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No batches found matching your filters.
          </div>
        )}
      </Card>

      {
        preparingBatchData && (
          <BatchPreparationGrid
            isOpen={isPrepareModalOpen}
            onClose={() => setIsPrepareModalOpen(false)}
            batch={preparingBatchData}
            onUpdate={fetchBatches}
          />
        )
      }



      <PlanBatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchBatches}
      />

      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />

      <FloatingActionButton actions={[
        {
          label: BATCH_LABELS.PLAN_BATCH,
          icon: '➕',
          onClick: () => setIsCreateModalOpen(true)
        },
        {
          label: COMMON_LABELS.QR_SCAN,
          icon: '📱',
          onClick: () => setIsScannerOpen(true)
        },
      ]} />
    </div >
  );
}
