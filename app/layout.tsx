import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import AuthProvider from '@/components/AuthProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1a1f2e' },
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
  ],
};

import { APP_CONFIG } from '@/lib/app-config';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
  description: APP_CONFIG.description,
  applicationName: APP_CONFIG.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_CONFIG.name,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/akaththi-icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/akaththi-icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/icons/akaththi-icon-192x192.png'],
    apple: [
      { url: '/icons/akaththi-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/akaththi-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark-bg text-gray-100 flex flex-col min-h-screen">
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
