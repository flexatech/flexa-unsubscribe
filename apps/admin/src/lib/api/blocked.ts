import { z } from 'zod';

import { api } from './base';
import { parseListResponse, type ListResponse } from './list-response';

export const BlockedSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  subject: z.string(),
  from_email: z.string(),
  from_name: z.string(),
  blocked_at: z.string(),
});

export type Blocked = z.infer<typeof BlockedSchema>;

export type BlockedOrderBy = 'blocked_at' | 'email' | 'subject' | 'from_email';

export interface ListParams {
  page: number;
  per_page: number;
  order_by?: BlockedOrderBy;
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

export async function fetchBlocked(params: ListParams): Promise<ListResponse<Blocked>> {
  return parseListResponse(
    api.get('blocked', { searchParams: toSearchParams(params) }),
    BlockedSchema,
  );
}

export async function deleteBlocked(id: number): Promise<void> {
  await api.delete(`blocked/${id}`);
}

export async function clearAllBlocked(): Promise<void> {
  await api.post('blocked/clear');
}
