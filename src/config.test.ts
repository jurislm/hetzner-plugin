import { describe, expect, test } from "bun:test";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  test("defers missing credentials until request time", () => {
    expect(loadConfig({})).toEqual({ timeoutMs: 30_000 });
    expect(loadConfig({ HETZNER_API_TOKEN: " single-token " })).toEqual({
      apiToken: "single-token",
      timeoutMs: 30_000,
    });
  });
});
