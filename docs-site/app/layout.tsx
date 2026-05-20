import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flexa Unsubscribe — Technical Documentation',
  description:
    'Full technical documentation for the Flexa Unsubscribe WordPress plugin: ' +
    'installation, settings, appearance tokens, REST API reference, HMAC ' +
    'unsubscribe links, hooks, i18n and CSV export.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
