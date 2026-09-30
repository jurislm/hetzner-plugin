import { expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("desktop launcher loads only the Hetzner credential and preserves stdio", () => {
  const fixtureHome = mkdtempSync(join(tmpdir(), "hetzner-desktop-"));
  try {
    const bin = join(fixtureHome, ".bun/bin");
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(fixtureHome, ".zshenv"), "export HETZNER_API_TOKEN=fixture-token\nexport UNRELATED_SECRET=fixture-secret\n");
    const executable = join(bin, "bunx");
    writeFileSync(executable, '#!/bin/sh\n[ "$HETZNER_API_TOKEN" = fixture-token ] || exit 11\n[ -z "${UNRELATED_SECRET+x}" ] || exit 12\n[ -z "${PARENT_SECRET+x}" ] || exit 13\n[ "$SSH_AUTH_SOCK" = /fixture-agent ] || exit 16\n[ "$1" = -y ] || exit 14\n[ "$2" = @jurislm/hetzner-plugin@latest ] || exit 15\ncat\n');
    chmodSync(executable, 0o700);
    const result = Bun.spawnSync(["/bin/zsh", resolve("launchers/hetzner-desktop.zsh")], {
      env: { HOME: fixtureHome, ZDOTDIR: fixtureHome, PATH: "/usr/bin:/bin", PARENT_SECRET: "fixture-parent", SSH_AUTH_SOCK: "/fixture-agent" },
      stdin: Buffer.from('{"jsonrpc":"2.0"}\n'), stdout: "pipe", stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(new TextDecoder().decode(result.stdout)).toBe('{"jsonrpc":"2.0"}\n');
    expect(new TextDecoder().decode(result.stderr)).toBe("");
  } finally {
    rmSync(fixtureHome, { recursive: true, force: true });
  }
});
