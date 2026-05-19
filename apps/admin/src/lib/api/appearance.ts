import { z } from 'zod';

import { api } from './base';

// Must stay in sync with SettingsRestController::FONT_FAMILIES on
// the PHP side. See PHASE-3-PLAN.md for the sync-both-sides rule.
export const FONT_FAMILIES = [
  'sans-serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  "'Times New Roman', serif",
  "'Courier New', monospace",
] as const;

/** 6-char lowercase hex. The ColorInput normalizes 3-char to 6-char on blur. */
const HexColor = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, 'Must be a 6-char hex colour like #ff00aa')
  .transform((v) => v.toLowerCase());

/** Loose CSS length - `14px`, `1em`, `0.875rem`, `100%` all valid. */
const FontSize = z
  .string()
  .regex(/^\d+(\.\d+)?(px|em|rem|%)$/, 'Use a CSS length like 14px, 1em, or 100%');

/**
 * Full appearance settings shape. Mirrors the
 * `APPEARANCE_DEFAULTS` map in `SettingsRestController`. Adding
 * a field here also requires adding it to that PHP map and
 * (optionally) to the preview panel.
 */
export const AppearanceSettingsSchema = z.object({
  // Colors
  bg_color: HexColor,
  box_bg_color: HexColor,
  text_color: HexColor,
  heading_color: HexColor,
  button_bg_color: HexColor,
  button_text_color: HexColor,
  button_hover_color: HexColor,
  // Typography
  font_family: z.enum(FONT_FAMILIES),
  font_size: FontSize,
  // Text content (single-line)
  title_text: z.string().min(1).max(255),
  button_text: z.string().min(1).max(255),
  thank_you_title: z.string().min(1).max(255),
  home_link_text: z.string().min(1).max(255),
  error_title: z.string().min(1).max(255),
  resubscribe_title: z.string().min(1).max(255),
  // Text content (multi-line - some allow HTML server-side via wp_kses_post)
  success_message: z.string().min(1).max(1000),
  thank_you_message: z.string().min(1).max(1000),
  error_message: z.string().min(1).max(1000),
  resubscribe_message: z.string().min(1).max(1000),
});

export type AppearanceSettings = z.infer<typeof AppearanceSettingsSchema>;

export async function fetchAppearanceSettings(): Promise<AppearanceSettings> {
  const json = await api.get('settings/appearance').json();
  return AppearanceSettingsSchema.parse(json);
}

export async function updateAppearanceSettings(
  body: AppearanceSettings,
): Promise<AppearanceSettings> {
  const json = await api.put('settings/appearance', { json: body }).json();
  return AppearanceSettingsSchema.parse(json);
}
