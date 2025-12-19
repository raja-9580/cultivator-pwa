'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, QrCode, Weight, FileText, CheckCircle, TrendingUp, Package, History } from 'lucide-react';
import Card from '@/components/ui/Card';
import QrScanner from '@/components/ui/QrScanner';
import { toast } from 'sonner';

interface BagletDetails {
    id: string;
    batchId: string;
    mushroomType: string;
    currentStatus: string;
    harvestCount: number;
    totalHarvestWeight: number;
}

interface HarvestStats {
    readyCount: number;
    harvestedCount: number;
    harvestedWeight: number;
}

interface ReadyBaglet {
    id: string;
    batchId: string;
    mushroomType: string;
    currentStatus: string;
    daysSincePinned: number;
    harvestCount: number;
}

function HarvestContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const autoBagletId = searchParams.get('bagletId');

    const [searchId, setSearchId] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [baglet, setBaglet] = useState<BagletDetails | null>(null);
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [stats, setStats] = useState<HarvestStats | null>(null);
    const [readyBaglets, setReadyBaglets] = useState<ReadyBaglet[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        loadStatsAndReady();

        if (autoBagletId) {
            setSearchId(autoBagletId);
            handleSearch(autoBagletId);
        }
    }, [autoBagletId]);

    const loadStatsAndReady = async () => {
        try {
            setStatsLoading(true);
            const res = await fetch(`/api/harvest/dashboard?_t=${Date.now()}`, {
                cache: 'no-store'
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setReadyBaglets(data.readyBaglets);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleSearch = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setBaglet(null);
        setWeight('');
        setNotes('');

        try {
            const res = await fetch(`/api/harvest/validate?baglet_id=${id}`);
            const data = await res.json();

            if (res.ok && data.baglet) {
                setBaglet(data.baglet);
            } else {
                toast.error(data.error || 'Baglet not ready for harvest');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error validating baglet');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = (decodedText: string) => {
        setSearchId(decodedText);
        handleSearch(decodedText);
        setIsScannerOpen(false);
    };

    const handleSubmit = async () => {
        if (!baglet || !weight) {
            toast.error('Please enter weight');
            return;
        }

        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            toast.error('Please enter a valid weight');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/harvest/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bagletId: baglet.id,
                    weight: weightNum,
                    notes: notes || undefined,
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`Harvest recorded: ${weightNum}g (Flush #${data.flushNumber})`);
                setBaglet(null);
                setSearchId('');
                setWeight('');
                setNotes('');
                // Small delay to ensure DB write propagation
                setTimeout(() => {
                    router.refresh(); // Clear Next.js client cache
                    loadStatsAndReady();
                }, 500);
            } else {
                toast.error(data.error || 'Failed to record harvest');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error recording harvest');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-2 md:p-4 space-y-2 pt-13 md:pt-6">
            <div className="flex items-center justify-between px-1">
                <h1 className="text-2xl font-bold text-white">Harvest</h1>
                <Link
                    href="/harvest/history"
                    className="p-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Harvest History"
                >
                    <History size={24} />
                </Link>
            </div>

            {!baglet && (
                <Card variant="default" className="p-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Baglet ID"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchId)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-9 py-3 text-white text-sm focus:outline-none focus:border-accent-leaf/50 transition-colors"
                            />
                            {searchId ? (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setSearchId('');
                                            setBaglet(null);
                                        }}
                                        className="text-gray-500 hover:text-white p-1"
                                    >
                                        ✕
                                    </button>
                                    <button
                                        onClick={() => handleSearch(searchId)}
                                        className="text-accent-leaf hover:text-accent-leaf/80 p-1"
                                    >
                                        <TrendingUp className="rotate-90" size={18} />
                                    </button>
                                </div>
                            ) : null}
                        </div>
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="bg-accent-leaf/10 hover:bg-accent-leaf/20 text-accent-leaf border border-accent-leaf/30 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <QrCode size={20} />
                            <span className="hidden md:inline">Scan</span>
                        </button>
                    </div>
                </Card>
            )}

            {baglet && (
                <div className="space-y-4">
                    <div className="flex items-start justify-between px-1 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <p className="text-gray-200 font-mono font-bold text-sm break-all leading-tight">{baglet.id}</p>
                        </div>
                        <button
                            onClick={() => {
                                setBaglet(null);
                                setSearchId('');
                                setWeight('');
                                setNotes('');
                            }}
                            className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors mt-0.5"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Card variant="default" className="p-4 space-y-3 opacity-75">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-gray-400 text-xs">Mushroom Type</p>
                                    <p className="text-white font-medium text-sm">{baglet.mushroomType}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Batch ID</p>
                                    <p className="text-white font-mono text-xs">{baglet.batchId}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Next Harvest</p>
                                    <p className="text-accent-leaf font-bold">Flush #{baglet.harvestCount + 1}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Total Harvested</p>
                                    <p className="text-white font-medium">{baglet.totalHarvestWeight}g</p>
                                </div>
                            </div>
                        </Card>

                        <Card variant="default" className="p-6 space-y-4 border-accent-leaf/20">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">
                                    Weight (grams) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="number"
                                        placeholder="Enter weight in grams"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accent-leaf/50 transition-colors"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <details className="group">
                                <summary className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white transition-colors p-1 select-none">
                                    <FileText size={14} />
                                    <span>Add Notes (optional)</span>
                                </summary>
                                <div className="mt-2">
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Quality observations, flush notes..."
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-leaf/50 transition-colors resize-none"
                                    />
                                </div>
                            </details>

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !weight}
                                className="w-full bg-accent-leaf hover:bg-accent-leaf/90 text-black font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Recording...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        Record Harvest
                                    </>
                                )}
                            </button>
                        </Card>
                    </div>
                </div>
            )}

            {/* Stats & Ready List - Bottom for context */}
            {!baglet && (
                <>
                    {statsLoading ? (
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} variant="default" className="p-4">
                                    <div className="h-16 bg-white/5 animate-pulse rounded" />
                                </Card>
                            ))}
                        </div>
                    ) : stats && (
                        <div className="grid grid-cols-3 gap-3 mt-6">
                            <Card variant="default" className="p-3 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Ready</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-white text-2xl font-bold">{stats.readyCount}</p>
                                        <Package className="text-accent-leaf opacity-50" size={14} />
                                    </div>
                                </div>
                            </Card>
                            <Card variant="default" className="p-3 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Today</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-white text-2xl font-bold">{stats.harvestedCount}</p>
                                        <CheckCircle className="text-green-400 opacity-50" size={14} />
                                    </div>
                                </div>
                            </Card>
                            <Card variant="default" className="p-3 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Weight</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-white text-2xl font-bold">
                                            {stats.harvestedWeight >= 1000
                                                ? (stats.harvestedWeight / 1000).toFixed(1)
                                                : stats.harvestedWeight.toFixed(0)}
                                        </p>
                                        <span className="text-xs text-gray-500 font-medium">
                                            {stats.harvestedWeight >= 1000 ? 'kg' : 'g'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {readyBaglets.length > 0 && (
                        <Card variant="default" className="p-4 mt-4">
                            <h3 className="text-white font-semibold mb-3">Ready ({readyBaglets.length})</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                                {readyBaglets.map((ready) => (
                                    <button
                                        key={ready.id}
                                        onClick={() => handleSearch(ready.id)}
                                        className="w-full text-left p-3 rounded-lg bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/20 transition-colors"
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-mono text-xs font-medium break-all leading-tight">{ready.id}</p>
                                                <p className="text-gray-400 text-xs mt-1">{ready.mushroomType} • Flush #{ready.harvestCount + 1}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-gray-400 text-xs font-medium">{ready.daysSincePinned}d</p>
                                                <p className="text-gray-500 text-xs">{ready.currentStatus}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    )}
                </>
            )}

            <QrScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
            />
        </div>
    );
}

export default function HarvestPage() {
    return (
        <Suspense fallback={
            <div className="max-w-4xl mx-auto p-4 pt-13 md:pt-6 space-y-4">
                <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />
                <div className="h-20 bg-white/5 animate-pulse rounded-xl" />
                <div className="grid grid-cols-3 gap-4">
                    <div className="h-20 bg-white/5 animate-pulse rounded-xl" />
                    <div className="h-20 bg-white/5 animate-pulse rounded-xl" />
                    <div className="h-20 bg-white/5 animate-pulse rounded-xl" />
                </div>
            </div>
        }>
            <HarvestContent />
        </Suspense>
    );
}
