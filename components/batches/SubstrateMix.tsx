'use client';

import Card from '@/components/ui/Card';

interface Medium {
    medium_id: string;
    medium_name: string;
    qty_g: number;
}

interface Supplement {
    supplement_id: string;
    supplement_name: string;
    qty: number;
    unit: string;
}

interface SubstrateMixProps {
    substrateName: string;
    mediums: Medium[];
    supplements: Supplement[];
    mediumsForBatch: Medium[];
    supplementsForBatch: Supplement[];
    bagletCount: number;
}

export default function SubstrateMix({
    substrateName,
    mediums,
    supplements,
    mediumsForBatch,
    supplementsForBatch,
    bagletCount,
}: SubstrateMixProps) {
    return (
        <Card className="border border-gray-800/30">
            <div className="p-4 md:p-5">
                <div className="mb-6">
                    <h2 className="text-lg md:text-xl font-semibold text-accent-leaf mb-1.5">
                        Substrate Recipe
                    </h2>
                    <p className="text-sm text-gray-400">
                        {substrateName}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Per Baglet */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 h-12">
                            <span className="text-xl">🌾</span>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide leading-tight">
                                    Per Baglet
                                </h3>
                            </div>
                        </div>

                        {/* Mediums */}
                        {mediums.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                                    MEDIUMS
                                </h4>
                                <div className="space-y-2">
                                    {mediums.map((medium) => (
                                        <div
                                            key={medium.medium_id}
                                            className="flex justify-between items-center bg-dark-surface-light/20 rounded-lg px-4 py-2.5 border border-gray-800/20"
                                        >
                                            <span className="text-sm text-gray-300">{medium.medium_name}</span>
                                            <span className="text-sm font-semibold text-accent-leaf tabular-nums">
                                                {medium.qty_g.toFixed(1)} g
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Supplements */}
                        {supplements.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                                    SUPPLEMENTS
                                </h4>
                                <div className="space-y-2">
                                    {supplements.map((supplement) => (
                                        <div
                                            key={supplement.supplement_id}
                                            className="flex justify-between items-center bg-dark-surface-light/20 rounded-lg px-4 py-2.5 border border-gray-800/20"
                                        >
                                            <span className="text-sm text-gray-300">{supplement.supplement_name}</span>
                                            <span className="text-sm font-semibold text-accent-leaf tabular-nums">
                                                {supplement.qty.toFixed(1)} {supplement.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Total for Batch */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 h-12">
                            <span className="text-xl">🎯</span>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide leading-tight">
                                    Total for Batch
                                </h3>
                                <p className="text-xs text-gray-400 font-normal">
                                    {bagletCount} baglets
                                </p>
                            </div>
                        </div>

                        {/* Mediums */}
                        {mediumsForBatch.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                                    MEDIUMS
                                </h4>
                                <div className="space-y-2">
                                    {mediumsForBatch.map((medium) => (
                                        <div
                                            key={medium.medium_id}
                                            className="flex justify-between items-center bg-dark-surface-light/30 rounded-lg px-4 py-2.5 border border-accent-leaf/20"
                                        >
                                            <span className="text-sm text-gray-300 font-medium">{medium.medium_name}</span>
                                            <span className="text-sm font-bold text-accent-leaf tabular-nums">
                                                {medium.qty_g.toFixed(1)} g
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Supplements */}
                        {supplementsForBatch.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                                    SUPPLEMENTS
                                </h4>
                                <div className="space-y-2">
                                    {supplementsForBatch.map((supplement) => (
                                        <div
                                            key={supplement.supplement_id}
                                            className="flex justify-between items-center bg-dark-surface-light/30 rounded-lg px-4 py-2.5 border border-accent-leaf/20"
                                        >
                                            <span className="text-sm text-gray-300 font-medium">{supplement.supplement_name}</span>
                                            <span className="text-sm font-bold text-accent-leaf tabular-nums">
                                                {supplement.qty.toFixed(1)} {supplement.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
