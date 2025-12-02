import Card from '@/components/ui/Card';

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Reports</h1>
      <Card variant="default">
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">📈 Analytics & Reports</p>
          <p className="text-gray-500 text-sm">
            Generate comprehensive reports on batch performance, yield analytics,
            quality metrics, and historical trends across your mushroom farm.
          </p>
          <p className="text-gray-600 text-xs mt-4">
            Advanced reporting dashboard coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
}
