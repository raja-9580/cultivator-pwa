'use client';

import { useState } from 'react';
import { BagletStatus } from '@/lib/types';
import { getAvailableTransitions, HARVESTED_STATES, CRC_STATES } from '@/lib/baglet-workflow';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

interface BagletActionsProps {
    bagletId: string;
    currentStatus: BagletStatus;
    onStatusUpdate: () => void;
}

export default function BagletActions({ bagletId, currentStatus, onStatusUpdate }: BagletActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const availableTransitions = getAvailableTransitions(currentStatus);

    const handleTransition = async (newStatus: BagletStatus) => {
        // Handle specialized navigation states
        if ((HARVESTED_STATES as readonly string[]).includes(newStatus)) {
            router.push(`/harvest?bagletId=${bagletId}`);
            return;
        }

        if ((CRC_STATES as readonly string[]).includes(newStatus)) {
            router.push(`/crc?bagletId=${bagletId}`);
            return;
        }

        if (!confirm(`Are you sure you want to change status to ${newStatus.replace(/_/g, ' ')}?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/baglets/${bagletId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newStatus }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(`Error: ${error.error}`);
                return;
            }

            onStatusUpdate();
            router.refresh();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    if (availableTransitions.length === 0) {
        return (
            <Card className="p-4 border-white/5 opacity-50">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Lifecycle Complete</p>
            </Card>
        );
    }

    return (
        <Card className="p-4 md:p-6 border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Available Actions</h3>

            <div className="flex flex-col gap-2">
                {availableTransitions.map((status) => {
                    const isHarvest = (HARVESTED_STATES as readonly string[]).includes(status);
                    const isCRC = (CRC_STATES as readonly string[]).includes(status);

                    // Specialized Button Styling
                    let buttonClass = "w-full p-4 rounded-xl font-black text-[10px] text-center uppercase tracking-[0.2em] transition-all duration-200 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2";
                    let label = status.replace(/_/g, ' ');

                    if (isHarvest) {
                        buttonClass += " bg-accent-neon-green text-black shadow-accent-neon-green/10 hover:brightness-110";
                        label = "Record Harvest";
                    } else if (isCRC) {
                        buttonClass += " bg-red-600 text-white shadow-red-900/10 hover:bg-red-500";
                        label = "Analyze Health";
                    } else {
                        buttonClass = "w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white text-center transition-all duration-200";
                    }

                    return (
                        <button
                            key={status}
                            onClick={() => handleTransition(status)}
                            disabled={loading}
                            className={buttonClass}
                        >
                            {isHarvest && <span className="text-[12px]">⚖️</span>}
                            {isCRC && <span className="text-[12px]">🔍</span>}
                            {label}
                        </button>
                    );
                })}
            </div>
        </Card>
    );
}
