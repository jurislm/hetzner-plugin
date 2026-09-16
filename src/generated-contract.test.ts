import { describe, expect, test } from "bun:test";
import { operations } from "./generated/operations.js";

describe("generated Hetzner operation registry", () => {
  test("combines every official Cloud and Unified operation without name collisions", () => {
    expect(operations.filter((operation) => operation.source === "cloud")).toHaveLength(190);
    expect(operations.filter((operation) => operation.source === "unified")).toHaveLength(32);
    expect(new Set(operations.map((operation) => operation.name)).size).toBe(222);
  });
});
