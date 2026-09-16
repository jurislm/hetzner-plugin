import { describe, expect, test } from "bun:test";
import { ConfigError, loadConfig } from "./config.js";

describe("loadConfig", () => {
  test("requires Cloud credentials at startup but defers Unified credentials", () => {
    expect(() => loadConfig({ HETZNER_API_TOKEN_UNIFIED: "unified" })).toThrow(ConfigError);
    expect(loadConfig({ HETZNER_API_TOKEN: "cloud" })).toEqual({
      cloudToken: "cloud",
      timeoutMs: 30_000,
    });
    expect(loadConfig({ HETZNER_API_TOKEN: "cloud", HETZNER_API_TOKEN_UNIFIED: "unified" })).toMatchObject({ unifiedToken: "unified" });
  });
});
