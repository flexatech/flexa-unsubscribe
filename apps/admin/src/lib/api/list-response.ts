import { z, type ZodTypeAny } from 'zod';
import type { ResponsePromise } from 'ky';

/**
 * House-standard envelope for every paginated list endpoint under
 * `flexa-unsubscribe/v1`. Mirrors the PHP-side shape returned by the
 * Controllers/TableRequestArgs helpers.
 */
export function ListResponseSchema<T extends ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    per_page: z.number().int().positive(),
  });
}

export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  per_page: number;
};

/**
 * Parse a ky response JSON body against a list-envelope schema. Throws on
 * shape mismatch so backend changes fail loudly at the boundary instead of
 * corrupting the UI silently.
 */
export async function parseListResponse<T extends ZodTypeAny>(
  response: ResponsePromise,
  itemSchema: T,
): Promise<ListResponse<z.infer<T>>> {
  const json = await response.json();
  return ListResponseSchema(itemSchema).parse(json);
}
