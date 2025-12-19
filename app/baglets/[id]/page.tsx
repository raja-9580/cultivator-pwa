'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Baglet, BagletStatus } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import BagletActions from '@/components/baglets/BagletActions';
import Link from 'next/link';
import { Check } from 'lucide-react';

interface BagletHistory {
    status: string;
    previousStatus: string;
    notes: string;
    loggedBy: string;
    timestamp: string;
}

interface HarvestRecord {
    id: number;
    weight: number;
    date: string;
    notes: string;
    loggedBy: string;
}

interface ContaminationFinding {
    code: string;
    type: string;
    contaminant: string;
    notes: string;
    loggedBy: string;
    timestamp: string;
}

export default function BagletDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [baglet, setBaglet] = useState<Baglet & { strainCode?: string; substrateId?: string; preparedDate?: string } | null>(null);
    const [history, setHistory] = useState<BagletHistory[]>([]);
    const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
    const [contamination, setContamination] = useState<ContaminationFinding[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBagletDetails = async () => {
        try {
            const res = await fetch(`/api/baglets/${id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setBaglet(data.baglet);
            setHistory(data.history || []);
            setHarvests(data.harvests || []);
            setContamination(data.contamination || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchBagletDetails();
    }, [id]);

    const totalYield = useMemo(() => {
        return harvests.reduce((sum, h) => sum + h.weight, 0);
    }, [harvests]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 p-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full rounded-2xl" />
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    </div>
                    <Skeleton className="h-96 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!baglet) {
        return (
            <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
                    <span className="text-2xl text-red-500">⚠</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-100">Baglet Not Found</h2>
                <p className="text-gray-400 mt-2">The baglet record you are looking for does not exist or has been deleted.</p>
                <Link href="/baglets" className="mt-8 inline-flex items-center px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-accent-neon-green hover:bg-white/10 transition-all">
                    ← Back to Monitoring
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Ultra-Dense Header */}
            <header className="pb-6 border-b border-white/10 space-y-4">
                {/* Top Level Row: Back Link */}
                <div className="flex items-center justify-between">
                    <Link href="/baglets" className="text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-accent-neon-green transition-colors">
                        ← Baglets
                    </Link>
                    {/* Mobile Only: Status */}
                    <Badge
                        variant={baglet.status === 'CONTAMINATED' ? 'danger' : baglet.status === 'DISPOSED' ? 'neutral' : 'info'}
                        className="md:hidden text-[9px] font-black px-3 py-1 shadow-lg shadow-black/20"
                    >
                        {baglet.status}
                    </Badge>
                </div>

                {/* Primary Identity Section: ID & Desktop Status */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-xl md:text-2xl font-mono font-bold text-white tracking-normal uppercase leading-tight break-all max-w-2xl">
                            {baglet.id?.substring(0, baglet.id.lastIndexOf('-')) || baglet.id}
                            <span className="text-accent-neon-green/40 ml-3 font-mono text-[10px] tracking-widest align-middle">
                                #{baglet.id?.split('-').pop() || ''}
                            </span>
                        </h1>

                        {/* Meta Row: Batch & Mushroom */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Batch</span>
                                <Link href="/batches" className="text-[11px] font-mono font-bold text-accent-neon-green hover:underline">
                                    {baglet.batchId}
                                </Link>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Mushroom</span>
                                <span className="text-[11px] font-bold text-gray-200">{baglet.mushroomType}</span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Status Badge */}
                    <div className="hidden md:block pb-1">
                        <Badge
                            variant={baglet.status === 'CONTAMINATED' ? 'danger' : baglet.status === 'DISPOSED' ? 'neutral' : 'info'}
                            className="text-[10px] font-black px-4 py-1.5 shadow-lg shadow-black/20"
                        >
                            {baglet.status}
                        </Badge>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Core Data & Specialized Cards */}
                <div className="lg:col-span-2 space-y-6">

                    <Card className="p-1 border-white/5 bg-white/[0.01]">
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
                            <div className="p-4 flex flex-col">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-mono">Weight</span>
                                <span className="text-xl font-mono font-black text-white">{baglet.weight ?? '--'}g</span>
                            </div>
                            <div className="p-4 flex flex-col">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-mono">Temp</span>
                                <span className="text-xl font-mono font-black text-accent-neon-blue">{baglet.metrics?.temperature ?? '--'}°C</span>
                            </div>
                            <div className="p-4 flex flex-col">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-mono">Humid</span>
                                <span className="text-xl font-mono font-black text-accent-neon-green">{baglet.metrics?.humidity ?? '--'}%</span>
                            </div>
                            <div className="p-4 flex flex-col">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-mono">pH</span>
                                <span className="text-xl font-mono font-black text-gray-200">{baglet.metrics?.ph ?? '--'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Specialized Cards Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Yield / Harvest Card */}
                        <Card className="p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="text-6xl font-black">YLD</span>
                            </div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Yield</h3>
                            <div className="space-y-6">
                                <div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Total Harvested</span>
                                    <div className="text-4xl font-mono font-black text-white leading-none mt-1">
                                        {totalYield}g
                                    </div>
                                    <div className="text-[10px] font-bold text-accent-neon-green mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-neon-green animate-pulse" />
                                        {harvests.length} Flushes Recorded
                                    </div>
                                </div>

                                {harvests.length > 0 && (
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                        {harvests.map((h, i) => (
                                            <div key={h.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Flush #{harvests.length - i}</span>
                                                    <span className="text-[10px] text-gray-500">{new Date(h.date).toLocaleDateString()}</span>
                                                </div>
                                                <span className="font-mono font-bold text-white">{h.weight}g</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Health / Contamination Card */}
                        <Card className={`p-6 relative overflow-hidden group ${(contamination.length > 0 || baglet.status === 'CONTAMINATED') ? 'border-red-500/30' : ''}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="text-6xl font-black">HLT</span>
                            </div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Health</h3>

                            {contamination.length > 0 || baglet.status === 'CONTAMINATED' ? (
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] text-red-400 font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-400/10 inline-block mb-3">
                                            Contamination Alert
                                        </span>

                                        {contamination.length > 0 ? (
                                            <div className="space-y-3">
                                                {contamination.map((c, i) => (
                                                    <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-black text-red-200 uppercase">{c.contaminant}</span>
                                                            <span className="text-[8px] text-gray-500 font-mono">{new Date(c.timestamp).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 leading-relaxed">{c.notes || 'No specific notes logged.'}</p>
                                                        <div className="pt-1">
                                                            <span className="text-[8px] font-bold text-gray-600 uppercase">Analyst: {c.loggedBy}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 text-center space-y-2">
                                                <p className="text-[11px] font-bold text-red-200/70 uppercase tracking-widest">Status: Contaminated</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Waiting for lab findings...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                    <div className="w-12 h-12 rounded-full border border-accent-neon-green/20 flex items-center justify-center bg-accent-neon-green/5">
                                        <Check className="w-6 h-6 text-accent-neon-green" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-sm font-black text-gray-200 uppercase tracking-widest block">Verified Clean</span>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lab Clear</span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Timeline View */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-bold text-gray-100 uppercase tracking-[0.2em]">Timeline</h3>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{history.length} Milestones</span>
                        </div>
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">
                            {history.map((item, index) => (
                                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Icon / Marker */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-black group-[.is-active]:bg-white/5 group-[.is-active]:border-white/20 text-gray-300 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors duration-500">
                                        <span className="text-[8px] font-black">{history.length - index}</span>
                                    </div>
                                    {/* Content Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-white/[0.02] shadow-xl group-hover:border-white/10 transition-all">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-white text-xs uppercase tracking-tight">{item.status.replace(/_/g, ' ')}</div>
                                            <time className="font-mono text-[9px] text-accent-neon-green/80 font-bold whitespace-nowrap">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </time>
                                        </div>
                                        {item.notes && <div className="text-[10px] text-gray-400 mb-2 leading-snug">{item.notes}</div>}
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                                            <span className="text-[8px] font-black text-gray-500 uppercase">By {item.loggedBy?.split('@')[0] || 'System'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Actions & Technical Context */}
                <div className="space-y-6">

                    {/* Standard Transitions Component */}
                    <BagletActions
                        bagletId={baglet.id}
                        currentStatus={baglet.status as BagletStatus}
                        onStatusUpdate={fetchBagletDetails}
                    />

                    {/* Batch & Lab Context Card */}
                    <Card className="p-6 space-y-6">

                        <div className="space-y-4">
                            <div className="pb-4 border-b border-white/5 space-y-1.5">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Parent Batch</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-200">{baglet.batchId}</span>
                                    <Link href="/batches" className="text-[10px] font-black text-accent-neon-green uppercase hover:underline">View Batch</Link>
                                </div>
                            </div>

                            <div className="pb-4 border-b border-white/5 space-y-1.5">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Strain / Variety</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-200">{baglet.mushroomType}</span>
                                    <Badge variant="neutral" className="text-[8px] font-black">{baglet.strainCode}</Badge>
                                </div>
                            </div>

                            <div className="pb-4 border-b border-white/5 space-y-1.5">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Substrate ID</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-300 font-mono italic">{baglet.substrateId}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Lifecycle Age</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-200">
                                        {baglet.preparedDate ? Math.floor((new Date().getTime() - new Date(baglet.preparedDate).getTime()) / (1000 * 3600 * 24)) : '--'} Days
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-600 uppercase">Since Prep</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
