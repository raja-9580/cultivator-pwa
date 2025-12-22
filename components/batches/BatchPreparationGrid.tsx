'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { BatchDetails } from '@/lib/types';
import { isBagletActive, PREPARATION_TRANSITION } from '@/lib/baglet-workflow';
import Button from '@/components/ui/Button';
import StepperInput from '@/components/ui/StepperInput';

interface BatchPreparationGridProps {
    isOpen: boolean;
    onClose: () => void;
    batch: BatchDetails;
    onUpdate: () => void;
}

interface BagletEditState {
    weight: string;
    temperature: string;
    humidity: string;
    ph: string;
}

export default function BatchPreparationGrid({ isOpen, onClose, batch, onUpdate }: BatchPreparationGridProps) {
    // Checklist State
    const [step, setStep] = useState<'CHECKLIST' | 'GRID'>('CHECKLIST');
    const [ingredientChecks, setIngredientChecks] = useState<Record<string, boolean>>({});

    // Filter active baglets (PLANNED or PREPARED)
    const activeBaglets = useMemo(() => {
        if (!batch?.baglets) return [];
        return batch.baglets.filter(b =>
            (b.status === PREPARATION_TRANSITION.from || b.status === PREPARATION_TRANSITION.to) &&
            isBagletActive(b.status)
        );
    }, [batch]);

    // Build ingredient list from batch substrate
    const ingredients = useMemo(() => {
        if (!batch?.substrate) return [];
        return [
            ...(batch.substrate.mediumsForBatch || []).map(m => ({
                id: `medium-${m.medium_id}`,
                name: m.medium_name,
                quantity: m.qty_g < 1000 ? `${m.qty_g.toFixed(0)} g` : `${(m.qty_g / 1000).toFixed(2)} kg`,
            })),
            ...(batch.substrate.supplementsForBatch || []).map(s => ({
                id: `supplement-${s.supplement_id}`,
                name: s.supplement_name,
                quantity: s.unit.toLowerCase() === 'ml' && s.qty >= 1000 ? `${(s.qty / 1000).toFixed(2)} L` : `${s.qty} ${s.unit}`,
            })),
        ];
    }, [batch]);

    // Local state for edits: map of bagletId -> Metrics
    const [edits, setEdits] = useState<Record<string, BagletEditState>>({});

    // Track which PREPARED baglets are currently in "Edit Mode"
    const [editModeIds, setEditModeIds] = useState<Set<string>>(new Set());

    // Optimistic Status Overrides to ensure UI updates instantly
    const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, string>>({});

    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());






    const lastBatchIdRef = useRef<string>('');
    const { data: session } = useSession();

    // Initialize/Sync Effect
    useEffect(() => {
        if (isOpen && batch) {
            // Safe Wipe: If switching batches, clear all local state to prevent "ghost data"
            if (lastBatchIdRef.current !== batch.id) {
                setEdits({});
                setLocalStatusOverrides({});
                setIngredientChecks({});
                // Note: functional updates below will receive this cleared state as 'prev'
                lastBatchIdRef.current = batch.id;
            }

            // Determine Step
            const hasPrepared = activeBaglets.some(b => b.status === PREPARATION_TRANSITION.to);
            if (hasPrepared) {
                setStep('GRID');
            } else {
                // Only reset step if it's a new session/batch
                if (lastBatchIdRef.current !== batch.id) {
                    setStep('CHECKLIST');
                    // Logic handles checking step state separately, but valid to reset view.
                    // Actually logic below handles ingredient checks init.
                }

                // Initialize checks if empty
                setIngredientChecks(prev => {
                    // Only init if empty keys
                    if (Object.keys(prev).length === 0) {
                        const initialChecks: Record<string, boolean> = {};
                        ingredients.forEach(ing => { initialChecks[ing.id] = false; });
                        return initialChecks;
                    }
                    return prev;
                });
            }

            // Initialize Edits
            const initialEdits: Record<string, BagletEditState> = {};
            activeBaglets.forEach(b => {
                // STRICTLY use the official metrics from the database for ALL baglets.
                // This allows PLANNED baglets to show previously saved (or auto-filled) drafts,
                // while avoiding "latest_" junk data.
                const weight = b.weight || '';
                const temp = b.temperature || '';
                const hum = b.humidity || '';
                const ph = b.ph || '';

                initialEdits[b.id] = {
                    weight: weight.toString(),
                    temperature: temp.toString(),
                    humidity: hum.toString(),
                    ph: ph.toString()
                };
            });

            // CASCADE PASS: Propagate Temp/Hum/pH from prepared/filled baglets to subsequent empty ones.
            // This ensures that on "Resume", the remaining empty baglets inherit the correct environment metrics.
            let lastMetrics = { temp: '', hum: '', ph: '' };

            activeBaglets.forEach(b => {
                const edit = initialEdits[b.id];

                // If this row has valid metrics, it sets the context for following rows
                if (edit.temperature && edit.humidity && edit.ph) {
                    lastMetrics = {
                        temp: edit.temperature,
                        hum: edit.humidity,
                        ph: edit.ph
                    };
                }
                // If row is PLANNED and effectively empty (no environment data), fill it
                else if (b.status === PREPARATION_TRANSITION.from && lastMetrics.temp) {
                    // Only fill if all env fields are empty to avoid overwriting partial work
                    if (!edit.temperature && !edit.humidity && !edit.ph) {
                        initialEdits[b.id] = {
                            ...edit,
                            temperature: lastMetrics.temp,
                            humidity: lastMetrics.hum,
                            ph: lastMetrics.ph
                        };
                    }
                }
            });

            // Only update local state if key doesn't exist (preserve user typing)
            setEdits(prev => {
                const next = { ...prev };
                let changed = false;
                Object.entries(initialEdits).forEach(([id, data]) => {
                    if (!next[id]) {
                        next[id] = data;
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }
    }, [isOpen, batch, activeBaglets, ingredients]);

    // Checklist logic
    const handleIngredientToggle = (ingredientId: string) => {
        setIngredientChecks(prev => ({ ...prev, [ingredientId]: !prev[ingredientId] }));
    };
    const isChecklistComplete = ingredients.length > 0 && ingredients.every(ing => ingredientChecks[ing.id]);
    const handleStartGrid = () => setStep('GRID');



    const handleChange = (id: string, field: keyof BagletEditState, value: string) => {
        setEdits(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const toggleEditMode = (id: string) => {
        setEditModeIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id); // Cancel edit
            } else {
                next.add(id); // Start edit
            }
            return next;
        });
    };

    const handleSave = async (bagletId: string, currentStatus: string) => {
        const data = edits[bagletId];
        if (!data) return;

        // Validation - Frontend Checks
        // Validation - Frontend Checks
        // Enforce Integers for Weight and Humidity (Database requirement)
        // Parse values (Validation handled by StepperInput restrictions)
        const weight = parseInt(data.weight, 10); // Parse as Integer
        const temp = parseFloat(data.temperature);
        const hum = parseInt(data.humidity, 10);  // Parse as Integer
        const ph = parseFloat(data.ph);

        if (isNaN(weight) || isNaN(temp) || isNaN(hum) || isNaN(ph)) {
            alert('Please enter valid numbers for all fields');
            return;
        }

        if (weight <= 0) { alert('Weight must be positive'); return; }
        if (temp < 1 || temp > 100) { alert('Temperature must be between 1 and 100 °C'); return; }
        if (hum < 1 || hum > 100) { alert('Humidity must be between 1 and 100 %'); return; }
        if (ph < 1 || ph > 14) { alert('pH must be between 1 and 14'); return; }

        const effectiveStatus = localStatusOverrides[bagletId] || currentStatus;
        const isUpdate = effectiveStatus === PREPARATION_TRANSITION.to;
        const endpoint = isUpdate
            ? `/api/baglets/${bagletId}/metrics`
            : `/api/baglets/${bagletId}/prepare`;

        setSavingIds(prev => new Set(prev).add(bagletId));

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weight,
                    temperature: temp,
                    humidity: hum,
                    ph,
                    ...(isUpdate ? {} : { updated_by: session?.user?.email || 'user@cultivator.app' }) // Schema requires email format
                })
            });

            const result = await res.json();

            if (!res.ok) {
                let msg = result.error || 'Failed to save';
                if (result.details) {
                    msg += `: ${JSON.stringify(result.details)}`;
                }
                throw new Error(msg);
            }

            setLocalStatusOverrides(prev => ({ ...prev, [bagletId]: PREPARATION_TRANSITION.to }));

            // Auto-fill subsequent PLANNED baglets ...
            const draftSaves: Array<{ id: string, data: { temperature: number, humidity: number, ph: number } }> = [];

            setEdits(prev => {
                const next = { ...prev };
                let changed = false;
                // Use the sanitized/rounded values for auto-fill to ensures consistency
                // (e.g. if 86.5 was rounded to 87 for DB, next row should receive 87)
                const source = {
                    temperature: temp.toString(),
                    humidity: hum.toString(),
                    ph: ph.toString()
                };
                activeBaglets.forEach(b => {
                    // Check effective status (considering overrides)
                    const effectiveStatus = localStatusOverrides[b.id] || b.status;
                    const isPlanned = effectiveStatus === PREPARATION_TRANSITION.from;

                    if (b.id === bagletId) return; // Skip current

                    if (isPlanned) {
                        const current = next[b.id];
                        // Only auto-fill if ALL auto-fillable fields are empty
                        if (current && !current.temperature && !current.humidity && !current.ph) {
                            next[b.id] = {
                                ...current,
                                ...source
                            };
                            changed = true;

                            // Prepare DB persist for auto-filled draft
                            draftSaves.push({
                                id: b.id,
                                data: {
                                    temperature: parseFloat(source.temperature),
                                    humidity: parseFloat(source.humidity),
                                    ph: parseFloat(source.ph)
                                }
                            });
                        }
                    }
                });
                return changed ? next : prev;
            });

            // Fire-and-forget background save for auto-filled drafts
            if (draftSaves.length > 0) {
                draftSaves.forEach(draft => {
                    fetch(`/api/baglets/${draft.id}/metrics`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(draft.data)
                    }).catch(err => console.error("Auto-save draft failed", err));
                });
            }

            if (isUpdate) {
                setEditModeIds(prev => {
                    const next = new Set(prev);
                    next.delete(bagletId);
                    return next;
                });
            }

            onUpdate();

        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setSavingIds(prev => {
                const next = new Set(prev);
                next.delete(bagletId);
                return next;
            });
        }
    };

    if (!isOpen) return null;

    // Calculate completed count based on effective status (DB status + local overrides)
    const completedCount = activeBaglets.filter(b => {
        const effectiveStatus = localStatusOverrides[b.id] || b.status;
        return effectiveStatus === PREPARATION_TRANSITION.to;
    }).length;
    const totalCount = activeBaglets.length;
    const isAllComplete = completedCount === totalCount && totalCount > 0;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden bg-black/95 backdrop-blur-md animate-in fade-in duration-200 flex flex-col">

            {/* Header */}
            <div className="flex-none p-4 border-b border-white/10 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div>
                    <h2 className="text-xl font-bold text-gray-200">
                        {step === 'CHECKLIST' ? 'Preparation Checklist' : 'Batch Preparation'}
                    </h2>
                    {step === 'GRID' && (
                        <p className="text-xs text-gray-500 font-mono mt-1">
                            Completed: <span className="text-accent-leaf font-bold">{completedCount}</span>
                            <span className="text-gray-600 mx-1">/</span>
                            <span className={isAllComplete ? "text-accent-leaf font-bold" : "text-gray-500"}>{totalCount}</span>
                        </p>
                    )}
                </div>
                <Button
                    variant="ghost"
                    onClick={onClose}
                    className="rounded-full h-10 w-10 p-0 flex items-center justify-center bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all"
                    title="Close"
                >
                    ✕
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="max-w-7xl mx-auto w-full pb-20">

                    {step === 'CHECKLIST' ? (
                        <div className="max-w-lg mx-auto bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                            <p className="text-sm text-gray-400 mb-6">
                                Check off each ingredient as you add it to the substrate mix.
                            </p>

                            <div className="space-y-3 mb-6">
                                {ingredients.map(ingredient => (
                                    <div
                                        key={ingredient.id}
                                        onClick={() => handleIngredientToggle(ingredient.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${ingredientChecks[ingredient.id]
                                            ? 'bg-accent-leaf/10 border-accent-leaf/30'
                                            : 'bg-white/5 border-white/10 hover:border-gray-600'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${ingredientChecks[ingredient.id] ? 'bg-accent-leaf border-accent-leaf text-black' : 'border-gray-500'
                                            }`}>
                                            {ingredientChecks[ingredient.id] && '✓'}
                                        </div>
                                        <div className="flex-1">
                                            <span className={ingredientChecks[ingredient.id] ? 'text-white font-medium' : 'text-gray-400'}>{ingredient.name}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">{ingredient.quantity}</div>
                                    </div>
                                ))}
                                {ingredients.length === 0 && <p className="text-gray-500 italic">No ingredients found for this batch.</p>}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5 bg-transparent">
                                <Button variant="ghost" onClick={onClose} className="flex-1 border border-white/10">
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleStartGrid}
                                    disabled={!isChecklistComplete}
                                    className="flex-1 bg-accent-leaf text-black hover:bg-accent-leaf/90"
                                >
                                    Start Preparation
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto rounded-lg border border-white/10 bg-[#0a0a0a]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/5 text-xs text-gray-400 uppercase tracking-wider">
                                            <th className="p-4 font-medium">Baglet ID</th>
                                            <th className="p-4 font-medium w-24">Status</th>
                                            <th className="p-4 font-medium text-center w-32">Weight (g)</th>
                                            <th className="p-4 font-medium text-center w-32">Temp (°C)</th>
                                            <th className="p-4 font-medium text-center w-32">Hum (%)</th>
                                            <th className="p-4 font-medium text-center w-24">pH</th>
                                            <th className="p-4 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {activeBaglets.map(baglet => {
                                            const status = localStatusOverrides[baglet.id] || baglet.status;
                                            const isPrepared = status === PREPARATION_TRANSITION.to;
                                            const isUpdate = isPrepared;
                                            const isEditing = editModeIds.has(baglet.id);
                                            const isReadOnly = isPrepared && !isEditing;
                                            const data = edits[baglet.id] || { weight: '', temperature: '', humidity: '', ph: '' };
                                            const isSaving = savingIds.has(baglet.id);

                                            return (
                                                <tr key={baglet.id} className={`group hover:bg-white/[0.02] transition-colors ${isPrepared ? 'bg-accent-leaf/5' : ''}`}>
                                                    <td className="p-4 font-mono text-sm text-gray-300 whitespace-nowrap">
                                                        {baglet.id}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center justify-center w-16 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isPrepared
                                                            ? 'bg-accent-leaf/20 text-accent-leaf border-accent-leaf/30'
                                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                            }`}>
                                                            {isPrepared ? 'PREPARED' : 'PLANNED'}
                                                        </span>
                                                    </td>

                                                    {/* Inputs - Removed Placeholders */}
                                                    <td className="p-2">
                                                        {isReadOnly ? (
                                                            <div className="text-center font-mono text-white">{Number(data.weight).toFixed(0)}</div>
                                                        ) : (
                                                            <StepperInput
                                                                value={edits[baglet.id]?.weight ?? ''}
                                                                onChange={(v) => handleChange(baglet.id, 'weight', v)}
                                                                min={1}
                                                                max={10000}
                                                                step={10}
                                                                readOnly={isReadOnly}
                                                                className="w-24"
                                                                integerOnly={true}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        {isReadOnly ? (
                                                            <div className="text-center font-mono text-white">{Number(data.temperature).toFixed(1)}</div>
                                                        ) : (
                                                            <StepperInput
                                                                value={data.temperature}
                                                                onChange={v => handleChange(baglet.id, 'temperature', v)}
                                                                step={0.1} min={1} max={100} placeholder=""
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        {isReadOnly ? (
                                                            <div className="text-center font-mono text-white">{Number(data.humidity).toFixed(0)}</div>
                                                        ) : (
                                                            <StepperInput
                                                                value={data.humidity}
                                                                onChange={v => handleChange(baglet.id, 'humidity', v)}
                                                                step={10} min={1} max={100} placeholder=""
                                                                integerOnly={true}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        {isReadOnly ? (
                                                            <div className="text-center font-mono text-white">{Number(data.ph).toFixed(1)}</div>
                                                        ) : (
                                                            <StepperInput
                                                                value={data.ph}
                                                                onChange={v => handleChange(baglet.id, 'ph', v)}
                                                                step={0.1} min={1} max={14} placeholder=""
                                                            />
                                                        )}
                                                    </td>

                                                    <td className="p-4 text-right">
                                                        {isReadOnly ? (
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => toggleEditMode(baglet.id)}
                                                                className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                                                            >
                                                                ✎
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                disabled={isSaving}
                                                                onClick={() => handleSave(baglet.id, baglet.status)}
                                                                className={`min-w-[80px] ${isUpdate ? 'bg-blue-600 hover:bg-blue-500' : 'bg-accent-leaf hover:bg-accent-leaf/90 text-black'}`}
                                                            >
                                                                {isSaving ? '...' : (isUpdate ? 'Update' : 'Save')}
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {activeBaglets.map(baglet => {
                                    const status = localStatusOverrides[baglet.id] || baglet.status;
                                    const isPrepared = status === PREPARATION_TRANSITION.to;
                                    const isUpdate = isPrepared; // Use resolved status
                                    const isEditing = editModeIds.has(baglet.id);
                                    const isReadOnly = isPrepared && !isEditing;
                                    const data = edits[baglet.id] || { weight: '', temperature: '', humidity: '', ph: '' };
                                    const isSaving = savingIds.has(baglet.id);


                                    return (
                                        <div key={baglet.id} className={`rounded-xl border p-4 transition-all ${isPrepared
                                            ? 'bg-accent-leaf/5 border-accent-leaf/20'
                                            : 'bg-white/5 border-white/10'
                                            }`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="font-mono text-sm text-gray-400 break-all">{baglet.id}</div>
                                                    <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isPrepared
                                                        ? 'bg-accent-leaf/20 text-accent-leaf border-accent-leaf/30'
                                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                        }`}>
                                                        {isPrepared ? 'PREPARED' : 'PLANNED'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Grid Inputs */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Weight (g)</label>
                                                    {isReadOnly ? (
                                                        <div className="p-2 bg-black/30 border border-white/5 rounded font-mono text-center text-white">{Number(data.weight).toFixed(0)}</div>
                                                    ) : (
                                                        <StepperInput value={data.weight} onChange={v => handleChange(baglet.id, 'weight', v)} step={10} min={1} max={5000} placeholder="" integerOnly={true} />
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Temp (°C)</label>
                                                    {isReadOnly ? (
                                                        <div className="p-2 bg-black/30 border border-white/5 rounded font-mono text-center text-white">{Number(data.temperature).toFixed(1)}</div>
                                                    ) : (
                                                        <StepperInput value={data.temperature} onChange={v => handleChange(baglet.id, 'temperature', v)} step={0.1} min={1} max={100} placeholder="" />
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Hum (%)</label>
                                                    {isReadOnly ? (
                                                        <div className="p-2 bg-black/30 border border-white/5 rounded font-mono text-center text-white">{Number(data.humidity).toFixed(0)}</div>
                                                    ) : (
                                                        <StepperInput value={data.humidity} onChange={v => handleChange(baglet.id, 'humidity', v)} step={10} min={1} max={100} placeholder="" integerOnly={true} />
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">pH</label>
                                                    {isReadOnly ? (
                                                        <div className="p-2 bg-black/30 border border-white/5 rounded font-mono text-center text-white">{Number(data.ph).toFixed(1)}</div>
                                                    ) : (
                                                        <StepperInput value={data.ph} onChange={v => handleChange(baglet.id, 'ph', v)} step={0.1} min={1} max={14} placeholder="" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Footer */}
                                            <div className="mt-4 pt-3 border-t border-white/5">
                                                {isReadOnly ? (
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => toggleEditMode(baglet.id)}
                                                        className="w-full h-10 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                                                    >
                                                        <span>Edit</span> ✎
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => handleSave(baglet.id, baglet.status)}
                                                        disabled={isSaving}
                                                        className={`w-full h-10 text-sm font-bold uppercase tracking-wider ${isUpdate ? 'bg-blue-600' : 'bg-accent-leaf text-black'}`}
                                                    >
                                                        {isSaving ? 'Saving...' : (isUpdate ? 'Update' : 'Save')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Completion Banner / Done Button */}
                            {isAllComplete && (
                                <div className="mt-8 p-6 rounded-xl border border-accent-leaf/30 bg-accent-leaf/10 text-center animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-leaf text-black mb-4">
                                        <span className="text-2xl">✓</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">All Baglets Prepared!</h3>
                                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                        You have successfully recorded metrics for all items in this batch.
                                    </p>
                                    <Button
                                        variant="primary"
                                        onClick={onClose}
                                        className="w-full md:w-auto min-w-[200px] h-12 text-lg bg-accent-leaf text-black hover:bg-accent-leaf/90 font-bold"
                                    >
                                        Done
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
