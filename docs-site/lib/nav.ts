/**
 * Single source of truth for the sidebar anchor navigation and the
 * `id`s used by each <Section> on the page. Order here = order of
 * sections rendered in app/page.tsx.
 */
export interface NavItem {
  id: string;
  label: string;
}

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
