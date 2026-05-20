import { z } from 'zod';

import { api } from './base';
import { parseListResponse, type ListResponse } from './list-response';

export const UnsubscribeSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  reason: z.string(),
  unsubscribed_at: z.string(),
  resubscribed_at: z.string().nullable(),
});

export type Unsubscribe = z.infer<typeof UnsubscribeSchema>;

export type UnsubscribeOrderBy = 'unsubscribed_at' | 'email' | 'reason';

export interface ListParams {
  page: number;
  per_page: number;
  order_by?: UnsubscribeOrderBy;
  order?: 'asc' | 'desc';
}

function toSearchParams(params: ListParams): Record<string, string> {
  const sp: Record<string, string> = {
    page: String(params.page),
    per_page: String(params.per_page),
  };
  if (params.order_by) sp.order_by = params.order_by;
  if (params.order) sp.order = params.order;
  return sp;
}

export async function fetchUnsubscribes(
  params: ListParams,
): Promise<ListResponse<Unsubscribe>> {
  return parseListResponse(
    api.get('unsubscribes', { searchParams: toSearchParams(params) }),
    UnsubscribeSchema,
  );
}

export async function deleteUnsubscribe(id: number): Promise<void> {
  await api.delete(`unsubscribes/${id}`);
}

/**
 * Shape of a single row-level failure returned by /unsubscribes/import.
 * `email` is empty when the row had no email at all; otherwise it's the
 * raw cell value (already trimmed server-side) so the UI can echo it.
 */
export const ImportFailureSchema = z.object({
  row: z.number().int(),
  email: z.string(),
  error: z.string(),
});

export const ImportResultSchema = z.object({
  imported: z.number().int().nonnegative(),
  skipped_duplicate: z.number().int().nonnegative(),
  failed_count: z.number().int().nonnegative(),
  failed: z.array(ImportFailureSchema),
  total: z.number().int().nonnegative(),
});

export type ImportFailure = z.infer<typeof ImportFailureSchema>;
export type ImportResult = z.infer<typeof ImportResultSchema>;

/**
 * Uploads a CSV file to /unsubscribes/import as multipart/form-data.
 *
 * ky auto-sets the multipart boundary when we pass a FormData body, so
 * we do NOT set Content-Type explicitly - doing so would strip the
 * boundary parameter and the request would fail to parse server-side.
 */
export async function importUnsubscribes(file: File): Promise<ImportResult> {
  const body = new FormData();
  body.append('file', file);
  const json = await api.post('unsubscribes/import', { body }).json();
  return ImportResultSchema.parse(json);
}
