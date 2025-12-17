'use client';

import { useState } from 'react';
import { Search, QrCode, Activity, Clock, AlertCircle, X, Target, Zap } from 'lucide-react';
import Card from '@/components/ui/Card';
import QrScanner from '@/components/ui/QrScanner';
import { BagletStatus } from '@/lib/types';
import { getAvailableTransitions, HARVESTED_STATES } from '@/lib/baglet-workflow';
import { toast } from 'sonner';

interface BagletDetails {
  id: string;
  batchId: string;
  status: BagletStatus;
  lastStatusChange: string;
}

export default function StatusLoggerPage() {
  const [mode, setMode] = useState<'single' | 'rapid'>('single');
  const [searchId, setSearchId] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [baglet, setBaglet] = useState<BagletDetails | null>(null);
  const [nextStatus, setNextStatus] = useState<BagletStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [availableTransitions, setAvailableTransitions] = useState<BagletStatus[]>([]);

  const handleSearch = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setBaglet(null);
    setNextStatus('');
    setAvailableTransitions([]);

    try {
      const res = await fetch(`/api/baglets?baglet_id=${id}`);
      const data = await res.json();

      if (data.baglets && data.baglets.length > 0) {
        const found = data.baglets[0];
        setBaglet(found);
        const transitions = getAvailableTransitions(found.status);

        // Filter out Harvest actions (handled in Harvest Screen)
        const filteredTransitions = transitions.filter(t => !(HARVESTED_STATES as readonly BagletStatus[]).includes(t));

        setAvailableTransitions(filteredTransitions);
        if (filteredTransitions.length > 0) {
          // No need to pre-select status for buttons
        }
      } else {
        toast.error('Baglet not found');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching baglet');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (decodedText: string) => {
    setSearchId(decodedText);
    handleSearch(decodedText);
    setIsScannerOpen(false);
  };

  const handleUpdateStatus = async (targetStatus: BagletStatus) => {
    if (!baglet) return;

    try {
      setLoading(true);
      setNextStatus(targetStatus); // Used for loading UI state
      const res = await fetch(`/api/baglets/${baglet.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: targetStatus,
          notes: notes
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Status updated to ${targetStatus}`);

        setBaglet(null);
        setSearchId('');
        setNotes('');
        setAvailableTransitions([]);

        if (mode === 'rapid') {
          setIsScannerOpen(true);
        }
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error updating status');
    } finally {
      setLoading(false);
      setNextStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 md:p-4 space-y-2 pt-13 md:pt-6">
      <div className="flex items-center justify-end">
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setMode('single')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${mode === 'single' ? 'bg-accent-leaf text-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            title="Single Mode"
          >
            <Target size={18} />
            <span className={`${mode === 'single' ? 'inline-block' : 'hidden'} md:inline-block`}>Single</span>
          </button>
          <button
            onClick={() => {
              setMode('rapid');
              if (!baglet) setIsScannerOpen(true);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${mode === 'rapid' ? 'bg-orange-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            title="Rapid Mode"
          >
            <Zap size={18} />
            <span className={`${mode === 'rapid' ? 'inline-block' : 'hidden'} md:inline-block`}>Rapid</span>
          </button>
        </div>
      </div>

      {/* Mode Toggle & Content */}
      <div className="space-y-2">
        {/* Search / Scan Section - Only visible when no baglet is loaded */}
        {!baglet && (
          <>
            {mode === 'single' ? (
              <Card variant="default" className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Enter Baglet ID (e.g., BGL-123)"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchId)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accent-leaf/50 transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => handleSearch(searchId)}
                    disabled={loading}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Search
                  </button>
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="bg-accent-leaf/10 hover:bg-accent-leaf/20 text-accent-leaf border border-accent-leaf/30 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <QrCode size={20} />
                    Scan
                  </button>
                </div>
              </Card>
            ) : (
              <>
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                    <p className="text-gray-400 animate-pulse">Processing...</p>
                  </div>
                )}
                {!isScannerOpen && !loading && (
                  <Card variant="default" className="p-8 text-center border-orange-500/20">
                    <div className="max-w-md mx-auto space-y-6">
                      <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <QrCode className="text-orange-500" size={40} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Rapid Scan Mode</h2>
                        <p className="text-gray-400">
                          Scan a baglet, update its status, and the scanner will automatically reopen for the next one.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsScannerOpen(true)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-black text-lg font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
                      >
                        <QrCode size={24} />
                        Start Scanning
                      </button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* Baglet Details & Action - Shared View */}
        {baglet && (
          <div className="space-y-4">
            {/* Navigation / Context Header - COMPACT */}
            {/* Navigation / Context Header - MINIMAL & INTEGRATED */}
            {/* Navigation / Context Header - MINIMAL & INTEGRATED */}
            <div className="flex items-start justify-between px-1 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <p className="text-gray-200 font-mono font-bold text-sm break-all leading-tight">{baglet.id}</p>
              </div>
              <button
                onClick={() => {
                  setBaglet(null);
                  setSearchId('');
                  setNotes('');
                  setAvailableTransitions([]);
                  if (mode === 'rapid') setIsScannerOpen(true);
                }}
                className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors mt-0.5"
              >
                <X size={14} />
                {mode === 'rapid' ? 'Skip' : 'Clear'}
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Update Action - COMPACT & CLEAN */}
              <Card variant="default" className="p-4 space-y-4 border-accent-leaf/20 shadow-xl shadow-accent-leaf/5">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {availableTransitions.length === 0 ? (
                      <div className="p-4 bg-white/5 rounded-lg text-center text-gray-400">
                        No further actions available
                      </div>
                    ) : (
                      availableTransitions.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(status)}
                          disabled={loading}
                          className={`w-full bg-gray-800 hover:${mode === 'rapid' ? 'bg-orange-500' : 'bg-accent-leaf'} hover:text-black border border-white/10 ${mode === 'rapid' ? 'hover:border-orange-500' : 'hover:border-accent-leaf'} py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {loading && nextStatus === status ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <Activity size={20} className={`${mode === 'rapid' ? 'text-orange-500' : 'text-accent-leaf'} group-hover:text-black transition-colors`} />
                          )}
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider group-hover:text-black/60 transition-colors">Mark as</span>
                            <span className={`text-base font-bold ${mode === 'rapid' ? 'text-orange-500' : 'text-accent-leaf'} group-hover:text-black transition-colors`}>
                              {status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <details className="group">
                    <summary className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white transition-colors p-1 select-none">
                      <span>📝 Add Notes</span>
                    </summary>
                    <div className="mt-2">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observations..."
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-leaf/50 transition-colors resize-none"
                      />
                    </div>
                  </details>
                </div>
              </Card>

              {/* Current Status - COLLAPSED & CLEANED */}
              <details className="group">
                <summary className="flex items-center justify-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-white transition-colors p-3 border border-white/5 rounded-lg bg-white/5 select-none">
                  <Activity size={14} />
                  <span>View Details</span>
                </summary>
                <div className="mt-3">
                  <Card variant="default" className="p-4 space-y-3 opacity-75">
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Current Status</span>
                        <span className="text-xs font-mono text-gray-400">{baglet.batchId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-accent-leaf">{baglet.status}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>{new Date(baglet.lastStatusChange).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </details>
            </div>
          </div>
        )}

        {!baglet && !loading && searchId && mode === 'single' && (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
            <p>No baglet loaded. Search or scan to begin.</p>
          </div>
        )}
      </div>

      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  );
}
