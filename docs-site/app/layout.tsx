import type { Metadata } from 'next';
import './globals.css';
import { WhatsAppFab } from '@/components/WhatsAppFab';

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
      <body className="min-h-screen antialiased">
        {children}
        <WhatsAppFab />
      </body>
    </html>
  );
}
