'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import QRLabelGrid from '@/components/batches/QRLabelGrid';
import { Batch } from '@/lib/types';
import Link from 'next/link';

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

interface RecipeItem {
  name: string;
  qty: number;
  unit: string;
}

interface BatchWithRecipe extends Batch {
  recipe?: {
    mediums: { medium_name: string; qty_g: number }[];
    supplements: { supplement_name: string; qty: number; unit: string }[];
  };
  statusBreakdown?: { status: string; count: number }[];
}

export default function BatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  console.log('BatchDetailPage mounted with params:', params);
  const [batch, setBatch] = useState<BatchWithRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchBatch();
  }, [params.id]);

  async function fetchBatch() {
    try {
      const res = await fetch(`/api/batches/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch batch');
      const data = await res.json();
      setBatch(data.batch || null);
    } catch (error) {
      console.error('Failed to fetch batch:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(action: 'sterilize' | 'inoculate') {
    if (!batch) return;

    const actionName = action === 'sterilize' ? 'STERILIZED' : 'INOCULATED';
    const currentStatus = action === 'sterilize' ? 'Planned' : 'Sterilized';

    const confirmed = window.confirm(
      `Do you want to update the status of all baglets in "${currentStatus}" state in Batch "${batch.id}" to "${actionName}"?`
    );

    if (!confirmed) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/batches/${batch.id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          updated_by: 'user@example.com',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      alert(`✅ Updated ${data.updated_count} baglets to ${data.to_status}`);

      // Refresh data
      await fetchBatch();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading batch details...</div>;
  }

  if (!batch) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-100 mb-6">Batch Not Found</h1>
        <Link href="/batches">
          <Button variant="primary">← Back to Batches</Button>
        </Link>
      </div>
    );
  }

  // Calculate Recipe Totals
  const BAG_WEIGHT_KG = 2;
  const totalMixWeightKg = batch.plannedBagletCount * BAG_WEIGHT_KG;

  const recipeItems: RecipeItem[] = [];

  if (batch.recipe) {
    batch.recipe.mediums.forEach((m) => {
      recipeItems.push({
        name: m.medium_name,
        qty: m.qty_g * totalMixWeightKg,
        unit: 'g',
      });
    });
    batch.recipe.supplements.forEach((s) => {
      recipeItems.push({
        name: s.supplement_name,
        qty: s.qty * totalMixWeightKg,
        unit: s.unit || 'g',
      });
    });
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/batches">
          <Button variant="ghost" size="sm">
            ← Back to Batches
          </Button>
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-leaf to-accent-sky bg-clip-text text-transparent mt-4">🌾 {batch.id}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card variant="default">
          <p className="text-xs text-gray-400 mb-1">Mushroom Type</p>
          <p className="text-xl font-semibold text-accent-leaf">
            {batch.mushroomType}
          </p>
        </Card>
        <Card variant="default">
          <p className="text-xs text-gray-400 mb-1">Baglets</p>
          <p className="text-xl font-semibold text-accent-leaf">
            {batch.actualBagletCount} / {batch.plannedBagletCount}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card variant="default">
          <p className="text-sm font-semibold text-gray-300 mb-3">Details</p>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-400">Substrate Code:</p>
              <p className="text-gray-200">{batch.substrateCode}</p>
            </div>
            <div>
              <p className="text-gray-400">Substrate Description:</p>
              <p className="text-gray-200">{batch.substrateDescription}</p>
            </div>
            <div>
              <p className="text-gray-400">Created Date:</p>
              <p className="text-gray-200">
                {formatDate(batch.createdDate)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Prepared Date:</p>
              <p className="text-gray-200">
                {formatDate(batch.preparedDate)}
              </p>
            </div>
            {batch.notes && (
              <div>
                <p className="text-gray-400">Notes:</p>
                <p className="text-gray-200">{batch.notes}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Recipe Section - Only visible if Planned */}
          {batch.status === 'Planned' && recipeItems.length > 0 && (
            <Card variant="default">
              <p className="text-sm font-semibold text-gray-300 mb-3">
                Recipe (Total for {batch.plannedBagletCount} bags @ {BAG_WEIGHT_KG}kg)
              </p>
              <div className="space-y-2 text-sm">
                {recipeItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between border-b border-gray-800 pb-1 last:border-0">
                    <span className="text-gray-400">{item.name}</span>
                    <span className="text-accent-sky font-mono">
                      {item.qty.toLocaleString()} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card variant="default">
            <p className="text-sm font-semibold text-gray-300 mb-3">Actions</p>
            <div className="space-y-2">
              {/* Flag Sterilized - Show if any baglet is Planned */}
              {batch.statusBreakdown?.some(s => s.status === 'Planned') && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleStatusUpdate('sterilize')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : '🔥 Flag as Sterilized'}
                </Button>
              )}

              {/* Flag Inoculated - Show if any baglet is Sterilized */}
              {batch.statusBreakdown?.some(s => s.status === 'Sterilized') && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleStatusUpdate('inoculate')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : '💉 Flag as Inoculated'}
                </Button>
              )}

              <Button variant="secondary" className="w-full">
                🔗 View All Baglets
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <QRLabelGrid batchId={batch.id} />
    </div>
  );
}
