import { describe, expect, test } from "bun:test";
import { operations } from "./generated/operations.js";

describe("generated Hetzner operation registry", () => {
  test("combines every official Cloud and Unified operation without name collisions", () => {
    expect(operations.filter((operation) => operation.source === "cloud")).toHaveLength(190);
    expect(operations.filter((operation) => operation.source === "unified")).toHaveLength(32);
    expect(new Set(operations.map((operation) => operation.name)).size).toBe(222);
  });

  test("marks power and rollback operations destructive", () => {
    for (const name of [
      "hetzner_cloud_poweroff_server",
      "hetzner_cloud_reboot_server",
      "hetzner_cloud_rebuild_server",
      "hetzner_cloud_shutdown_server",
      "hetzner_unified_rollback_storage_box_snapshot",
    ]) {
      expect(operations.find((operation) => operation.name === name)?.annotations.destructiveHint).toBe(true);
    }
  });
});
