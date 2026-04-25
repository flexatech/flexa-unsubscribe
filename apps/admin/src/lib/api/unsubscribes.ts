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
