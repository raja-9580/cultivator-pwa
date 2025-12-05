'use client';

import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

export default function ProfilePage() {
    return (
        <div className="max-w-md mx-auto pt-8 pb-20 px-4 space-y-8">
            {/* Branding Header */}
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-accent-leaf/20 blur-xl rounded-full"></div>
                    <Logo className="w-24 h-24 relative z-10 drop-shadow-2xl" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Akaththi Farm</h1>
                    <p className="text-sm font-medium text-accent-leaf uppercase tracking-widest opacity-90">
                        Cultivation Management System
                    </p>
                </div>
            </div>

            {/* Profile Card */}
            <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-leaf to-accent-moss p-[2px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-2xl">
                            👤
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">User</h2>
                        <p className="text-sm text-gray-400">user@example.com</p>
                    </div>
                </div>
                <Button variant="secondary" className="w-full border-white/10 hover:bg-white/10">
                    Edit Profile
                </Button>
            </Card>

            {/* Settings Card */}
            <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Settings</h3>
                <div className="space-y-2">
                    <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-200 group">
                        <span className="group-hover:scale-110 transition-transform">⚙️</span>
                        <span className="font-medium">App Settings</span>
                    </Link>
                    <button className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all text-red-400 group">
                        <span className="group-hover:scale-110 transition-transform">🚪</span>
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </Card>

            {/* Artistic Signature Footer */}
            <div className="text-center pt-8 pb-4">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] mb-2">Engineered by</p>
                <div className="relative inline-block">
                    <span className="absolute -inset-1 bg-accent-leaf/20 blur-lg rounded-full opacity-50"></span>
                    <p className="relative text-2xl md:text-3xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-accent-leaf via-white to-accent-leaf font-bold tracking-wide" style={{ fontFamily: 'cursive' }}>
                        Raja Selvaraj
                    </p>
                </div>
                <p className="text-[10px] text-gray-700 mt-4 font-mono">v1.0.0</p>
            </div>
        </div>
    );
}
