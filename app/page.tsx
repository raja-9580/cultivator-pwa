'use client';

import { useState, useEffect } from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentBatches from '@/components/dashboard/RecentBatches';
import RecentBaglets from '@/components/dashboard/RecentBaglets';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import PullRefreshWrapper from '@/components/ui/PullRefreshWrapper';
import { BatchStatus, Batch, Baglet } from '@/lib/types';

export default function DashboardPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [baglets, setBaglets] = useState<Baglet[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const [batchesRes, bagletsRes] = await Promise.all([
        fetch('/api/batches'),
        fetch('/api/baglets')
      ]);

      const batchesData = await batchesRes.json();
      const bagletsData = await bagletsRes.json();

      if (batchesData.batches) setBatches(batchesData.batches);
      if (bagletsData.baglets) setBaglets(bagletsData.baglets);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    await fetchData(false);
  };

  // Calculate KPI stats
  const totalBatches = batches.length;
  const activeBatches = batches.filter(
    (b) => ![BatchStatus.Archived, BatchStatus.ReadyToHarvest].includes(b.status)
  ).length;
  const totalBaglets = baglets.length;

  const stats = [
    { label: 'Total Batches', value: totalBatches, icon: '🌾' },
    { label: 'Active Batches', value: activeBatches, icon: '⚡' },
    { label: 'Total Baglets', value: totalBaglets, icon: '📦' },
    { label: 'Ready to Harvest', value: batches.filter((b) => b.status === BatchStatus.ReadyToHarvest).length, icon: '🎯' },
  ];

  const fabActions = [
    { label: 'Create Batch', icon: '➕', href: '/batches' },
    { label: 'QR Scan', icon: '📱', href: '/batches' },
    { label: 'Add Metric', icon: '📊', href: '/metrics' },
  ];

  return (
    <PullRefreshWrapper onRefresh={handleRefresh}>
      <div>
        <DashboardStats stats={stats} loading={loading} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          <div>
            <RecentBatches batches={batches} loading={loading} />
          </div>
          <div>
            <RecentBaglets baglets={baglets} loading={loading} />
          </div>
        </div>
        <FloatingActionButton actions={fabActions} />
      </div>
    </PullRefreshWrapper>
  );
}
