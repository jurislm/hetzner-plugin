export const CONFIG_VARIABLES = ["HETZNER_API_TOKEN"] as const;

export interface HetznerConfig {
  apiToken?: string;
  timeoutMs: number;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): HetznerConfig {
  const apiToken = env.HETZNER_API_TOKEN?.trim();
  return { ...(apiToken ? { apiToken } : {}), timeoutMs: 30_000 };
}
