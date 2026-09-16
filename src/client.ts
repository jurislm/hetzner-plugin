import type { HetznerConfig } from "./config.js";
import { redactErrorText } from "./errors.js";

export interface ToolEnvelope<T> {
  data: T;
  status: number;
  request: { method: string; path: string };
}

export interface BinaryEnvelope {
  encoding: "base64";
  contentType: string;
  value: string;
}

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
export type OperationRequest = {
  source: "cloud" | "unified";
  method: string;
  path: string;
  parameters: Array<{ location: string; name: string }>;
};

const baseUrl = { cloud: "https://api.hetzner.cloud/v1", unified: "https://api.hetzner.com/v1" } as const;
const sensitiveKey = /(^value$|real_?value|private_?key|token|secret|password|authorization|cookie)/iu;

export class HetznerApiError extends Error {
  constructor(readonly status: number, readonly method: string, readonly path: string, message: string) {
    super(message);
    this.name = "HetznerApiError";
  }
}

export function redactSensitive<T>(value: T): T {
  if (Array.isArray(value)) return value.map(redactSensitive) as T;
  if (!value || typeof value !== "object") return value;
  if ((value as unknown as BinaryEnvelope).encoding === "base64" && typeof (value as unknown as BinaryEnvelope).value === "string") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [
    key, sensitiveKey.test(key) ? "[REDACTED]" : redactSensitive(child),
  ])) as T;
}

function base64(bytes: ArrayBuffer): string {
  let value = "";
  for (const byte of new Uint8Array(bytes)) value += String.fromCharCode(byte);
  return btoa(value);
}

export class HetznerClient {
  constructor(private readonly config: HetznerConfig, private readonly fetchImpl: FetchLike = fetch) {}

  async request<T>(operation: OperationRequest, input: Record<string, unknown>): Promise<ToolEnvelope<T | null | string | BinaryEnvelope>> {
    let path = operation.path;
    for (const parameter of operation.parameters) if (parameter.location === "path") {
      const value = input[parameter.name];
      if (value === undefined || value === null) throw new HetznerApiError(0, operation.method, path, `Missing required path parameter: ${parameter.name}`);
      path = path.replace(`{${parameter.name}}`, encodeURIComponent(String(value)));
    }
    if (path.includes("{")) throw new HetznerApiError(0, operation.method, path, `Unresolved path parameter in ${operation.path}`);
    const url = new URL(baseUrl[operation.source] + path);
    for (const parameter of operation.parameters) if (parameter.location === "query") {
      const value = input[parameter.name];
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(parameter.name, String(item));
      else url.searchParams.set(parameter.name, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const token = operation.source === "cloud" ? this.config.cloudToken : this.config.unifiedToken;
    if (!token) throw new HetznerApiError(0, operation.method, path, "HETZNER_API_TOKEN_UNIFIED is required for unified Storage Box operations");
    const headers = new Headers({ accept: "application/json, text/plain, */*", authorization: `Bearer ${token}` });
    const init: RequestInit = { method: operation.method, headers, signal: AbortSignal.timeout(this.config.timeoutMs) };
    if (input.body !== undefined && !["GET", "HEAD"].includes(operation.method)) {
      headers.set("content-type", "application/json");
      init.body = JSON.stringify(input.body);
    }
    let response: Response;
    try { response = await this.fetchImpl(url, init); }
    catch (error) {
      const message = error instanceof Error ? redactErrorText(error.message, [token]) : "request error";
      throw new HetznerApiError(0, operation.method, path, `Hetzner request failed for ${operation.method} ${path}: ${message}`);
    }
    if (!response.ok) throw new HetznerApiError(response.status, operation.method, path, `Hetzner API returned ${response.status} for ${operation.method} ${path}`);
    let data: T | null | string | BinaryEnvelope = null;
    if (response.status !== 204) {
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (contentType.includes("json")) data = await response.json() as T;
      else if (contentType.startsWith("text/") || contentType.includes("xml")) data = await response.text();
      else data = { encoding: "base64", contentType: contentType || "application/octet-stream", value: base64(await response.arrayBuffer()) };
    }
    return redactSensitive({ data, status: response.status, request: { method: operation.method, path } });
  }
}
