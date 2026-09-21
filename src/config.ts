export interface HetznerConfig {
  cloudToken?: string;
  unifiedToken?: string;
  timeoutMs: number;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): HetznerConfig {
  const cloudToken = env.HETZNER_API_TOKEN?.trim();
  const unifiedToken = env.HETZNER_API_TOKEN_UNIFIED?.trim();
  return { ...(cloudToken ? { cloudToken } : {}), ...(unifiedToken ? { unifiedToken } : {}), timeoutMs: 30_000 };
}
