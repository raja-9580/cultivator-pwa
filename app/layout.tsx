import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import AuthProvider from '@/components/AuthProvider';
import CustomSplash from '@/components/CustomSplash';

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
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/pwa-icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/pwa-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/icons/pwa-icon.png'],
    apple: [
      { url: '/icons/pwa-icon.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/pwa-icon.png', sizes: '180x180', type: 'image/png' },
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
          <CustomSplash />
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
