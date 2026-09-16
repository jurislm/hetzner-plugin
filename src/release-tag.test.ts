import { describe, expect, test } from "bun:test";
import { assertReleaseTag } from "../scripts/check-release-tag.js";

describe("assertReleaseTag", () => {
  test("accepts the package version tag", () => {
    expect(() => assertReleaseTag("v1.5.0", "1.5.0")).not.toThrow();
  });

  test("rejects a missing or mismatched tag", () => {
    expect(() => assertReleaseTag(undefined, "1.5.0")).toThrow();
    expect(() => assertReleaseTag("v1.6.0", "1.5.0")).toThrow();
  });
});
