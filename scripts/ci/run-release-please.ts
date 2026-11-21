import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ciMetadataValue } from "./ci-metadata";
import { parseReleaseRepository, releaseRepoId } from "./release-repository";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function runReleasePlease(
  mode: string | undefined,
  token: string | undefined,
  expectedSha: string | undefined,
  request: typeof fetch,
  run: (args: string[]) => Promise<number>,
): Promise<void> {
  if (mode !== "github-release" && mode !== "release-pr") throw new Error("Unsupported release mode");
  if (!token) throw new Error("GITHUB_API_TOKEN is required");
  if (!expectedSha || !/^[a-f0-9]{40}$/.test(expectedSha)) throw new Error("CI commit SHA is required");
  async function readGitHub(path: string, error: string): Promise<unknown> {
    let response: Response;
    try {
      response = await request(`https://api.github.com${path}`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(error);
    }
    if (!response.ok || response.redirected) throw new Error(error);
    return response.json().catch(() => null);
  }
  const repositoryPath = `/repositories/${releaseRepoId}`;
  const repository = parseReleaseRepository(await readGitHub(repositoryPath, "GitHub repository lookup failed"));
  let temporary: string | undefined;
  try {
    temporary = await mkdtemp(join(tmpdir(), "hetzner-release-"));
    const tokenPath = join(temporary, "token");
    await writeFile(tokenPath, token, { flag: "wx", mode: 0o600 });
    const canonical = parseReleaseRepository(await readGitHub(
      `/repos/${repository.fullName}`, "GitHub canonical repository lookup failed",
    ));
    if (canonical.fullName !== repository.fullName) throw new Error("GitHub canonical repository identity changed");
    const liveMain = await readGitHub(`${repositoryPath}/git/ref/heads/main`, "GitHub main readback failed");
    if (!isRecord(liveMain) || liveMain.ref !== "refs/heads/main" || !isRecord(liveMain.object) ||
      liveMain.object.type !== "commit" || liveMain.object.sha !== expectedSha)
      throw new Error("GitHub main does not match the triggering CI commit");
    try {
      const code = await run([
        "bunx", "release-please", mode,
        `--token=${tokenPath}`, `--repo-url=https://github.com/${repository.fullName}`,
        "--target-branch=main", "--config-file=release-please-config.json",
        "--manifest-file=.release-please-manifest.json",
      ]);
      if (code !== 0) throw new Error();
    } catch {
      throw new Error(`Release Please failed: ${mode}`);
    }
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true })
      .catch(() => { throw new Error("Release Please credential cleanup failed"); });
  }
}

export async function spawnReleasePlease(
  args: string[],
  token: string | undefined,
  write: (stdout: string, stderr: string) => void,
): Promise<number> {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => name !== "GITHUB_API_TOKEN"));
  const child = Bun.spawn(args, { env, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  const redact = (output: string) => token ? output.replaceAll(token, "[REDACTED]") : output;
  write(redact(stdout), redact(stderr));
  return code;
}

if (import.meta.main) {
  try {
    const token = process.env.GITHUB_API_TOKEN;
    await runReleasePlease(process.argv[2], token, ciMetadataValue("CI_COMMIT_SHA"), fetch, (args) => spawnReleasePlease(args, token, (stdout, stderr) => {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
    }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Release failed");
    process.exitCode = 1;
  }
}
