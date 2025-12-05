'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function CustomSplash() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Only run on client side
        // We can use session storage if we want to show it only once per session
        // But for "app loading" feel, showing it on initial mount isn't bad.

        // Simulate loading time
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);

        return () => clearTimeout(timer);
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
                                src="/images/akaththi.png"
                                alt="Akaththi Farm Logo"
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
                                Akaththi Farm
                            </h1>
                            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-cyan-500/50 to-emerald-500/50 rounded-full mb-8"></div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                            className="absolute bottom-12 text-center"
                        >
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Engineered by</p>
                            <div className="relative inline-block">
                                <span className="absolute -inset-1 bg-red-500/20 blur-lg rounded-full opacity-50"></span>
                                <p className="relative text-2xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#CE2029] via-white to-[#CE2029] font-bold tracking-wide" style={{ fontFamily: 'cursive' }}>
                                    Raja Selvaraj
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
