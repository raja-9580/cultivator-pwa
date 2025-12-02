import Card from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function DashboardStats({ stats, loading }: { stats: StatCardProps[], loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-l-4 border-l-gray-800 p-3 md:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="w-full">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full opacity-50" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
      {stats.map((stat, idx) => (
        <Card key={idx} className="border-l-4 border-l-accent-leaf/60 p-3 md:p-4 hover-glow">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-tight md:tracking-wide truncate">{stat.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-accent-leaf mt-2">
                {stat.value}
              </p>
            </div>
            {stat.icon && (
              <div className="text-2xl md:text-3xl opacity-50 flex-shrink-0">{stat.icon}</div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
