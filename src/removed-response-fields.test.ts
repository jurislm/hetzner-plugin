import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { operations } from "./generated/operations.js";
const fixture = await Bun.file(new URL("./fixtures/servers-without-deprecated.json", import.meta.url)).json();
import { currentResponseSchema } from "./removed-response-fields.js";
import { createServer } from "./server.js";

async function listServers(data: unknown) {
  const server = createServer({ apiToken: "fixture-token", timeoutMs: 1000 }, async () => new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } }));
  const client = new Client({ name: "response-contract-test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    return await client.callTool({ name: "hetzner_cloud_list_servers", arguments: {} });
  } finally {
    await client.close();
    await server.close();
  }
}

describe("removed Hetzner response fields", () => {
  test("accepts a nonempty server response without deprecated fields", async () => {
    const result = await listServers(fixture);
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({ status: 200, data: fixture });
  });

  test("still rejects malformed unrelated required fields", async () => {
    const data = structuredClone(fixture);
    const result = await listServers({ ...data, servers: [{ ...data.servers[0], id: "not-an-id" }] });
    expect(result.isError).toBe(true);
  });

  test("retains the original snapshot schema independently of compatibility", () => {
    const operation = operations.find((item) => item.name === "hetzner_cloud_list_servers")!;
    expect(JSON.stringify(z.toJSONSchema(operation.responseSchema))).toContain('"deprecated":{');
  });
});


test("removes only deprecated properties from all affected operation responses", () => {
  let affected = 0;
  for (const operation of operations) {
    const jsonSchema = (schema: z.ZodType) => JSON.parse(JSON.stringify(z.toJSONSchema(schema), (key, value: unknown) => key === "~standard" ? undefined : value));
    const original = jsonSchema(operation.responseSchema);
    const expected = structuredClone(original);
    const remove = (node: unknown): void => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(remove);
        return;
      }
      const object = node as Record<string, unknown>;
      const properties = object.properties as Record<string, unknown> | undefined;
      if (properties && "deprecated" in properties) {
        delete properties.deprecated;
        object.required = (object.required as string[]).filter((key) => key !== "deprecated");
      }
      Object.values(object).forEach(remove);
    };
    remove(expected);
    if (JSON.stringify(original) !== JSON.stringify(expected)) {
      affected++;
      expect(jsonSchema(currentResponseSchema(operation))).toEqual(expected);
    } else {
      expect(currentResponseSchema(operation)).toBe(operation.responseSchema);
    }
  }
  expect(affected).toBe(16);
});

test("accepts nullable server images without changing the snapshot", async () => {
  const data = structuredClone(fixture);
  data.servers[0].image = null;
  const result = await listServers(data);
  expect(result.isError).not.toBe(true);
  expect(result.structuredContent).toMatchObject({ data });
});
