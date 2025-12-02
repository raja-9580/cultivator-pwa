'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { APP_CONFIG } from '@/lib/config';
import BottomSheet from '@/components/ui/BottomSheet';
import { useMediaQuery } from '@/lib/hooks';

interface Strain {
    strain_code: string;
    mushroom_id: string;
    mushroom_name: string;
    strain_vendor_id: string;
    vendor_name: string;
}

interface Substrate {
    substrate_id: string;
    substrate_name: string;
    mediums: any[];
    supplements: any[];
}

interface CreateBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateBatchModal({ isOpen, onClose, onSuccess }: CreateBatchModalProps) {
    const [strains, setStrains] = useState<Strain[]>([]);
    const [substrates, setSubstrates] = useState<Substrate[]>([]);
    const [loading, setLoading] = useState(false);
    const [creationResult, setCreationResult] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        strain_code: '',
        substrate_id: '',
        prepared_date: new Date().toISOString().split('T')[0],
        baglet_count: APP_CONFIG.DEFAULT_BAGLET_COUNT as number,
        created_by: 'user@example.com', // TODO: Get from auth
    });

    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        if (isOpen) {
            fetchStrains();
            fetchSubstrates();
            setCreationResult(null); // Reset on open
        }
    }, [isOpen]);

    async function fetchStrains() {
        try {
            const res = await fetch('/api/strains');
            const data = await res.json();
            if (data.strains) {
                setStrains(data.strains);
            }
        } catch (error) {
            console.error('Failed to fetch strains:', error);
        }
    }

    async function fetchSubstrates() {
        try {
            const res = await fetch('/api/substrates');
            const data = await res.json();
            if (data.substrates) {
                setSubstrates(data.substrates);
            }
        } catch (error) {
            console.error('Failed to fetch substrates:', error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Validation
        if (!formData.strain_code || !formData.substrate_id) {
            alert('Please select both strain and substrate');
            return;
        }

        if (formData.baglet_count < APP_CONFIG.MIN_BAGLETS_PER_BATCH) {
            alert(`Minimum baglet count is ${APP_CONFIG.MIN_BAGLETS_PER_BATCH}`);
            return;
        }

        if (formData.baglet_count > APP_CONFIG.MAX_BAGLETS_PER_BATCH) {
            alert(`Maximum baglet count is ${APP_CONFIG.MAX_BAGLETS_PER_BATCH}`);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setCreationResult(data);
                // Don't close yet, show success view
                // Reset form
                setFormData({
                    strain_code: '',
                    substrate_id: '',
                    prepared_date: new Date().toISOString().split('T')[0],
                    baglet_count: APP_CONFIG.DEFAULT_BAGLET_COUNT,
                    created_by: 'user@example.com',
                });
            } else {
                alert(`❌ Error: ${data.error}`);
            }
        } catch (error: any) {
            console.error('Failed to create batch:', error);
            alert(`❌ Failed to create batch: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    const handleCloseSuccess = () => {
        onSuccess();
        onClose();
        setCreationResult(null);
    };

    const renderContent = () => {
        if (creationResult) {
            return (
                <div className="space-y-4">
                    <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4 text-center">
                        <p className="text-green-400 font-semibold text-lg">Batch {creationResult.batch_id}</p>
                        <p className="text-gray-400 text-sm mt-1">{creationResult.baglet_count} baglets created</p>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-gray-200 mb-2">Recipe Details</h3>
                        <div className="bg-dark-surface-light/30 rounded-lg p-3 space-y-2 text-sm">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Mediums</p>
                            {creationResult.substrate.mediums_for_batch.map((m: any, idx: number) => (
                                <div key={`m-${idx}`} className="flex justify-between border-b border-gray-700/50 pb-1 last:border-0">
                                    <span className="text-gray-300">{m.medium_name}</span>
                                    <span className="text-accent-sky font-mono">{(m.qty_g / 1000).toFixed(2)} kg</span>
                                </div>
                            ))}

                            <div className="h-2"></div>

                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Supplements</p>
                            {creationResult.substrate.supplements_for_batch.map((s: any, idx: number) => (
                                <div key={`s-${idx}`} className="flex justify-between border-b border-gray-700/50 pb-1 last:border-0">
                                    <span className="text-gray-300">{s.supplement_name}</span>
                                    <span className="text-accent-sky font-mono">
                                        {s.qty.toLocaleString()} {s.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full mt-4"
                        onClick={handleCloseSuccess}
                    >
                        Done
                    </Button>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Strain Selection */}
                <div>
                    <Select
                        key={`strain-${strains.length}`}
                        label="Mushroom Strain *"
                        options={[
                            { value: '', label: '-- Select Strain --' },
                            ...strains.map((strain) => ({
                                value: strain.strain_code,
                                label: `${strain.mushroom_name} – ${strain.strain_code}`,
                            })),
                        ]}
                        value={formData.strain_code}
                        onChange={(e) => setFormData({ ...formData, strain_code: e.target.value })}
                        required
                    />
                    {strains.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">Loading strains...</p>
                    )}
                </div>

                {/* Substrate Selection */}
                <div>
                    <Select
                        key={`substrate-${substrates.length}`}
                        label="Substrate *"
                        options={[
                            { value: '', label: '-- Select Substrate --' },
                            ...substrates.map((substrate) => ({
                                value: substrate.substrate_id,
                                label: substrate.substrate_name,
                            })),
                        ]}
                        value={formData.substrate_id}
                        onChange={(e) => setFormData({ ...formData, substrate_id: e.target.value })}
                        required
                    />
                    {substrates.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">Loading substrates...</p>
                    )}
                </div>

                {/* Prepared Date */}
                <Input
                    label="Prepared Date *"
                    type="date"
                    value={formData.prepared_date}
                    onChange={(e) => setFormData({ ...formData, prepared_date: e.target.value })}
                    required
                />

                {/* Baglet Count */}
                <div>
                    <Input
                        label={`Baglet Count * (Max: ${APP_CONFIG.MAX_BAGLETS_PER_BATCH})`}
                        type="number"
                        min={APP_CONFIG.MIN_BAGLETS_PER_BATCH}
                        max={APP_CONFIG.MAX_BAGLETS_PER_BATCH}
                        value={formData.baglet_count}
                        onChange={(e) => {
                            const value = parseInt(e.target.value) || APP_CONFIG.MIN_BAGLETS_PER_BATCH;
                            setFormData({
                                ...formData,
                                baglet_count: Math.min(value, APP_CONFIG.MAX_BAGLETS_PER_BATCH)
                            });
                        }}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Enter between {APP_CONFIG.MIN_BAGLETS_PER_BATCH} and {APP_CONFIG.MAX_BAGLETS_PER_BATCH} baglets
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="w-full sm:flex-1 order-2 sm:order-1"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full sm:flex-1 order-1 sm:order-2"
                        disabled={loading || strains.length === 0 || substrates.length === 0}
                    >
                        {loading ? 'Creating...' : 'Create Batch'}
                    </Button>
                </div>
            </form>
        );
    };

    if (!isOpen) return null;

    const title = creationResult ? 'Batch Created Successfully!' : 'Create New Batch';

    if (isMobile) {
        return (
            <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
                {renderContent()}
            </BottomSheet>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header - Sticky */}
                <div className="sticky top-0 bg-dark-surface border-b border-gray-800 px-5 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-semibold text-accent-leaf">
                        {title}
                    </h2>
                    <button
                        onClick={creationResult ? handleCloseSuccess : onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors text-2xl"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
