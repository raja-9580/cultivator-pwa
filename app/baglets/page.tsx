'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { BagletStatus, Baglet } from '@/lib/types';
import Link from 'next/link';

const statusVariantMap: Record<BagletStatus, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> = {
  [BagletStatus.Planned]: 'info',
  [BagletStatus.Sterilized]: 'warning',
  [BagletStatus.Inoculated]: 'warning',
  [BagletStatus.Colonising]: 'warning',
  [BagletStatus.ReadyToHarvest]: 'success',
  [BagletStatus.Harvested]: 'neutral',
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function BagletsPage() {
  const [baglets, setBaglets] = useState<Baglet[]>([]);

  useEffect(() => {
    async function fetchBaglets() {
      try {
        const res = await fetch('/api/baglets');
        const data = await res.json();
        if (data.baglets) {
          setBaglets(data.baglets);
        }
      } catch (error) {
        console.error('Failed to fetch baglets:', error);
      }
    }
    fetchBaglets();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h1 className="text-xl md:text-2xl font-semibold text-accent-leaf">Baglets</h1>
      </div>

      {/* Baglets Table */}
      <Card className="border border-gray-800/30">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-gray-800/20 bg-dark-surface-light/60 backdrop-blur-sm">
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs">
                  Baglet ID
                </th>
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs">
                  Batch ID
                </th>
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs">
                  Status
                </th>
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs hidden md:table-cell">
                  Updated
                </th>
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs hidden lg:table-cell">
                  Metrics
                </th>
                <th className="text-left py-2.5 md:py-3 px-2 md:px-4 font-semibold text-gray-200 text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {baglets.map((baglet) => (
                <tr
                  key={baglet.id}
                  className="border-b border-gray-800/10 hover:bg-dark-surface-light/15 transition-colors"
                >
                  <td className="py-3 md:py-3.5 px-2 md:px-4 text-accent-leaf font-medium text-xs md:text-sm">{baglet.id}</td>
                  <td className="py-3 md:py-3.5 px-2 md:px-4">
                    <Link href="/batches" className="text-gray-400 hover:text-accent-sky transition-colors text-xs md:text-sm">
                      {baglet.batchId}
                    </Link>
                  </td>
                  <td className="py-3 md:py-3.5 px-2 md:px-4">
                    <Badge variant={statusVariantMap[baglet.status]}>
                      {baglet.status}
                    </Badge>
                  </td>
                  <td className="py-3 md:py-3.5 px-2 md:px-4 text-gray-500 text-xs hidden md:table-cell">
                    {formatDate(baglet.lastStatusChange)}
                  </td>
                  <td className="py-3 md:py-3.5 px-2 md:px-4 text-gray-500 text-xs leading-relaxed hidden lg:table-cell">
                    {baglet.metrics
                      ? (
                        <div>
                          <div>{baglet.metrics.temperature}°C</div>
                          <div>{baglet.metrics.co2Level} ppm</div>
                        </div>
                      )
                      : '—'}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    <Button variant="ghost" size="sm" disabled className="text-xs md:text-sm px-1.5 md:px-2 py-0.5 md:py-1">
                      + Metric
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <FloatingActionButton actions={[
        { label: 'Add Metric', icon: '📊', href: '/metrics' },
        { label: 'QR Scan', icon: '📱', href: '/batches' },
      ]} />
    </div>
  );
}
