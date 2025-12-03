'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Baglet } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import BagletActions from '@/components/baglets/BagletActions';
import Link from 'next/link';

export default function BagletDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [baglet, setBaglet] = useState<Baglet | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchBaglet = async () => {
        try {
            // Currently we don't have a single baglet API, so we fetch all and filter (inefficient but works for now)
            // Ideally: GET /api/baglets/[id]
            const res = await fetch(`/api/baglets?baglet_id=${id}`);
            // Note: The existing API supports filtering by batch_id, but maybe not baglet_id directly yet.
            // Let's assume we might need to fetch all or update the API.
            // Actually, let's try to fetch the specific baglet if the API supports it, or just fetch all for the batch if we knew the batch ID.
            // Since we don't know the batch ID, we might need to update the GET API to support baglet_id.

            // For now, let's assume the API returns a list and we find it.
            const data = await res.json();
            if (data.baglets) {
                const found = data.baglets.find((b: any) => b.id === id);
                if (found) setBaglet(found);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchBaglet();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/baglets" className="text-gray-400 hover:text-white">← Back</Link>
                    <Skeleton className="h-8 w-48" />
                </div>
                <Card className="h-64" />
            </div>
        );
    }

    if (!baglet) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl text-gray-400">Baglet not found</h2>
                <Link href="/baglets" className="text-accent-neon-green mt-4 inline-block">Return to List</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/baglets" className="text-gray-400 hover:text-white transition-colors">
                        ← Back
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-100 tracking-tight">
                        {baglet.id}
                    </h1>
                </div>
                <Badge variant="info" className="self-start md:self-auto text-lg px-4 py-1">
                    {baglet.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Workflow Actions */}
                    <BagletActions
                        bagletId={baglet.id}
                        currentStatus={baglet.status}
                        onStatusUpdate={fetchBaglet}
                    />

                    {/* Metrics / History (Placeholder) */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-100 mb-4">Metrics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-sm text-gray-400">Temperature</p>
                                <p className="text-2xl font-mono text-accent-neon-blue">
                                    {baglet.metrics?.temperature ?? '--'}°C
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-sm text-gray-400">Humidity</p>
                                <p className="text-2xl font-mono text-accent-neon-green">
                                    {baglet.metrics?.humidity ?? '--'}%
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-100">Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Batch ID</span>
                                <Link href={`/batches`} className="text-accent-neon-green hover:underline">
                                    {baglet.batchId}
                                </Link>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Last Updated</span>
                                <span className="text-gray-200">
                                    {new Date(baglet.lastStatusChange).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
