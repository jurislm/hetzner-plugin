import { z } from "zod";
import { HetznerApiError, HetznerClient } from "./client.js";
import { loadConfig } from "./config.js";
import { redactErrorText } from "./errors.js";
import type { HetznerMeta } from "./types.js";

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Request = <T>(endpoint: string, schema: z.ZodType<T>, method?: Method, data?: unknown, params?: Record<string, unknown>) => Promise<T>;

function request(source: "cloud" | "unified"): Request {
  return async (endpoint, schema, method = "GET", data, params) => {
    const client = new HetznerClient(loadConfig());
    const parameters = Object.keys(params ?? {}).map((name) => ({ location: "query", name }));
    const response = await client.request({ source, method, path: endpoint, parameters }, { ...params, ...(data === undefined ? {} : { body: data }) });
    return schema.parse(response.data);
  };
}

export const makeApiRequest = request("cloud");
export const makeStorageBoxApiRequest = request("unified");

export function handleApiError(error: unknown): string {
  if (error instanceof z.ZodError) return `Error: Hetzner API returned an unexpected response shape: ${error.issues[0]?.message ?? "validation failed"}`;
  if (error instanceof HetznerApiError) {
    if (error.status === 0) return `Error: ${redactErrorText(error.message)}`;
    return `Error: Hetzner API request failed (${error.status})`;
  }
  return `Error: ${redactErrorText(error instanceof Error ? error.message : "An unexpected error occurred.")}`;
}

export const PAGINATION_HARD_CAP_PAGES = 5;
export type PartialFailureKind = "network" | "http" | "other";
export interface PartialFailure { message: string; kind: PartialFailureKind; pagesSucceeded: number; }
export interface PaginatedListResult<T> { items: T[]; truncated: boolean; partialFailure?: PartialFailure; }

export function createPaginatedFetch(requestFn: Request) {
  return async function paginatedFetch<TResponse extends { meta?: HetznerMeta }, TItem>(
    endpoint: string,
    schema: z.ZodType<TResponse>,
    extractItems: (response: TResponse) => TItem[],
    perPage = 50,
    extraParams: Record<string, unknown> = {},
  ): Promise<PaginatedListResult<TItem>> {
    const items: TItem[] = [];
    let page: number | null = 1;
    let pagesSucceeded = 0;
    while (page !== null && pagesSucceeded < PAGINATION_HARD_CAP_PAGES) {
      try {
        const response: TResponse = await requestFn(endpoint, schema, "GET", undefined, { page, per_page: perPage, ...extraParams });
        items.push(...extractItems(response));
        pagesSucceeded++;
        page = response.meta?.pagination?.next_page ?? null;
      } catch (error) {
        const kind: PartialFailureKind = error instanceof HetznerApiError ? (error.status ? "http" : "network") : "other";
        return { items, truncated: false, partialFailure: { message: handleApiError(error), kind, pagesSucceeded } };
      }
    }
    return { items, truncated: page !== null };
  };
}
