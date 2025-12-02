'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Batch, BatchStatus } from '@/lib/types';
import Link from 'next/link';

const statusVariantMap: Record<BatchStatus, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> = {
  [BatchStatus.Planned]: 'info',
  [BatchStatus.Sterilized]: 'warning',
  [BatchStatus.Inoculated]: 'warning',
  [BatchStatus.Colonising]: 'warning',
  [BatchStatus.InProgress]: 'info',
  [BatchStatus.ReadyToHarvest]: 'success',
  [BatchStatus.Archived]: 'neutral',
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

export default function RecentBatches({ batches }: { batches: Batch[] }) {
  const recent = batches.slice(0, 5);

  return (
    <Card className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h3 className="text-base md:text-lg font-semibold text-gray-100">Recent Batches</h3>
        <Link href="/batches" className="text-accent-leaf text-xs md:text-sm hover:text-accent-sky transition-colors">
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-gray-800/20 bg-dark-surface-light/60 backdrop-blur-sm">
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs">
                Batch ID
              </th>
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs">
                Type
              </th>
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs hidden md:table-cell">
                Baglets
              </th>
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs">
                Status
              </th>
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs hidden md:table-cell">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.map((batch) => (
              <tr
                key={batch.id}
                className="border-b border-gray-800/10 hover:bg-dark-surface-light/15 transition-colors"
              >
                <td className="py-3 md:py-3.5 px-2 md:px-3">
                  <Link href={`/batches/${batch.id}`} className="text-accent-leaf hover:text-accent-sky transition-colors text-xs md:text-sm font-medium">
                    {batch.id}
                  </Link>
                </td>
                <td className="py-3 md:py-3.5 px-2 md:px-3 text-gray-400 text-xs md:text-sm font-medium">{batch.mushroomType}</td>
                <td className="py-3 md:py-3.5 px-2 md:px-3 text-gray-400 text-xs md:text-sm font-medium hidden md:table-cell">
                  {batch.actualBagletCount} / {batch.plannedBagletCount}
                </td>
                <td className="py-3 md:py-3.5 px-2 md:px-3">
                  <Badge variant={statusVariantMap[batch.status]}>
                    {batch.status}
                  </Badge>
                </td>
                <td className="py-3 md:py-3.5 px-2 md:px-3 text-gray-500 text-xs md:text-sm hidden md:table-cell">
                  {formatDate(batch.createdDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
