import Card from '@/components/ui/Card';

export default function MetricsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Metrics</h1>
      <Card variant="default">
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">📊 Metrics Monitoring</p>
          <p className="text-gray-500 text-sm">
            This page will display temperature, humidity, CO₂ levels, and light
            measurements from all baglets.
          </p>
          <p className="text-gray-600 text-xs mt-4">
            Real-time sensor data integration coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
}
