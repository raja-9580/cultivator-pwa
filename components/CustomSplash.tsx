'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { APP_CONFIG } from '@/lib/app-config';

export default function CustomSplash() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if splash has already been shown in this session
        const hasSeenSplash = sessionStorage.getItem('splash_seen');

        if (!hasSeenSplash) {
            // If not seen, show splash and mark as seen
            setIsVisible(true);
            sessionStorage.setItem('splash_seen', 'true');

            // Simulate loading time
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1a1f2e] text-white"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col items-center p-6 text-center"
                    >
                        <div className="relative w-40 h-40 mb-8 p-4 bg-white/5 rounded-full ring-1 ring-white/10 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
                            <Image
                                src={APP_CONFIG.logoPath}
                                alt={`${APP_CONFIG.company} Logo`}
                                fill
                                className="object-contain p-2"
                                priority
                            />
                        </div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                                {APP_CONFIG.company}
                            </h1>
                            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-cyan-500/50 to-emerald-500/50 rounded-full mb-8"></div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                            className="absolute bottom-12 text-center"
                        >
                            <div className="flex flex-col items-center gap-1 opacity-80">
                                <span className="text-sm font-bold text-white tracking-wider">{APP_CONFIG.company}</span>
                                <span className="text-[10px] text-accent-neon-green/70 uppercase tracking-widest">{APP_CONFIG.name}</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
