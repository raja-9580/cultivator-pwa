'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setSupportsPWA(true);
            setPromptInstall(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!promptInstall) return;

        promptInstall.prompt();
        const { outcome } = await promptInstall.userChoice;

        if (outcome === 'accepted') {
            setPromptInstall(null);
            setSupportsPWA(false);
            setIsInstalled(true);
        }
    };

    const handleDismiss = () => {
        setSupportsPWA(false);
        setPromptInstall(null);
        // Store dismiss preference for 7 days
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    };

    // Don't show if already installed or not supported
    if (isInstalled || !supportsPWA || !promptInstall) {
        return null;
    }

    // Check if user dismissed recently (within 7 days)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) {
            return null;
        }
    }

    return (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-slide-up">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-teal-500/30 rounded-xl shadow-2xl shadow-teal-500/10 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 via-amber-500 to-teal-400 rounded-lg flex items-center justify-center shadow-lg">
                        <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm mb-1">
                            Install Cultivator App
                        </h3>
                        <p className="text-gray-300 text-xs leading-relaxed">
                            Add to home screen for faster access and offline support
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-3 py-2 text-gray-400 hover:text-white text-xs font-medium transition-colors duration-200"
                            >
                                Not now
                            </button>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                        aria-label="Dismiss"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
