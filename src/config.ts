export interface HetznerConfig {
  cloudToken: string;
  unifiedToken?: string;
  timeoutMs: number;
}

export class ConfigError extends Error {
  override name = "ConfigError";
}

export function loadConfig(env: Record<string, string | undefined> = process.env): HetznerConfig {
  const cloudToken = env.HETZNER_API_TOKEN?.trim();
  const unifiedToken = env.HETZNER_API_TOKEN_UNIFIED?.trim();
  if (!cloudToken) throw new ConfigError("HETZNER_API_TOKEN is required");
  return { cloudToken, ...(unifiedToken ? { unifiedToken } : {}), timeoutMs: 30_000 };
}
