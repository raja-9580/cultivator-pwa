'use client';

import { useState } from 'react';
import QRCode from 'qrcode.react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Batch } from '@/lib/types';

interface BatchQrPanelProps {
  batch: Batch;
  bagletCount: number;
}

export default function BatchQrPanel({
  batch,
  bagletCount,
}: BatchQrPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    // TODO: Implement actual QR code PDF/PNG download
    setTimeout(() => {
      alert('Download functionality coming soon');
      setIsDownloading(false);
    }, 500);
  };

  // Generate dummy baglet IDs for QR codes
  const bagletIds = Array.from({ length: Math.min(bagletCount, 12) }, (_, i) =>
    `BGL-${batch.id}-${String(i + 1).padStart(3, '0')}`
  );

  return (
    <Card variant="default">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-100 mb-2">
          QR Codes for Batch {batch.id}
        </h3>
        <p className="text-sm text-gray-400">
          {bagletIds.length} baglet QR codes
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {bagletIds.map((bagletId) => (
          <div
            key={bagletId}
            className="bg-dark-surface-light rounded-lg p-4 flex flex-col items-center"
          >
            <QRCode value={bagletId} size={100} level="H" includeMargin />
            <p className="text-xs text-gray-400 mt-2 text-center truncate w-full">
              {bagletId}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? 'Downloading...' : '⬇️ Download All as PDF'}
        </Button>
        <Button variant="secondary">
          ⬇️ Download as PNG
        </Button>
      </div>
    </Card>
  );
}
