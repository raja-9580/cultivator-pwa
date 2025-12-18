'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, QrCode, AlertTriangle, Bug, CheckCircle, Microscope, History } from 'lucide-react';
import Card from '@/components/ui/Card';
import QrScanner from '@/components/ui/QrScanner';
import { toast } from 'sonner';

interface ContaminationFinding {
    contamination_code: string;
    contamination_type: string;
    contaminant: string;
    notes?: string;
}

interface BagletDetails {
    id: string;
    batchId: string;
    mushroomType: string;
    currentStatus: string;
    findings: ContaminationFinding[];
}

interface CRCStats {
    readyCount: number;
    analyzedTodayCount: number;
    contaminationRate: number;
}

interface ReadyBaglet {
    id: string;
    batchId: string;
    mushroomType: string;
    currentStatus: string;
    timeLabel: string;
}

export default function CRCPage() {
    const router = useRouter();
    const [searchId, setSearchId] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [baglet, setBaglet] = useState<BagletDetails | null>(null);
    const [stats, setStats] = useState<CRCStats | null>(null);
    const [readyBaglets, setReadyBaglets] = useState<ReadyBaglet[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setStatsLoading(true);
            const res = await fetch(`/api/crc/dashboard?_t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setReadyBaglets(data.readyBaglets);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleSearch = async (id: string) => {
        if (!id) return;
        setBaglet(null);

        try {
            const res = await fetch(`/api/crc/validate?baglet_id=${id}`);
            const data = await res.json();

            if (res.ok && data.baglet) {
                setBaglet(data.baglet);
            } else {
                toast.error(data.error || 'Baglet not ready for analysis');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error validating baglet');
        }
    };

    const handleScan = (decodedText: string) => {
        setSearchId(decodedText);
        handleSearch(decodedText);
        setIsScannerOpen(false);
    };

    // Placeholder for actual analysis logic
    const handleStartAnalysis = () => {
        if (!baglet) return;
        // In next step we will implement the actual Analysis Form / Logic
        // For now, redirect or show modal? 
        // Per user request, this is just the "Main Page" skeleton.
        // We can route to /crc/analyze/[id] OR show a modal. 
        // Assuming specific route based on complexity.
        router.push(`/crc/analyze/${baglet.id}`);
    };

    return (
        <div className="max-w-4xl mx-auto px-2 md:p-4 space-y-2 pt-13 md:pt-6">
            <div className="flex items-center justify-between px-1">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Microscope className="text-accent-neon-purple" />
                    CRC Analysis
                </h1>
                <Link
                    href="/crc/history"
                    className="p-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Analysis History"
                >
                    <History size={24} />
                </Link>
            </div>

            {/* Search / Scan Bar */}
            {!baglet && (
                <Card variant="default" className="p-4 border-accent-neon-purple/20">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Scan Suspected Bag (ID)"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchId)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-9 py-3 text-white text-sm focus:outline-none focus:border-accent-neon-purple/50 transition-colors"
                            />
                            {searchId && (
                                <button
                                    onClick={() => { setSearchId(''); setBaglet(null); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="bg-accent-neon-purple/10 hover:bg-accent-neon-purple/20 text-accent-neon-purple border border-accent-neon-purple/30 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <QrCode size={20} />
                            <span className="hidden md:inline">Scan</span>
                        </button>
                    </div>
                </Card>
            )}

            {/* Selected Baglet View */}
            {baglet && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                    <div className="flex items-start justify-between px-1 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <p className="text-gray-200 font-mono font-bold text-sm break-all leading-tight">{baglet.id}</p>
                            {baglet.currentStatus === 'CRC_ANALYZED' && (
                                <span className="text-[10px] bg-accent-neon-purple/20 text-accent-neon-purple px-2 py-0.5 rounded border border-accent-neon-purple/30">
                                    RE-ANALYSIS
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => { setBaglet(null); setSearchId(''); }}
                            className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors mt-0.5"
                        >
                            Clear
                        </button>
                    </div>

                    <Card variant="default" className="p-6 border-accent-neon-purple/30 shadow-lg shadow-accent-neon-purple/10">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-400">Mushroom</p>
                                    <p className="text-lg font-bold text-white">{baglet.mushroomType}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Batch</p>
                                    <p className="text-sm font-mono text-gray-300">{baglet.batchId}</p>
                                </div>
                            </div>

                            {/* Existing Findings (if any) */}
                            {baglet.findings.length > 0 && (
                                <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-bold">Previous Findings</p>
                                    <ul className="space-y-1">
                                        {baglet.findings.map((f, i) => (
                                            <li key={i} className="text-sm text-red-300 flex items-center gap-2">
                                                <Bug size={14} />
                                                {f.contamination_type}: {f.contaminant}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={handleStartAnalysis}
                                className="w-full bg-accent-neon-purple text-white font-bold py-4 rounded-xl hover:bg-accent-neon-purple/90 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Microscope size={20} />
                                {baglet.currentStatus === 'CRC_ANALYZED' ? 'Update Analysis' : 'Start Analysis'}
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Dashboard Stats & Ready List */}
            {!baglet && (
                <>
                    {statsLoading ? (
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />)}
                        </div>
                    ) : stats && (
                        <div className="grid grid-cols-3 gap-3 mt-6">
                            <Card variant="default" className="p-3 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Ready</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-white text-2xl font-bold">{stats.readyCount}</p>
                                        <AlertTriangle className="text-yellow-500 opacity-50" size={14} />
                                    </div>
                                </div>
                            </Card>
                            <Card variant="default" className="p-3 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Today</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-white text-2xl font-bold">{stats.analyzedTodayCount}</p>
                                        <CheckCircle className="text-accent-neon-purple opacity-50" size={14} />
                                    </div>
                                </div>
                            </Card>
                            <Card variant="default" className="p-3 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Loss Rate</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-white text-2xl font-bold">
                                            {stats.contaminationRate?.toFixed(1) || '0.0'}%
                                        </p>
                                        <Bug className="text-red-500 opacity-50" size={14} />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {readyBaglets.length > 0 && (
                        <Card variant="default" className="p-4 mt-4 border-t-4 border-t-yellow-500/50">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-yellow-500" />
                                Ready for Analysis ({readyBaglets.length})
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {readyBaglets.map((ready) => (
                                    <button
                                        key={ready.id}
                                        onClick={() => handleSearch(ready.id)}
                                        className="w-full text-left p-3 rounded-lg bg-black/20 hover:bg-black/40 border border-white/5 hover:border-accent-neon-purple/30 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-mono text-xs font-medium break-all">{ready.id}</p>
                                                <p className="text-gray-400 text-xs mt-1">{ready.mushroomType}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-gray-500 text-xs mb-1">{ready.timeLabel}</p>
                                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500/50 group-hover:bg-yellow-500 transition-colors" />
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
