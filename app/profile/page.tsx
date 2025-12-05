'use client';

import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from 'react';

import Logo from '@/components/ui/Logo';
import { APP_CONFIG } from '@/lib/app-config';

function ProfileContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="max-w-md mx-auto pt-8 pb-20 px-4 space-y-8">
            {/* Branding Header - Removed as per request to avoid duplication */}
            {/* <div className="flex flex-col items-center text-center space-y-4">
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
            </div> */}

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    <p className="font-bold">Login Failed</p>
                    <p>Error code: {error}</p>
                    <p className="text-xs mt-1 opacity-70">Check your server logs for more details.</p>
                </div>
            )}

            {/* Profile Card */}
            <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
                {session ? (
                    <>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-leaf to-accent-moss p-[2px]">
                                {session.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || "User"}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-2xl">
                                        👤
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{session.user?.name || "User"}</h2>
                                <p className="text-sm text-gray-400">{session.user?.email || "No email"}</p>
                            </div>
                        </div>
                        <Button variant="secondary" className="w-full border-white/10 hover:bg-white/10">
                            Edit Profile
                        </Button>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-gray-400 mb-6">Sign in to access your farm management tools.</p>
                        <Button
                            onClick={() => signIn('google', { callbackUrl: searchParams.get('callbackUrl') || '/' })}
                            className="w-full bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </Button>
                    </div>
                )}
            </Card>

            {/* Settings Card - Only show when logged in */}
            {session && (
                <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Settings</h3>
                    <div className="space-y-2">
                        <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-200 group">
                            <span className="group-hover:scale-110 transition-transform">⚙️</span>
                            <span className="font-medium">App Settings</span>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all text-red-400 group"
                        >
                            <span className="group-hover:scale-110 transition-transform">🚪</span>
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </Card>
            )}

            {/* Company Branding Footer */}
            <div className="text-center pt-8 pb-4 flex flex-col items-center gap-2">
                <div className="relative w-12 h-12 opacity-80 mb-2">
                    <Logo className="w-full h-full object-contain" />
                </div>
                <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white tracking-wider">{APP_CONFIG.company}</p>
                    <p className="text-[10px] text-accent-neon-green/70 uppercase tracking-widest">{APP_CONFIG.name}</p>
                </div>
                <p className="text-[10px] text-gray-700 mt-2 font-mono">{APP_CONFIG.version}</p>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
