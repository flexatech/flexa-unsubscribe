/**
 * Single source of truth for the sidebar anchor navigation and the
 * `id`s used by each <Section> on the page. Order here = order of
 * sections rendered in app/page.tsx.
 */
export interface NavItem {
  id: string;
  label: string;
}

/** Anchor nav for the technical documentation page (app/page.tsx). */
export const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'installation', label: 'Installation' },
  { id: 'features', label: 'Features' },
  { id: 'settings-general', label: 'Settings · General' },
  { id: 'settings-appearance', label: 'Settings · Appearance' },
  { id: 'unsubscribe-links', label: 'Unsubscribe links (HMAC)' },
  { id: 'rest-api', label: 'REST API reference' },
  { id: 'hooks', label: 'Hooks & filters' },
  { id: 'i18n', label: 'Internationalization' },
  { id: 'csv-export', label: 'CSV export' },
  { id: 'database', label: 'Database schema' },
  { id: 'changelog', label: 'Changelog' },
];

/** Anchor nav for the user guide page (app/guide/page.tsx). */
export const GUIDE_NAV: NavItem[] = [
  { id: 'start', label: 'Getting started' },
  { id: 'dashboard', label: 'The Dashboard' },
  { id: 'enable', label: 'Turn on protection' },
  { id: 'footer', label: 'Customize the email footer' },
  { id: 'appearance', label: 'Style the public page' },
  { id: 'unsubscribes', label: 'Unsubscribes list' },
  { id: 'blocked', label: 'Blocked Emails' },
  { id: 'resubscribed', label: 'Re-subscribed list' },
  { id: 'reasons', label: 'Manage reasons' },
  { id: 'export', label: 'Export to CSV' },
  { id: 'faq', label: 'Troubleshooting & FAQ' },
];
