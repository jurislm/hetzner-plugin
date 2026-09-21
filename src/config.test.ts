import { describe, expect, test } from "bun:test";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  test("defers missing credentials until request time", () => {
    expect(loadConfig({})).toEqual({ timeoutMs: 30_000 });
    expect(loadConfig({ HETZNER_API_TOKEN_UNIFIED: "unified" })).toEqual({
      unifiedToken: "unified",
      timeoutMs: 30_000,
    });
    expect(loadConfig({ HETZNER_API_TOKEN: "cloud" })).toEqual({
      cloudToken: "cloud",
      timeoutMs: 30_000,
    });
    expect(loadConfig({ HETZNER_API_TOKEN: "cloud", HETZNER_API_TOKEN_UNIFIED: "unified" })).toMatchObject({ unifiedToken: "unified" });
  });
});
