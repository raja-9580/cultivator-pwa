'use client';

import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function ProfilePage() {
    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-accent-leaf mb-6">Profile</h1>

            <Card className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-accent-leaf/20 flex items-center justify-center text-2xl">
                        👤
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-100">User</h2>
                        <p className="text-sm text-gray-400">user@example.com</p>
                    </div>
                </div>
                <Button variant="secondary" className="w-full">
                    Edit Profile
                </Button>
            </Card>

            <Card className="mb-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Settings</h3>
                <div className="space-y-2">
                    <Link href="/settings" className="block p-3 rounded-lg bg-dark-surface-light/30 hover:bg-dark-surface-light/50 transition-colors text-gray-300">
                        ⚙️ App Settings
                    </Link>
                    <button className="w-full text-left p-3 rounded-lg bg-dark-surface-light/30 hover:bg-dark-surface-light/50 transition-colors text-red-400">
                        🚪 Sign Out
                    </button>
                </div>
            </Card>

            <div className="text-center py-8">
                <p className="text-xs text-gray-500 mb-1">Cultivator App v1.0.0</p>
                <p className="text-xs text-gray-500">
                    Engineered by{' '}
                    <span className="text-accent-leaf font-semibold">Raja Selvaraj</span>
                </p>
            </div>
        </div>
    );
}
