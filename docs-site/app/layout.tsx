import type { Metadata } from 'next';
import './globals.css';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { FontSizeControl, PRELOAD_SCRIPT } from '@/components/FontSizeControl';

export const metadata: Metadata = {
  title: 'Flexa Unsubscribe - User Guide',
  description:
    'Step-by-step user guide for the Flexa Unsubscribe WordPress plugin: ' +
    'enabling protection, customizing the email footer, styling the public ' +
    'page, managing unsubscribes, and exporting data - plus a technical reference.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Apply the saved font scale synchronously before paint so
            large-text users don't see a flash of 100% text on every
            page load. See components/FontSizeControl.tsx. */}
        <script dangerouslySetInnerHTML={{ __html: PRELOAD_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <FontSizeControl />
        <WhatsAppFab />
      </body>
    </html>
  );
}
