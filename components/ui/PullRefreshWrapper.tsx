'use client';

import PullToRefresh from 'react-simple-pull-to-refresh';

interface PullRefreshWrapperProps {
    onRefresh: () => Promise<any>;
    children: React.ReactNode;
}

export default function PullRefreshWrapper({ onRefresh, children }: PullRefreshWrapperProps) {
    return (
        <PullToRefresh
            onRefresh={onRefresh}
            pullingContent={
                <div className="text-center p-4 text-gray-400 text-sm flex justify-center">
                    <span className="animate-bounce">⬇️</span>
                </div>
            }
            refreshingContent={
                <div className="text-center p-4 text-accent-leaf text-sm">
                    Refreshing...
                </div>
            }
            backgroundColor="transparent"
        >
            <div className="min-h-[calc(100vh-100px)]">
                {children}
            </div>
        </PullToRefresh>
    );
}
