import Card from '@/components/ui/Card';

export default function StatusLoggerPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Status Logger</h1>
      <Card variant="default">
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">📝 Bulk Status Updates</p>
          <p className="text-gray-500 text-sm">
            Update baglet statuses in bulk. Scan baglet QR codes or manually
            update multiple baglets at once with new status entries.
          </p>
          <p className="text-gray-600 text-xs mt-4">
            Batch status update interface coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
}
