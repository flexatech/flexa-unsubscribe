import { z } from 'zod';

import { api } from './base';

export const ReasonSchema = z.object({
  id: z.number().int(),
  reason_text: z.string(),
  sort_order: z.number().int(),
  created_at: z.string(),
});

export type Reason = z.infer<typeof ReasonSchema>;

const ListResponseSchema = z.object({
  items: z.array(ReasonSchema),
});

export interface ReasonInput {
  reason_text: string;
  sort_order?: number;
}

export async function fetchReasons(): Promise<Reason[]> {
  const json = await api.get('reasons').json();
  return ListResponseSchema.parse(json).items;
}

export async function createReason(body: ReasonInput): Promise<Reason> {
  const json = await api.post('reasons', { json: body }).json();
  return ReasonSchema.parse(json);
}

export async function updateReason(id: number, body: ReasonInput): Promise<Reason> {
  const json = await api
    .put(`reasons/${id}`, { json: { ...body, id } })
    .json();
  return ReasonSchema.parse(json);
}

export async function deleteReason(id: number): Promise<void> {
  await api.delete(`reasons/${id}`);
}

/**
 * Accepts the desired final order of reason IDs. Server rewrites
 * `sort_order` as 1..n in that order. Returns the fresh list.
 */
export async function reorderReasons(order: number[]): Promise<Reason[]> {
  const json = await api.post('reasons/reorder', { json: { order } }).json();
  return ListResponseSchema.parse(json).items;
}
