'use client';

import { useState } from 'react';
import { Search, QrCode, Weight, FileText, CheckCircle } from 'lucide-react';
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

export default function HarvestPage() {
    const [searchId, setSearchId] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [baglet, setBaglet] = useState<BagletDetails | null>(null);
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');

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
            </div>

            {!baglet && (
                <Card variant="default" className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Enter Baglet ID"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchId)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white focus:outline-none focus:border-accent-leaf/50 transition-colors"
                            />
                            {searchId && (
                                <button
                                    onClick={() => setSearchId('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            )}
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

            <QrScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
            />
        </div>
    );
}
