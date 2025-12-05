'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, ZapOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QrScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
    continuous?: boolean;
    children?: React.ReactNode;
}

export default function QrScanner({ isOpen, onClose, onScan, continuous = false, children }: QrScannerProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [torchEnabled, setTorchEnabled] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const regionId = 'qr-reader-region';

    useEffect(() => {
        if (isOpen) {
            startScanner();
        } else {
            stopScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isOpen]);

    const startScanner = async () => {
        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(regionId, {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false
                });
            }

            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
                setHasPermission(true);

                await scannerRef.current.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText: string) => {
                        onScan(decodedText);
                        if (!continuous) {
                            stopScanner();
                        }
                    },
                    (_: any) => {
                        // ignore
                    }
                );
            } else {
                setHasPermission(false);
                alert('No cameras found.');
            }
        } catch (err) {
            console.error('Error starting scanner', err);
            setHasPermission(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error('Failed to stop scanner', err);
            }
        }
    };

    const toggleTorch = () => {
        if (scannerRef.current) {
            setTorchEnabled(!torchEnabled);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
                        <button onClick={onClose} className="text-white p-2 rounded-full bg-white/10 backdrop-blur-md">
                            <X size={24} />
                        </button>
                        <h2 className="text-white font-semibold tracking-wide">Scan QR Code</h2>
                        <div className="w-10" /> {/* Spacer */}
                    </div>

                    {/* Scanner Area */}
                    <div className="flex-1 relative flex items-center justify-center bg-black">
                        <div id={regionId} className="w-full h-full object-cover" />

                        {/* Overlay Guide */}
                        <div className="absolute inset-0 border-2 border-accent-leaf/50 w-64 h-64 m-auto rounded-lg pointer-events-none animate-pulse shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]" />

                        <p className="absolute bottom-32 text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                            Align QR code within frame
                        </p>

                        {hasPermission === false && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                                <p className="text-white">Camera access denied or unavailable.</p>
                            </div>
                        )}

                        {/* Custom Overlay Content */}
                        <div className="absolute inset-0 z-30 pointer-events-none">
                            {children}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-8 pb-12 flex justify-center gap-8 bg-gradient-to-t from-black/90 to-transparent z-10">
                        <button
                            onClick={toggleTorch}
                            className={`p-4 rounded-full transition-all ${torchEnabled ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white'}`}
                        >
                            {torchEnabled ? <ZapOff size={24} /> : <Zap size={24} />}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
