type ApiError = { status: number; method: string; path: string; message: string };

export function redactErrorText(message: string, tokens: Array<string | undefined> = []): string {
  let redacted = message;
  for (const token of tokens) if (token) redacted = redacted.replaceAll(token, "[REDACTED]");
  return redacted.replace(/Bearer\s+[^\s,;]+/giu, "Bearer [REDACTED]");
}

function isApiError(error: unknown): error is ApiError {
  return !!error && typeof error === "object" && "status" in error && "method" in error && "path" in error && typeof (error as ApiError).status === "number";
}

export function formatToolError(error: unknown, tokens: Array<string | undefined>): { code: string; status?: number; method?: string; path?: string; message: string } {
  if (isApiError(error)) return {
    code: "HETZNER_API_ERROR", status: error.status, method: error.method, path: error.path,
    message: redactErrorText(error.message, tokens),
  };
  return { code: "HETZNER_TOOL_ERROR", message: redactErrorText(error instanceof Error ? error.message : String(error), tokens) };
}
