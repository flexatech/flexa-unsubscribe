import { z } from 'zod';

import { api } from './base';
import { parseListResponse, type ListResponse } from './list-response';

export const ResubscribedSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  reason: z.string(),
  unsubscribed_at: z.string(),
  resubscribed_at: z.string(),
});

export type Resubscribed = z.infer<typeof ResubscribedSchema>;

export type ResubscribedOrderBy = 'resubscribed_at' | 'email' | 'unsubscribed_at';

export interface ListParams {
  page: number;
  per_page: number;
  order_by?: ResubscribedOrderBy;
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

export async function fetchResubscribed(
  params: ListParams,
): Promise<ListResponse<Resubscribed>> {
  return parseListResponse(
    api.get('resubscribed', { searchParams: toSearchParams(params) }),
    ResubscribedSchema,
  );
}
