import { expect, test } from "bun:test";

const repositoryUrl = "https://github.com/jurislm/hetzner-plugin";
const websiteUrl = "https://jurislm.github.io/hetzner-plugin/";
const codexInstallCommands = [
  "codex plugin marketplace add https://github.com/jurislm/hetzner-plugin",
  "codex plugin add hetzner-plugin@hetzner-marketplace",
].join("\n");

test("official website content, counts, install commands, and metadata agree", async () => {
  const page = await Bun.file("docs/index.html").text();
  const api = JSON.parse(await Bun.file("api/manifest.json").text());
  const portable = JSON.parse(await Bun.file("plugin.json").text());
  const codex = JSON.parse(await Bun.file(".codex-plugin/plugin.json").text());
  const cursor = JSON.parse(await Bun.file(".cursor-plugin/plugin.json").text());

  const focusedToolCount = [...page.matchAll(/<span class="category-count">(\d+)<\/span>/g)]
    .reduce((sum, [, count]) => sum + Number(count), 0);
  const generatedToolCount = api.cloud.operationCount + api.unified.operationCount;

  expect(page).toContain("local stdio MCP");
  expect(page.toLowerCase()).toContain("no remote mcp endpoint");
  expect(page).toContain("OAuth");
  expect(page).toContain("HETZNER_API_TOKEN");
  expect(page).toContain("190 Cloud + 32 Unified");
  expect(generatedToolCount).toBe(222);
  expect(focusedToolCount).toBe(42);
  expect(page).toContain('<div class="num">264</div>');

  const installButton = page.match(/<button class="install-box"[\s\S]*?<\/button>/)?.[0];
  expect(installButton).toContain("codex plugin marketplace add");
  expect(installButton).toContain("codex plugin add hetzner-plugin@hetzner-marketplace");
  expect(page).toContain(`const CODEX_INSTALL_COMMANDS = ${JSON.stringify(codexInstallCommands)};`);
  expect(page).toContain("navigator.clipboard.writeText(CODEX_INSTALL_COMMANDS)");

  for (const locale of ["en", "zh", "ja", "ko"]) {
    expect(page).toContain(locale + ": {");
  }

  expect(portable.homepage).toBe(websiteUrl);
  expect(portable.repository).toBe(repositoryUrl);
  expect(portable.extensions["com.openai"].interface.websiteURL).toBe(websiteUrl);
  expect(codex.interface.websiteURL).toBe(websiteUrl);
  expect(cursor.homepage).toBe(websiteUrl);
  expect(cursor.repository).toBe(repositoryUrl);
});
