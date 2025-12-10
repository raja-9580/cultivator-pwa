'use client';

import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BatchDetails } from '@/lib/types';
import { isBagletActive } from '@/lib/baglet-workflow';
import { COMMON_LABELS } from '@/lib/labels';

interface PrepareBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    batch: BatchDetails;
    onUpdate: () => void;
}

type Step = 'CHECKLIST' | 'WIZARD';

export default function PrepareBatchModal({ isOpen, onClose, batch, onUpdate }: PrepareBatchModalProps) {
    const [step, setStep] = useState<Step>('CHECKLIST');

    // Dynamic Checklist State (one entry per ingredient)
    const [ingredientChecks, setIngredientChecks] = useState<Record<string, boolean>>({});

    // Wizard State
    const [eligibleBaglets, setEligibleBaglets] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentBaglet, setCurrentBaglet] = useState<any>(null);

    // Metrics State
    const [weight, setWeight] = useState<string>('');
    const [temperature, setTemperature] = useState<string>('');
    const [humidity, setHumidity] = useState<string>('');
    const [ph, setPh] = useState<string>('');

    const [saving, setSaving] = useState(false);

    // Build ingredient list from batch substrate (only when batch is available)
    const ingredients = useMemo(() => {
        if (!batch?.substrate) return [];

        return [
            ...(batch.substrate.mediumsForBatch || []).map(m => ({
                id: `medium-${m.medium_id}`,
                name: m.medium_name,
                quantity: `${(m.qty_g / 1000).toFixed(2)} kg`,
            })),
            ...(batch.substrate.supplementsForBatch || []).map(s => ({
                id: `supplement-${s.supplement_id}`,
                name: s.supplement_name,
                quantity: `${s.qty} ${s.unit}`,
            })),
        ];
    }, [batch]);

    // Filter eligible baglets when modal opens
    useEffect(() => {
        if (isOpen && batch && batch.baglets) {
            // Find all baglets that are PLANNED or PREPARED (for editing)
            const editable = batch.baglets.filter(b =>
                (b.status === 'PLANNED' || b.status === 'PREPARED') && isBagletActive(b.status)
            );
            setEligibleBaglets(editable);

            if (editable.length > 0) {
                setCurrentBaglet(editable[0]);
                setCurrentIndex(0);
            } else {
                // No eligible baglets, close modal
                alert('No baglets to prepare!');
                onClose();
            }

            // Reset state
            setStep('CHECKLIST');

            // Initialize all ingredients as unchecked
            const initialChecks: Record<string, boolean> = {};
            ingredients.forEach(ing => {
                initialChecks[ing.id] = false;
            });
            setIngredientChecks(initialChecks);
        }
    }, [isOpen, batch, onClose]);

    // Load current baglet data
    useEffect(() => {
        if (eligibleBaglets.length > 0 && currentIndex < eligibleBaglets.length) {
            const baglet = eligibleBaglets[currentIndex];
            setCurrentBaglet(baglet);
            // Pre-fill with existing values (for editing PREPARED baglets)
            setWeight(baglet.weight?.toString() || '');
            setTemperature(baglet.temperature?.toString() || '');
            setHumidity(baglet.humidity?.toString() || '');
            setPh(baglet.ph?.toString() || '');
        }
    }, [currentIndex, eligibleBaglets, step]);

    const handleIngredientToggle = (ingredientId: string) => {
        setIngredientChecks(prev => ({ ...prev, [ingredientId]: !prev[ingredientId] }));
    };

    const isChecklistComplete = ingredients.length > 0 && ingredients.every(ing => ingredientChecks[ing.id]);

    const handleStartWizard = () => {
        if (eligibleBaglets.length === 0) {
            alert('No baglets to prepare!');
            onClose();
            return;
        }
        setStep('WIZARD');
    };

    const handleSkip = () => {
        if (currentIndex < eligibleBaglets.length - 1) {
            setCurrentIndex(prev => prev + 1);
            // Clear inputs for next baglet
            setWeight('');
            setTemperature('');
            setHumidity('');
            setPh('');
        } else {
            // Last baglet, close modal
            onUpdate(); // Refresh parent
            onClose();
        }
    };

    const handleSaveAndNext = async () => {
        if (!currentBaglet) return;

        // If already PREPARED, just move to next (readonly mode)
        if (currentBaglet.status === 'PREPARED') {
            if (currentIndex < eligibleBaglets.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                onUpdate();
                onClose();
            }
            return;
        }

        // For PLANNED baglets, save metrics and update status
        setSaving(true);

        try {
            // 1. Update Metrics
            const metricsPayload = {
                weight: weight ? parseFloat(weight) : undefined,
                temperature: temperature ? parseFloat(temperature) : undefined,
                humidity: humidity ? parseFloat(humidity) : undefined,
                ph: ph ? parseFloat(ph) : undefined,
            };

            const metricsRes = await fetch(`/api/baglets/${currentBaglet.id}/metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metricsPayload),
            });

            if (!metricsRes.ok) throw new Error('Failed to save metrics');

            // 2. Update Status to PREPARED
            const statusRes = await fetch(`/api/baglets/${currentBaglet.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newStatus: 'PREPARED',
                    notes: 'Batch Preparation: Metrics logged',
                }),
            });

            if (!statusRes.ok) throw new Error('Failed to update status');

            // 3. Advance
            if (currentIndex < eligibleBaglets.length - 1) {
                setCurrentIndex(prev => prev + 1);
                // Clear inputs for next baglet
                setWeight('');
                setTemperature('');
                setHumidity('');
                setPh('');
            } else {
                // Done!
                onUpdate(); // Refresh parent
                onClose();
            }

        } catch (error) {
            console.error(error);
            alert('Error saving data. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg border border-accent-leaf/20 shadow-2xl bg-[#0a0a0a] relative overflow-hidden">
                <div className="p-5 relative z-10">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-200">
                            {step === 'CHECKLIST' ? 'Recipe Checklist' : 'Batch Preparation'}
                        </h2>
                        {step === 'WIZARD' && (
                            <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-mono">
                                {currentIndex + 1} / {eligibleBaglets.length}
                            </div>
                        )}
                    </div>

                    {step === 'CHECKLIST' ? (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-400">
                                Check off each ingredient as you add it to the substrate mix.
                            </p>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {ingredients.map(ingredient => (
                                    <IngredientCheckItem
                                        key={ingredient.id}
                                        name={ingredient.name}
                                        quantity={ingredient.quantity}
                                        checked={ingredientChecks[ingredient.id] || false}
                                        onChange={() => handleIngredientToggle(ingredient.id)}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <Button variant="ghost" onClick={onClose} className="flex-1">
                                    {COMMON_LABELS.CANCEL}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleStartWizard}
                                    disabled={!isChecklistComplete}
                                    className="flex-1"
                                >
                                    Next: Log Metrics
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Baglet Info */}
                            {currentBaglet && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                                        Current Baglet {currentBaglet.status === 'PREPARED' && <span className="ml-2 text-accent-leaf">(Already Prepared - View Only)</span>}
                                    </div>
                                    <div className="text-xl font-mono text-white tracking-tight">
                                        {currentBaglet.id}
                                    </div>
                                </div>
                            )}

                            {/* Inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup
                                    label="Weight (g)"
                                    value={weight}
                                    onChange={setWeight}
                                    placeholder="0.0"
                                    autoFocus
                                    readOnly={currentBaglet?.status === 'PREPARED'}
                                />
                                <InputGroup
                                    label="pH Level"
                                    value={ph}
                                    onChange={setPh}
                                    placeholder="0.0"
                                    readOnly={currentBaglet?.status === 'PREPARED'}
                                />
                                <InputGroup
                                    label="Temp (°C)"
                                    value={temperature}
                                    onChange={setTemperature}
                                    placeholder="0.0"
                                    readOnly={currentBaglet?.status === 'PREPARED'}
                                />
                                <InputGroup
                                    label="Humidity (%)"
                                    value={humidity}
                                    onChange={setHumidity}
                                    placeholder="0.0"
                                    readOnly={currentBaglet?.status === 'PREPARED'}
                                />
                            </div>

                            <div className="flex gap-2 pt-6 border-t border-white/5 mt-2">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    Close
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleSkip}
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    Skip
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveAndNext}
                                    disabled={currentBaglet?.status === 'PLANNED' && (saving || !weight || !temperature || !humidity || !ph)}
                                    className="flex-[2]"
                                >
                                    {currentBaglet?.status === 'PREPARED'
                                        ? (currentIndex === eligibleBaglets.length - 1 ? 'Finish' : 'Next')
                                        : (saving ? 'Saving...' : (currentIndex === eligibleBaglets.length - 1 ? 'Finish' : 'Save & Next'))
                                    }
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

// Sub-components for cleaner code
function IngredientCheckItem({ name, quantity, checked, onChange }: {
    name: string,
    quantity: string,
    checked: boolean,
    onChange: () => void
}) {
    return (
        <div
            onClick={onChange}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked
                ? 'bg-accent-leaf/10 border-accent-leaf/30'
                : 'bg-white/5 border-white/10 hover:border-gray-600'
                }`}
        >
            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${checked ? 'bg-accent-leaf border-accent-leaf text-black' : 'border-gray-500'
                }`}>
                {checked && '✓'}
            </div>
            <div className="flex-1">
                <span className={checked ? 'text-white font-medium' : 'text-gray-400'}>{name}</span>
            </div>
            <div className="text-xs text-gray-500 font-mono">{quantity}</div>
        </div>
    );
}

function InputGroup({ label, value, onChange, placeholder, autoFocus, readOnly }: {
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder?: string,
    autoFocus?: boolean,
    readOnly?: boolean
}) {
    return (
        <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                readOnly={readOnly}
                className={`w-full border rounded-lg px-3 py-2.5 font-mono focus:outline-none transition-colors ${readOnly
                        ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 text-white focus:border-accent-leaf/50'
                    }`}
            />
        </div>
    );
}
