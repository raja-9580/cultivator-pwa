import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import BottomNav from '@/components/layout/BottomNav';
import InstallPWA from '@/components/InstallPWA';
import { Toaster } from 'sonner';

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
        <Sidebar />
        <Topbar />
        <main className="md:ml-64 mt-13 md:mt-14 mb-16 md:mb-0 p-3 md:p-6 flex-1">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <BottomNav />
        <InstallPWA />
        <Toaster position="top-center" theme="dark" />
      </body>
    </html>
  );
}
