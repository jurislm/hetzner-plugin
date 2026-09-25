export function ciMetadataValue(
  name: string,
  environment: Record<string, string | undefined> = process.env,
): string | undefined {
  return environment.CI_SYSTEM_NAME === "woodpecker" ? environment[name] || undefined : undefined;
}
