'use client';

import Card from '@/components/ui/Card';

interface BagletStatusDistributionProps {
    statusCounts: Record<string, number>;
    totalBaglets: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
    PLANNED: { label: 'Planned', color: 'text-gray-400', emoji: '📋' },
    PREPARED: { label: 'Prepared', color: 'text-blue-400', emoji: '🧪' },
    STERILIZED: { label: 'Sterilized', color: 'text-orange-400', emoji: '🔥' },
    INOCULATED: { label: 'Inoculated', color: 'text-purple-400', emoji: '💉' },
    INCUBATED: { label: 'Incubated', color: 'text-yellow-400', emoji: '🌡️' },
    PINNED: { label: 'Pinned', color: 'text-green-400', emoji: '🌱' },
    HARVESTED: { label: 'Harvested', color: 'text-accent-leaf', emoji: '🍄' },
    CONTAMINATED: { label: 'Contaminated', color: 'text-red-400', emoji: '⚠️' },
    DISPOSED: { label: 'Disposed', color: 'text-gray-600', emoji: '🗑️' },
};

export default function BagletStatusDistribution({
    statusCounts,
    totalBaglets,
}: BagletStatusDistributionProps) {
    // Sort statuses by count (descending)
    const sortedStatuses = Object.entries(statusCounts || {}).sort(
        ([, a], [, b]) => b - a
    );

    return (
        <Card className="border border-gray-800/30">
            <div className="p-4 md:p-5">
                <h2 className="text-lg md:text-xl font-semibold text-accent-leaf mb-4">
                    Baglet Status Distribution
                </h2>

                <div className="mb-4">
                    <div className="text-2xl md:text-3xl font-bold text-gray-200">
                        {totalBaglets}
                        <span className="text-sm md:text-base font-normal text-gray-400 ml-2">
                            Total Baglets
                        </span>
                    </div>
                </div>

                {sortedStatuses.length > 0 ? (
                    <div className="space-y-3">
                        {sortedStatuses.map(([status, count]) => {
                            const config = STATUS_CONFIG[status] || {
                                label: status,
                                color: 'text-gray-400',
                                emoji: '📦',
                            };
                            const percentage = ((count / totalBaglets) * 100).toFixed(1);

                            return (
                                <div key={status} className="relative">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{config.emoji}</span>
                                            <span className={`text-sm font-medium ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500">{percentage}%</span>
                                            <span className={`text-base font-semibold ${config.color}`}>
                                                {count}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-2 bg-dark-surface-light/30 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${config.color.replace('text-', 'bg-')} opacity-60 transition-all duration-300`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No baglets in this batch yet
                    </div>
                )}
            </div>
        </Card>
    );
}
