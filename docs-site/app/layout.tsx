import type { Metadata } from 'next';
import './globals.css';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import {
  FontSizeControl,
  PRELOAD_SCRIPT as FONT_PRELOAD,
} from '@/components/FontSizeControl';
import {
  ThemeControl,
  PRELOAD_SCRIPT as THEME_PRELOAD,
} from '@/components/ThemeControl';

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
        {/* Apply the saved reader preferences (theme + font scale)
            synchronously before paint so the first frame matches
            the user's choice. Dark-mode users would otherwise see a
            flash of light chrome on every navigation; large-text
            users would see 100% text reflow up. See
            components/ThemeControl.tsx and FontSizeControl.tsx. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_PRELOAD }} />
        <script dangerouslySetInnerHTML={{ __html: FONT_PRELOAD }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <ThemeControl />
        <FontSizeControl />
        <WhatsAppFab />
      </body>
    </html>
  );
}
