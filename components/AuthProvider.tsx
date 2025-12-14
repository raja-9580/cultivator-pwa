'use client';

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    // Handle Mock Authentication initialization:
    // If mock auth is active and initializing, this returns a loading screen component.
    // Once initialized (or if disabled), it returns null and we render the app.
    const mockGuard = useMockAuthGuard();
    if (mockGuard) return mockGuard;

    return <SessionProvider>{children}</SessionProvider>;
}

/**
 * Checks if mock auth is enabled and initialized.
 * Returns a Loading Component if waiting for initialization.
 * Returns null if ready to proceed.
 */
function useMockAuthGuard() {
    const isMockEnabled = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
    const [mockReady, setMockReady] = useState(!isMockEnabled);
    const pathname = usePathname();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isMockEnabled) {
            if (document.cookie.includes('mock-auth-ready=true')) {
                setMockReady(true);
                return;
            }

            fetch('/api/mock-login', {
                headers: {
                    // Bypass Ngrok's "Visit Site" warning page for API calls
                    'ngrok-skip-browser-warning': 'true'
                }
            })
                .then((res) => {
                    if (res.ok) {
                        console.log('🍪 Mock Cookie Set - Reloading');
                        if (pathname === '/profile') {
                            window.location.href = '/';
                        } else {
                            window.location.reload();
                        }
                    } else {
                        res.text().then(text => {
                            console.error('Failed to set mock cookie', text);
                            setError(`Mock Login Failed: ${res.status} ${res.statusText} - ${text}`);
                        });
                    }
                })
                .catch(e => {
                    console.error('Mock login error', e);
                    setError(`Network Error: ${e.message}`);
                });
        }
    }, [pathname, isMockEnabled]);

    if (isMockEnabled && !mockReady) {
        return (
            <div className="min-h-screen bg-dark-bg text-white p-10">
                <h1 className="text-xl mb-4">Initializing Mock Environment...</h1>
                {error && <div className="text-red-400 p-4 border border-red-800 rounded bg-red-900/20">{error}</div>}
            </div>
        );
    }

    return null;
}

