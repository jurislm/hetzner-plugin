import { expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function prepareRuntime(home: string) {
  const runtime = join(home, ".local/share/jurislm/mcp/hetzner-plugin");
  const installed = join(runtime, "node_modules/@jurislm/hetzner-plugin");
  mkdirSync(join(installed, "dist"), { recursive: true });
  mkdirSync(join(runtime, "node_modules/.bin"), { recursive: true });
  const dependencies = { "@jurislm/hetzner-plugin": "2.1.12" };
  writeFileSync(join(runtime, "package.json"), JSON.stringify({ dependencies }));
  writeFileSync(join(runtime, "bun.lock"), JSON.stringify({ workspaces: { "": { dependencies } }, packages: { "@jurislm/hetzner-plugin": ["@jurislm/hetzner-plugin@2.1.12", "", {}, "sha512-fixture"] } }));
  writeFileSync(join(installed, "package.json"), JSON.stringify({ name: "@jurislm/hetzner-plugin", version: "2.1.12", bin: { "hetzner-plugin": "dist/index.js" } }));
  writeFileSync(join(installed, "dist/index.js"), "");
  symlinkSync("../@jurislm/hetzner-plugin/dist/index.js", join(runtime, "node_modules/.bin/hetzner-plugin"));
  symlinkSync(process.execPath, join(home, ".bun/bin/real-bun"));
}

test("desktop launcher loads only the Hetzner credential and preserves stdio", () => {
  const fixtureHome = mkdtempSync(join(tmpdir(), "hetzner-desktop-"));
  try {
    const bin = join(fixtureHome, ".bun/bin");
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(fixtureHome, ".zshenv"), "print -r -- startup-banner\nprint -u2 -- startup-diagnostic\nexport HETZNER_API_TOKEN=fixture-token\nexport UNRELATED_SECRET=fixture-secret\n[[ -f \"$HOME/absent\" ]] && source \"$HOME/absent\"\n");
    prepareRuntime(fixtureHome);
    const executable = join(bin, "bun");
    writeFileSync(executable, '#!/bin/sh\n[ "$HETZNER_API_TOKEN" = fixture-token ] || exit 11\n[ -z "${UNRELATED_SECRET+x}" ] || exit 12\n[ -z "${PARENT_SECRET+x}" ] || exit 13\n[ "$SSH_AUTH_SOCK" = /fixture-agent ] || exit 16\n[ "$1" = --no-env-file ] || exit 14\n[ "$2" = --no-install ] || exit 15\ncase "$3" in */validate-hetzner-runtime.mjs) exec "$HOME/.bun/bin/real-bun" "$@" ;; esac\n[ "$3" = "$HOME/.local/share/jurislm/mcp/hetzner-plugin/node_modules/@jurislm/hetzner-plugin/dist/index.js" ] || exit 17\ncat\n');
    chmodSync(executable, 0o700);
    const result = Bun.spawnSync(["/bin/zsh", "-f", resolve("launchers/hetzner-desktop.zsh")], {
      env: { HOME: fixtureHome, ZDOTDIR: fixtureHome, PATH: "/usr/bin:/bin", PARENT_SECRET: "fixture-parent", SSH_AUTH_SOCK: "/fixture-agent" },
      stdin: Buffer.from('{"jsonrpc":"2.0"}\n'), stdout: "pipe", stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(new TextDecoder().decode(result.stdout)).toBe('{"jsonrpc":"2.0"}\n');
    expect(new TextDecoder().decode(result.stderr)).toBe("startup-diagnostic\n");
  } finally {
    rmSync(fixtureHome, { recursive: true, force: true });
  }
});

test("desktop launcher stops when zsh startup fails", () => {
  const fixtureHome = mkdtempSync(join(tmpdir(), "hetzner-desktop-failure-"));
  try {
    const bin = join(fixtureHome, ".bun/bin");
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(fixtureHome, ".zshenv"), "print -u2 -- startup-failure\nexport HETZNER_API_TOKEN=fixture-token\nreturn 9\n");
    prepareRuntime(fixtureHome);
    const executable = join(bin, "bun");
    writeFileSync(executable, "#!/bin/sh\nprintf 'unexpected-launch'\n");
    chmodSync(executable, 0o700);
    const result = Bun.spawnSync(["/bin/zsh", "-f", resolve("launchers/hetzner-desktop.zsh")], {
      env: { HOME: fixtureHome, ZDOTDIR: fixtureHome, PATH: "/usr/bin:/bin" }, stdout: "pipe", stderr: "pipe",
    });
    expect(result.exitCode).toBe(9);
    expect(new TextDecoder().decode(result.stdout)).toBe("");
    expect(new TextDecoder().decode(result.stderr)).toBe("startup-failure\n");
  } finally {
    rmSync(fixtureHome, { recursive: true, force: true });
  }
});

test("desktop launcher checks startup syntax before executing exports", () => {
  const home = mkdtempSync(join(tmpdir(), "hetzner-syntax-"));
  try {
    const bin = join(home, ".bun/bin");
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(home, ".zshenv"), "export HETZNER_API_TOKEN=fixture-token\nif true; then\n");
    writeFileSync(join(bin, "bun"), "#!/bin/sh\nprintf unexpected-launch\n");
    chmodSync(join(bin, "bun"), 0o700);
    const result = Bun.spawnSync(["/bin/zsh", "-f", resolve("launchers/hetzner-desktop.zsh")], { env: { HOME: home, ZDOTDIR: home, PATH: "/usr/bin:/bin" }, stdout: "pipe", stderr: "pipe" });
    expect(result.exitCode).not.toBe(0);
    expect(new TextDecoder().decode(result.stdout)).toBe("");
    expect(new TextDecoder().decode(result.stderr)).not.toContain("fixture-token");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
