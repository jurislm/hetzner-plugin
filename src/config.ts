const PLACEHOLDER = /^\$\{[^}]*\}$/u;

export interface HetznerConfig {
  apiToken?: string;
  timeoutMs: number;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): HetznerConfig {
  const value = env.HETZNER_API_TOKEN?.trim();
  const apiToken = value && !PLACEHOLDER.test(value) ? value : undefined;
  return { ...(apiToken ? { apiToken } : {}), timeoutMs: 30_000 };
}
