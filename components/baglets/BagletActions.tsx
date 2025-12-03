'use client';

import { useState } from 'react';
import { BagletStatus } from '@/lib/types';
import { getAvailableTransitions } from '@/lib/baglet-workflow';
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
        if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

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
            <Card className="p-4">
                <p className="text-gray-400 text-sm">No further actions available (End of Lifecycle).</p>
            </Card>
        );
    }

    return (
        <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Available Actions</h3>
            <div className="flex flex-wrap gap-3">
                {availableTransitions.map((status) => (
                    <button
                        key={status}
                        onClick={() => handleTransition(status)}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-accent-neon-green/20 border border-white/10 hover:border-accent-neon-green/50 text-gray-200 hover:text-accent-neon-green transition-all duration-300 text-sm font-medium backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>
        </Card>
    );
}
