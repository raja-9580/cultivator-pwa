'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';


interface BatchMetricsWizardProps {
    isOpen: boolean;
    onClose: () => void;
    baglets: any[]; // Using any for now to match the page's baglet structure
    onUpdate: () => void; // Callback to refresh data
}

export default function BatchMetricsWizardModal({ isOpen, onClose, baglets, onUpdate }: BatchMetricsWizardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentBaglet, setCurrentBaglet] = useState<any>(null);
    const [weight, setWeight] = useState<string>('');
    const [temperature, setTemperature] = useState<string>('');
    const [humidity, setHumidity] = useState<string>('');
    const [saving, setSaving] = useState(false);

    // Filter baglets that are eligible for metrics update (e.g., not deleted)
    // The user said "atleast one baglet in sterilized state", so maybe we filter by that?
    // But usually you want to update all relevant ones. Let's iterate through all provided baglets.
    const eligibleBaglets = baglets;

    useEffect(() => {
        if (isOpen && eligibleBaglets.length > 0) {
            loadBaglet(currentIndex);
        }
    }, [isOpen, currentIndex, eligibleBaglets]);

    const loadBaglet = (index: number) => {
        if (index >= 0 && index < eligibleBaglets.length) {
            const baglet = eligibleBaglets[index];
            setCurrentBaglet(baglet);
            setWeight(baglet.weight?.toString() || '');
            setTemperature(baglet.temperature?.toString() || '');
            setHumidity(baglet.humidity?.toString() || '');
        }
    };

    const handleSave = async (autoAdvance: boolean = true) => {
        if (!currentBaglet) return;

        setSaving(true);
        try {
            const payload = {
                weight: weight ? parseFloat(weight) : undefined,
                temperature: temperature ? parseFloat(temperature) : undefined,
                humidity: humidity ? parseFloat(humidity) : undefined,
            };

            const res = await fetch(`/api/baglets/${currentBaglet.id}/metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to update metrics');

            if (autoAdvance) {
                handleNext();
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save metrics');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < eligibleBaglets.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Finished
            alert('All baglets updated!');
            onUpdate();
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg border border-accent-leaf/20 shadow-2xl bg-[#0a0a0a] relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-leaf/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-sky/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="p-5 relative z-10">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-lg md:text-xl font-bold text-gray-200">
                            Rapid Metrics Entry
                        </h2>
                        <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-mono">
                            {currentIndex + 1} / {eligibleBaglets.length}
                        </div>
                    </div>

                    {currentBaglet ? (
                        <div className="space-y-5">
                            {/* Baglet Info Card */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex flex-col gap-3">
                                    <div className="w-full">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Baglet ID</div>
                                        <div className="text-base font-mono text-white break-all leading-snug tracking-tight">
                                            {currentBaglet.id}
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2 border-t border-white/5 mt-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Status:</span>
                                            <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-sky/10 text-accent-sky border border-accent-sky/20 uppercase tracking-wide">
                                                {currentBaglet.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Input Fields Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider">Weight (g)</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="w-full bg-black/40 border border-gray-800 rounded-lg p-2.5 text-base text-white placeholder-gray-700 focus:border-accent-leaf focus:ring-1 focus:ring-accent-leaf transition-all outline-none"
                                            placeholder="0.0"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider">Temp (°C)</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={temperature}
                                            onChange={(e) => setTemperature(e.target.value)}
                                            className="w-full bg-black/40 border border-gray-800 rounded-lg p-2.5 text-base text-white placeholder-gray-700 focus:border-accent-leaf focus:ring-1 focus:ring-accent-leaf transition-all outline-none"
                                            placeholder="0.0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider">Humidity (%)</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={humidity}
                                            onChange={(e) => setHumidity(e.target.value)}
                                            className="w-full bg-black/40 border border-gray-800 rounded-lg p-2.5 text-base text-white placeholder-gray-700 focus:border-accent-leaf focus:ring-1 focus:ring-accent-leaf transition-all outline-none"
                                            placeholder="0.0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                                <Button
                                    variant="secondary"
                                    onClick={handlePrevious}
                                    disabled={currentIndex === 0 || saving}
                                    className="flex-1"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleNext()}
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    Skip
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => handleSave(true)}
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    {saving ? 'Saving...' : (currentIndex === eligibleBaglets.length - 1 ? 'Finish' : 'Next')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No baglets to update.
                        </div>
                    )}

                    <div className="mt-5 text-center">
                        <button
                            onClick={onClose}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors py-2 px-4 rounded hover:bg-white/5"
                        >
                            Cancel and Close
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
