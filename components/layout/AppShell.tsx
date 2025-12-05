'use client';

import { useSession } from 'next-auth/react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import BottomNav from '@/components/layout/BottomNav';
import InstallPWA from '@/components/InstallPWA';
import { Toaster } from 'sonner';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { status } = useSession();

    if (status === 'authenticated') {
        return (
            <>
                <Sidebar />
                <Topbar />
                <main className="md:ml-64 mt-13 md:mt-0 mb-16 md:mb-0 p-3 md:p-6 flex-1">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
                <BottomNav />
                <InstallPWA />
                <Toaster position="top-center" theme="dark" />
            </>
        );
    }

    // Unauthenticated or Loading
    // Render children full width without navigation
    // The children (likely Profile/Login page) will handle their own layout centered
    return (
        <main className="flex-1 flex flex-col w-full h-full">
            {children}
            <InstallPWA />
            <Toaster position="top-center" theme="dark" />
        </main>
    );
}
