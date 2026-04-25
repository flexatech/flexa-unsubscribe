import { z } from 'zod';

import { api } from './base';

/**
 * Shape of the `/settings/general` endpoint. Mirrors the three
 * fields in `SettingsRestController::get_general()`:
 *
 *   enable_auto_append:  bool   (auto-append unsubscribe link)
 *   exclude_keywords:    string (comma-separated subject keywords)
 *   enable_blocking:     bool   (hard-stop outbound to unsub'd addresses)
 *
 * Booleans ride the wire as real JSON `true`/`false`; the server
 * persists them as `'1'`/`''` strings for back-compat with legacy
 * `flexa_tech_su_get_setting(...) !== '1'` comparisons in `core.php`.
 */
export const GeneralSettingsSchema = z.object({
  enable_auto_append: z.boolean(),
  exclude_keywords: z.string().max(500),
  enable_blocking: z.boolean(),
});

export type GeneralSettings = z.infer<typeof GeneralSettingsSchema>;

export async function fetchGeneralSettings(): Promise<GeneralSettings> {
  const json = await api.get('settings/general').json();
  return GeneralSettingsSchema.parse(json);
}

export async function updateGeneralSettings(body: GeneralSettings): Promise<GeneralSettings> {
  const json = await api.put('settings/general', { json: body }).json();
  return GeneralSettingsSchema.parse(json);
}
