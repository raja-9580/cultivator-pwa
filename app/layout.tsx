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

export const metadata: Metadata = {
  title: 'Cultivator - Mushroom Farm Management',
  description: 'Professional mushroom cultivation tracking and management system for exotic varieties',
  applicationName: 'Cultivator',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cultivator',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
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
