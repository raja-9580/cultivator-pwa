'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

import FloatingActionButton from '@/components/ui/FloatingActionButton';
import CreateBatchModal from '@/components/batches/CreateBatchModal';
import BatchCard from '@/components/batches/BatchCard';
import QrScanner from '@/components/ui/QrScanner';
import { MUSHROOM_TYPES, Batch } from '@/lib/types';
import { useRouter } from 'next/navigation';



function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filters, setFilters] = useState({
    mushroomType: '',

    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [updatingBatch, setUpdatingBatch] = useState<string | null>(null);
  const router = useRouter();

  async function fetchBatches() {
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      if (data.batches) {
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  }

  async function handleStatusUpdate(batchId: string, action: 'sterilize' | 'inoculate') {
    const actionName = action === 'sterilize' ? 'STERILIZED' : 'INOCULATED';
    const currentStatus = action === 'sterilize' ? 'PLANNED' : 'STERILIZED';

    // Find the batch to get the count
    const batch = batches.find(b => b.id === batchId);
    const count = batch?.bagletStatusCounts?.[currentStatus] ?? 0;

    if (count === 0) {
      alert(`No baglets found in ${currentStatus} status`);
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Do you want to update the status of all ${count} baglets in Batch "${batchId}" to '${actionName}'?`
    );

    if (!confirmed) return;

    setUpdatingBatch(batchId);
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
      await fetchBatches(); // Refresh the list
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUpdatingBatch(null);
    }
  }

  const handleScan = (decodedText: string) => {
    setIsScannerOpen(false);
    // Navigate to baglets page with search filter
    // Assuming the QR code contains the Baglet ID directly
    router.push(`/baglets?search=${encodeURIComponent(decodedText)}`);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const filteredBatches = batches.filter((batch) => {
    if (filters.mushroomType && batch.mushroomType !== filters.mushroomType) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h1 className="text-xl md:text-2xl font-semibold text-accent-leaf">Batches</h1>
        <Button
          variant="primary"
          className="hidden md:inline-flex"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Batch
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4 md:mb-5 border border-gray-800/30 p-3 md:p-4">
        <div className="flex items-center justify-between lg:hidden mb-3">
          <span className="text-xs md:text-sm font-medium text-gray-300">Filters</span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            {showFilters ? '▼' : '▶'}
          </button>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 ${!showFilters && 'hidden lg:grid'}`}>
          <Select
            label="Mushroom Type"
            options={[
              { value: '', label: 'All Types' },
              ...MUSHROOM_TYPES.map((type) => ({ value: type, label: type })),
            ]}
            value={filters.mushroomType}
            onChange={(e) =>
              setFilters({ ...filters, mushroomType: e.target.value })
            }
          />

          <Input
            label="From Date"
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value })
            }
          />
          <Input
            label="To Date"
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>
      </Card>

      {/* Mobile: Card Grid */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {filteredBatches.map((batch) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            onStatusUpdate={handleStatusUpdate}
            updatingBatch={updatingBatch}
          />
        ))}
        {filteredBatches.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 text-sm">
            No batches found matching your filters.
          </div>
        )}
      </div>

      {/* Desktop/Tablet: Table */}
      <Card className="hidden md:block border border-gray-800/30">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-gray-800/20 bg-dark-surface-light/60 backdrop-blur-sm">
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs">
                  Batch ID
                </th>
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs">
                  Type
                </th>
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs hidden md:table-cell">
                  Substrate
                </th>
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs hidden lg:table-cell">
                  Baglets
                </th>

                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs hidden md:table-cell">
                  Created
                </th>
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch) => (
                <tr
                  key={batch.id}
                  className="border-b border-gray-800/20 hover:bg-dark-surface-light/20 transition-colors"
                >
                  <td className="py-3 md:py-3.5 px-2 md:px-4">
                    <a href={`/batches/${batch.id}`} className="text-accent-leaf hover:text-accent-sky transition-colors text-xs md:text-sm font-medium">
                      {batch.id}
                    </a>
                  </td>
                  <td className="py-3 md:py-3.5 px-2 md:px-4 text-gray-400 text-xs md:text-sm font-medium">{batch.mushroomType}</td>
                  <td className="py-3 md:py-3.5 px-2 md:px-4 text-gray-500 text-xs md:text-sm hidden md:table-cell">
                    {batch.substrateCode}
                  </td>
                  <td className="py-3 md:py-3.5 px-2 md:px-4 text-gray-400 text-xs md:text-sm font-medium hidden lg:table-cell">
                    {batch.actualBagletCount} / {batch.plannedBagletCount}
                  </td>

                  <td className="py-3 md:py-3.5 px-2 md:px-4 text-gray-500 text-xs md:text-sm hidden md:table-cell">
                    {formatDate(batch.createdDate)}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    <div className="flex gap-1 md:gap-2 flex-wrap">
                      <a
                        href={`/batches/${batch.id}`}
                        className="text-gray-400 hover:text-accent-leaf hover:bg-dark-surface-light/20 transition-colors font-medium rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm flex items-center"
                      >
                        Details
                      </a>

                      {/* Flag Sterilized - Show if at least one baglet is PLANNED */}
                      {(batch.bagletStatusCounts?.['PLANNED'] ?? 0) > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5"
                          onClick={() => handleStatusUpdate(batch.id, 'sterilize')}
                          disabled={updatingBatch === batch.id}
                        >
                          {updatingBatch === batch.id ? '...' : '🔥 Sterilized'}
                        </Button>
                      )}

                      {/* Flag Inoculated - Show if at least one baglet is STERILIZED */}
                      {(batch.bagletStatusCounts?.['STERILIZED'] ?? 0) > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5"
                          onClick={() => handleStatusUpdate(batch.id, 'inoculate')}
                          disabled={updatingBatch === batch.id}
                        >
                          {updatingBatch === batch.id ? '...' : '💉 Inoculated'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBatches.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No batches found matching your filters.
          </div>
        )}
      </Card>

      <CreateBatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchBatches}
      />

      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />

      <FloatingActionButton actions={[
        {
          label: 'Create Batch',
          icon: '➕',
          onClick: () => setIsCreateModalOpen(true)
        },
        {
          label: 'QR Scan',
          icon: '📱',
          onClick: () => setIsScannerOpen(true)
        },
      ]} />
    </div>
  );
}
