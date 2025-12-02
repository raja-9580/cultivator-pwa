'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Baglet, BagletStatus } from '@/lib/types';
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

export default function RecentBaglets({ baglets }: { baglets: Baglet[] }) {
  const recent = baglets.slice(0, 5);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h3 className="text-base md:text-lg font-semibold text-gray-100">Recent Baglets</h3>
        <Link href="/baglets" className="text-accent-leaf text-xs md:text-sm hover:text-accent-sky transition-colors">
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-gray-800/20 bg-dark-surface-light/60 backdrop-blur-sm">
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs">
                Baglet ID
              </th>
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs">
                Batch
              </th>
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs">
                Status
              </th>
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs hidden md:table-cell">
                Updated
              </th>
              <th className="text-left py-2.5 md:py-3 px-2 md:px-3 font-semibold text-gray-200 text-xs hidden lg:table-cell">
                Metrics
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.map((baglet) => (
              <tr
                key={baglet.id}
                className="border-b border-gray-800/10 hover:bg-dark-surface-light/15 transition-colors"
              >
                <td className="py-3 md:py-3.5 px-2 md:px-3 text-accent-leaf font-medium text-xs md:text-sm">{baglet.id}</td>
                <td className="py-3 md:py-3.5 px-2 md:px-3">
                  <Link href={`/batches`} className="text-gray-400 hover:text-gray-300 text-xs md:text-sm">
                    {baglet.batchId}
                  </Link>
                </td>
                <td className="py-3 md:py-3.5 px-2 md:px-3">
                  <Badge variant={statusVariantMap[baglet.status]}>
                    {baglet.status}
                  </Badge>
                </td>
                <td className="py-3 md:py-3.5 px-2 md:px-3 text-gray-500 text-xs hidden md:table-cell">
                  {formatDate(baglet.lastStatusChange)}
                </td>
                <td className="py-3 md:py-3.5 px-2 md:px-3 text-gray-500 text-xs leading-relaxed hidden lg:table-cell">
                  {baglet.metrics
                    ? (
                      <div>
                        <div>{baglet.metrics.temperature}°C</div>
                        <div>{baglet.metrics.co2Level} ppm</div>
                      </div>
                    )
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
