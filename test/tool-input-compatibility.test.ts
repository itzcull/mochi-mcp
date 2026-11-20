import { expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCardTools } from "../src/tools/cards.ts";
import { registerDeckTools } from "../src/tools/decks.ts";
import { registerDueTools } from "../src/tools/due.ts";
import { toMochiApiInput } from "../src/tools/mochi-input.ts";
import { registerTemplateTools } from "../src/tools/templates.ts";

const TOOL_PARAMETER_NAME_PATTERN = /^[a-zA-Z0-9_.-]{1,64}$/;

test("all tools expose client-compatible parameter names", async () => {
  const server = new McpServer({ name: "tool-input-test-server", version: "1.0.0" });
  registerCardTools(server);
  registerDeckTools(server);
  registerDueTools(server);
  registerTemplateTools(server);

  const client = new Client({ name: "tool-input-test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  try {
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const { tools } = await client.listTools();
    const invalidParameters = tools.flatMap((tool) =>
      Object.keys(tool.inputSchema.properties ?? {})
        .filter((parameter) => !TOOL_PARAMETER_NAME_PATTERN.test(parameter))
        .map((parameter) => `${tool.name}.${parameter}`)
    );

    expect(invalidParameters).toEqual([]);
  } finally {
    await client.close();
    await server.close();
  }
});

test("MCP-safe inputs are translated to Mochi API keys", () => {
  const fields = {
    front: {
      id: "front",
      options: { "multi-line?": true },
    },
  };

  expect(
    toMochiApiInput({
      archived: false,
      trashed: "2026-11-20T00:00:00Z",
      "review-reverse": true,
      "show-sides": false,
      content: "Question\n---\nAnswer",
      fields,
    })
  ).toEqual({
    "archived?": false,
    "trashed?": "2026-11-20T00:00:00Z",
    "review-reverse?": true,
    "show-sides?": false,
    content: "Question\n---\nAnswer",
    fields,
  });
});
