import Card from '@/components/ui/Card';

export default function HarvestPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Harvest</h1>
      <Card variant="default">
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">🍄 Harvest Management</p>
          <p className="text-gray-500 text-sm">
            Track harvest operations, weights, yields, and post-harvest quality
            metrics for completed batches and baglets.
          </p>
          <p className="text-gray-600 text-xs mt-4">
            Harvest logging interface coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
}
