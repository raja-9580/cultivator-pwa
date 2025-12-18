'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Info, Check, ChevronRight, ChevronDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface CatalogItem {
    contamination_code: string;
    contamination_type: string;
    contaminant: string;
    symptoms: string;
    notes: string;
}

interface BagletDetails {
    id: string;
    batchId: string;
    mushroomType: string;
    currentStatus: string;
    findings: { contamination_code: string; notes?: string }[];
}

interface SelectedFinding {
    code: string;
    notes: string;
}



export default function CRCAnalyzePage({ params }: { params: any }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [id, setId] = useState<string>('');

    // Params Unwrapping
    useEffect(() => {
        Promise.resolve(params).then((p: any) => setId(p.id));
    }, [params]);

    const [baglet, setBaglet] = useState<BagletDetails | null>(null);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [selectedFindings, setSelectedFindings] = useState<SelectedFinding[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [globalNotes, setGlobalNotes] = useState('');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            try {
                // Parallel Fetch: Baglet Details & Catalog
                const [bagletRes, catalogRes] = await Promise.all([
                    fetch(`/api/crc/validate?baglet_id=${id}`, { cache: 'no-store' }),
                    fetch(`/api/crc/catalog`)
                ]);

                const bagletData = await bagletRes.json();
                const catalogData = await catalogRes.json();

                if (!bagletRes.ok) {
                    toast.error(bagletData.error || 'Failed to load baglet');
                    router.push('/crc'); // Redirect back if invalid
                    return;
                }

                setBaglet(bagletData.baglet);
                setCatalog(catalogData.catalog);

                // Pre-populate findings if re-analysis
                if (bagletData.baglet.findings && bagletData.baglet.findings.length > 0) {
                    const existing = bagletData.baglet.findings.map((f: any) => ({
                        code: f.contamination_code,
                        notes: f.notes || ''
                    }));
                    setSelectedFindings(existing);

                    // Auto-expand sections that have existing selections
                    const activeTypes = new Set<string>();
                    catalogData.catalog.forEach((item: CatalogItem) => {
                        if (existing.some((f: any) => f.code === item.contamination_code)) {
                            activeTypes.add(item.contamination_type);
                        }
                    });
                    setExpandedSections(activeTypes);
                }

            } catch (error) {
                console.error(error);
                toast.error('Error loading data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, router]);

    const toggleFinding = (item: CatalogItem) => {
        const isOriginal = baglet?.findings.some(f => f.contamination_code === item.contamination_code);

        if (isOriginal) {
            toast.info('Original findings cannot be removed, only their notes can be updated.');
            return;
        }

        setSelectedFindings(prev => {
            const isSelected = prev.some(p => p.code === item.contamination_code);

            if (isSelected) {
                // Remove newly selected item
                return prev.filter(p => p.code !== item.contamination_code);
            } else {
                // Add new selection (Cumulative: allow multiple per type)
                return [...prev, { code: item.contamination_code, notes: '' }];
            }
        });
    };

    const updateFindingNotes = (code: string, text: string) => {
        setSelectedFindings(prev => prev.map(f =>
            f.code === code ? { ...f, notes: text } : f
        ));
    };

    const toggleSection = (type: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(type)) {
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    };

    const handleSubmit = async () => {
        if (selectedFindings.length === 0) {
            toast.error('Please select at least one finding');
            return;
        }

        // Validate that all findings have notes
        const missingNotes = selectedFindings.find(f => !f.notes || f.notes.trim() === '');
        if (missingNotes) {
            const item = catalog.find(c => c.contamination_code === missingNotes.code);
            toast.error(`Please provide notes for ${item?.contaminant || 'selected finding'}`);
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                bagletId: baglet!.id,
                findings: selectedFindings.map(f => ({
                    contaminationCode: f.code,
                    notes: f.notes
                })),
                notes: globalNotes,
                user: session?.user?.email || 'unknown-user'
            };

            const res = await fetch('/api/crc/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Analysis Saved');
                // Delay to allow Read Replica to catch up (Eventual Consistency)
                setTimeout(() => {
                    router.refresh();
                    router.push('/crc');
                }, 500);
            } else {
                toast.error(data.error || 'Failed to submit');
            }
        } catch (error) {
            console.error(error);
            toast.error('Submission error');
        } finally {
            setSubmitting(false);
        }
    };

    // Group catalog by Type
    const groupedCatalog = catalog.reduce((acc, item) => {
        if (!acc[item.contamination_type]) acc[item.contamination_type] = [];
        acc[item.contamination_type].push(item);
        return acc;
    }, {} as Record<string, CatalogItem[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-neon-purple"></div>
            </div>
        );
    }

    if (!baglet) return null;

    return (
        <div className="max-w-4xl mx-auto px-2 md:p-4 space-y-4 pt-13 md:pt-6 pb-32">
            {/* Header */}
            <div className="flex items-center gap-3 px-1">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white leading-tight">CRC Analysis</h1>
                    <p className="text-xs text-gray-400 font-mono">{baglet.id}</p>
                </div>
            </div>

            {/* Baglet Context */}
            <Card variant="default" className="p-4 border-accent-neon-purple/20 bg-accent-neon-purple/5">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Mushroom</p>
                        <p className="text-white font-bold">{baglet.mushroomType}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Batch</p>
                        <p className="text-gray-300 font-mono text-sm">{baglet.batchId}</p>
                    </div>
                </div>
                {baglet.currentStatus === 'CRC_ANALYZED' && (
                    <div className="mt-3 flex items-center gap-2 text-accent-neon-purple text-xs bg-accent-neon-purple/10 p-2 rounded border border-accent-neon-purple/20">
                        <Info size={14} />
                        Re-analyzing previously processed bag.
                    </div>
                )}
            </Card>

            {/* Findings Selection */}
            <div className="space-y-4">
                {Object.entries(groupedCatalog).map(([type, items]) => {
                    const isExpanded = expandedSections.has(type);
                    const selectedCount = items.filter(i => selectedFindings.some(f => f.code === i.contamination_code)).length;

                    return (
                        <div key={type} className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                            <button
                                onClick={() => toggleSection(type)}
                                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                                    <h3 className="text-gray-200 text-sm font-bold uppercase tracking-wider">
                                        {type}
                                    </h3>
                                </div>
                                {selectedCount > 0 && (
                                    <span className="text-xs bg-accent-neon-purple text-white px-2 py-0.5 rounded-full font-bold">
                                        {selectedCount}
                                    </span>
                                )}
                            </button>

                            {isExpanded && (
                                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                                    {items.map(item => {
                                        const isSelected = selectedFindings.some(f => f.code === item.contamination_code);
                                        const selection = selectedFindings.find(f => f.code === item.contamination_code);

                                        return (
                                            <div
                                                key={item.contamination_code}
                                                className={`
                                                    relative rounded-xl border transition-all duration-200 overflow-hidden
                                                    ${isSelected
                                                        ? 'bg-accent-neon-purple/20 border-accent-neon-purple shadow-[0_0_15px_rgba(189,0,255,0.15)]'
                                                        : 'bg-black/20 border-white/5 hover:border-white/20'
                                                    }
                                                `}
                                            >
                                                <button
                                                    onClick={() => toggleFinding(item)}
                                                    className="w-full text-left p-4 flex items-start gap-3"
                                                >
                                                    <div className={`
                                                        mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                                                        ${isSelected
                                                            ? 'bg-accent-neon-purple border-accent-neon-purple text-white'
                                                            : 'border-gray-600 bg-transparent'
                                                        }
                                                    `}>
                                                        {isSelected && <Check size={12} strokeWidth={4} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-medium">{item.contaminant}</span>
                                                            <span className="text-xs text-gray-500 font-mono">({item.contamination_code})</span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.symptoms}</p>
                                                    </div>
                                                </button>

                                                {isSelected && (
                                                    <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Add required note..."
                                                            value={selection?.notes || ''}
                                                            onChange={(e) => updateFindingNotes(item.contamination_code, e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-neon-purple/50"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* General Log Note */}
            <div className="pt-4">
                <label className="text-sm text-gray-400 mb-2 block">General Analysis Notes</label>
                <textarea
                    value={globalNotes}
                    onChange={(e) => setGlobalNotes(e.target.value)}
                    placeholder="Overall observations..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-neon-purple/50 h-24 resize-none"
                />
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-50">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-4 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || selectedFindings.length === 0}
                        className="flex-1 bg-accent-neon-purple text-white font-bold py-4 rounded-xl hover:bg-accent-neon-purple/90 transition-all shadow-lg shadow-accent-neon-purple/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <Save size={20} />
                        )}
                        {baglet.currentStatus === 'CRC_ANALYZED' ? 'Update Findings' : 'Complete Analysis'}
                    </button>
                </div>
            </div>
        </div>
    );
}
