'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SubstrateMix from '@/components/batches/SubstrateMix';
import BagletStatusDistribution from '@/components/batches/BagletStatusDistribution';
import BagletsList from '@/components/batches/BagletsList';
import BatchMetricsWizardModal from '@/components/batches/BatchMetricsWizardModal';
import PrepareBatchModal from '@/components/batches/PrepareBatchModal';
import { BatchDetails } from '@/lib/types';
import { getBatchWorkflowStage } from '@/lib/baglet-workflow';
import { BATCH_LABELS } from '@/lib/labels';

function formatDate(dateString: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatDateTime(dateString: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function BatchDetailPage() {
    const params = useParams();
    const router = useRouter();
    const batchId = params.id as string;

    const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showMetricsWizard, setShowMetricsWizard] = useState(false);
    const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);

    async function fetchBatchDetails() {
        try {
            setLoading(true);
            // Add timestamp to force fresh fetch
            const res = await fetch(`/api/batches/${batchId}?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Batch not found');
                }
                throw new Error('Failed to fetch batch details');
            }

            const data = await res.json();
            setBatchDetails(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusUpdate(action: 'sterilize' | 'inoculate') {
        if (!batchDetails) return;

        let actionName = '';
        let currentStatus = '';

        if (action === 'sterilize') {
            actionName = 'STERILIZED';
            currentStatus = 'PLANNED';
        } else if (action === 'inoculate') {
            actionName = 'INOCULATED';
            currentStatus = 'STERILIZED';
        }

        const count = batchDetails.bagletStatusCounts?.[currentStatus] ?? 0;

        if (count === 0) {
            alert(`No baglets found in ${currentStatus} status`);
            return;
        }

        const confirmed = window.confirm(
            `Do you want to update the status of all ${count} baglets in Batch "${batchId}" to '${actionName}'?`
        );

        if (!confirmed) return;

        setUpdatingStatus(true);
        try {
            const res = await fetch(`/api/batches/${batchId}/update-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    updated_by: 'user@example.com', // TODO: Get from auth session
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update status');
            }

            alert(`✅ Updated ${data.updated_count} baglets to ${data.to_status}`);

            // Force a complete refresh of the page data
            setLoading(true);
            await fetchBatchDetails();
            router.refresh(); // Force Next.js to refresh the route
            setLoading(false);
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setUpdatingStatus(false);
        }
    }

    useEffect(() => {
        if (batchId) {
            fetchBatchDetails();
        }
    }, [batchId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-leaf mb-4"></div>
                    <p className="text-gray-400">Loading batch details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full border border-red-800/30">
                    <div className="p-6 text-center">
                        <div className="text-4xl mb-4">❌</div>
                        <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
                        <p className="text-gray-400 mb-4">{error}</p>
                        <Button onClick={() => router.push('/batches')} variant="secondary">
                            Back to Batches
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!batchDetails) {
        return null;
    }

    // batchDetails is now flattened - no nested batch object
    const batch = batchDetails;
    const baglets = batchDetails.baglets;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push('/batches')}
                        className="flex items-center gap-2"
                    >
                        <span>←</span>
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold text-accent-leaf">
                        {batch.id}
                    </h1>
                </div>

                {/* Bulk Actions in Header */}
                <div className="flex flex-wrap gap-2">
                    {/* Smart Workflow Buttons */}
                    {(() => {
                        const stage = getBatchWorkflowStage(batch.bagletStatusCounts || {});
                        if (stage === 'PREPARE' || stage === 'RESUME') {
                            return (
                                <Button variant="primary" size="sm" onClick={() => setIsPrepareModalOpen(true)} className="flex items-center gap-2">
                                    <span className="text-lg">📝</span>
                                    <span>{stage === 'PREPARE' ? BATCH_LABELS.PREPARE_BATCH : BATCH_LABELS.RESUME_PREPARATION}</span>
                                </Button>
                            );
                        }
                        if (stage === 'STERILIZE') {
                            const preparedCount = batch.bagletStatusCounts?.['PREPARED'] ?? 0;
                            return (
                                <Button variant="primary" size="sm" onClick={() => handleStatusUpdate('sterilize')} disabled={updatingStatus} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white border-none">
                                    <span className="text-lg">🔥</span>
                                    <span>{updatingStatus ? 'Updating...' : `Mark Sterilized (${preparedCount})`}</span>
                                </Button>
                            );
                        }
                        return null;
                    })()}

                    {/* Flag Inoculated - Show if at least one baglet is STERILIZED */}
                    {(batch.bagletStatusCounts?.['STERILIZED'] ?? 0) > 0 && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusUpdate('inoculate')}
                            disabled={updatingStatus}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-none"
                        >
                            <span className="text-lg">💉</span>
                            <span>{updatingStatus ? 'Updating...' : `Mark Inoculated (${batch.bagletStatusCounts['STERILIZED']})`}</span>
                        </Button>
                    )}




                    {/* Add Extra Baglet - Manual Override for Surplus Material */}
                    {/* "display when all baglet is prepared stat" (PLANNED) */}
                    {(batch.bagletStatusCounts?.['PLANNED'] ?? 0) > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                                const confirmed = window.confirm(
                                    `Found extra material?\n\nThis will add 1 new baglet to Batch ${batch.id}.\nCurrent Count: ${batch.actualBagletCount} -> New Count: ${batch.actualBagletCount + 1}`
                                );
                                if (!confirmed) return;

                                setUpdatingStatus(true);
                                try {
                                    const res = await fetch(`/api/batches/${batch.id}/add-baglet`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ user: 'user@example.com' }), // TODO: Real auth
                                    });

                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error);

                                    alert(`✅ ${data.message}`);
                                    // Refresh data
                                    await fetchBatchDetails();
                                    router.refresh();
                                } catch (e: any) {
                                    alert(`❌ Failed: ${e.message}`);
                                } finally {
                                    setUpdatingStatus(false);
                                }
                            }}
                            disabled={updatingStatus}
                            className="flex items-center gap-2 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                        >
                            <span className="text-lg">➕</span>
                            <span>Add Baglet</span>
                        </Button>
                    )}

                    {/* Rapid Metrics Update - Show if at least one baglet is STERILIZED (or later) */}
                    {/* User requested: "enable if atleast one baglet in sterilized state" */}
                    {((batch.bagletStatusCounts?.['STERILIZED'] ?? 0) > 0 ||
                        (batch.bagletStatusCounts?.['INOCULATED'] ?? 0) > 0 ||
                        (batch.bagletStatusCounts?.['INCUBATED'] ?? 0) > 0) && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowMetricsWizard(true)}
                                className="flex items-center gap-2"
                            >
                                <span className="text-lg">📊</span>
                                <span>Log Metrics</span>
                            </Button>
                        )}
                </div>
            </div>

            {/* Metrics Wizard */}
            <BatchMetricsWizardModal
                isOpen={showMetricsWizard}
                onClose={() => setShowMetricsWizard(false)}
                baglets={baglets}
                onUpdate={() => {
                    fetchBatchDetails();
                    router.refresh();
                }}
            />

            {/* Prepare Batch Modal */}
            {batchDetails && (
                <PrepareBatchModal
                    isOpen={isPrepareModalOpen}
                    onClose={() => setIsPrepareModalOpen(false)}
                    batch={batchDetails}
                    onUpdate={() => {
                        fetchBatchDetails();
                        router.refresh();
                    }}
                />
            )}

            {/* Batch Summary */}
            <Card className="border border-gray-800/30">
                <div className="p-4 md:p-5">
                    <h2 className="text-lg md:text-xl font-semibold text-accent-leaf mb-4">
                        Batch Information
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Mushroom Type
                            </div>
                            <div className="text-base font-semibold text-gray-200">
                                {batch.mushroomType}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Strain
                            </div>
                            <div className="text-base font-semibold text-gray-200">
                                {batch.strain.code}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                {batch.strain.vendorName}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Farm
                            </div>
                            <div className="text-base font-semibold text-gray-200">
                                {batch.farmName || batch.farmId}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Prepared Date
                            </div>
                            <div className="text-base font-semibold text-gray-200">
                                {formatDate(batch.preparedDate)}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Batch Sequence
                            </div>
                            <div className="text-base font-semibold text-gray-200">
                                #{batch.sequence}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Created
                            </div>
                            <div className="text-base font-semibold text-gray-200">
                                {formatDateTime(batch.createdAt)}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                by {batch.createdBy}
                            </div>
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Baglet Count
                            </div>
                            <div className="text-base font-semibold text-gray-200">
                                <span className="text-accent-leaf">{batch.actualBagletCount}</span>
                                <span className="text-gray-500 mx-1">/</span>
                                <span className="text-gray-400">{batch.plannedBagletCount}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                    ({((batch.actualBagletCount / batch.plannedBagletCount) * 100).toFixed(0)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Status Distribution and Substrate Mix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <BagletStatusDistribution
                    statusCounts={batch.bagletStatusCounts}
                    totalBaglets={batch.actualBagletCount}
                />

                <SubstrateMix
                    substrateName={batch.substrate.name}
                    mediums={batch.substrate.mediums}
                    supplements={batch.substrate.supplements}
                    mediumsForBatch={batch.substrate.mediumsForBatch}
                    supplementsForBatch={batch.substrate.supplementsForBatch}
                    bagletCount={batch.plannedBagletCount}
                />
            </div>

            {/* Baglets List */}
            <BagletsList baglets={baglets} />

            {/* Action Buttons */}
            <Card className="border border-gray-800/30">
                <div className="p-4 md:p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">
                        Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/baglets?batch=${batch.id}`)}
                        >
                            View All Baglets
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push('/batches')}
                        >
                            Back to Batches
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
