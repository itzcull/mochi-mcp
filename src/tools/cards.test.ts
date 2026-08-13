import { expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MochiClient } from "../client.ts";
import { registerCardTools } from "./cards.ts";

test("uploads attachment content supplied by an MCP client", async () => {
  const uploaded: { cardId: string; bytes: number[]; filename: string; mediaType: string }[] = [];
  const mochiClient = new MochiClient("unused-api-key");
  mochiClient.addAttachment = async (cardId, file, filename) => {
    uploaded.push({
      cardId,
      bytes: [...new Uint8Array(await file.arrayBuffer())],
      filename,
      mediaType: file.type,
    });
    return { id: "attachment-id" };
  };
  const server = new McpServer({ name: "test-server", version: "1.0.0" });
  registerCardTools(server, mochiClient);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const result = await client.callTool({
    name: "add_attachment",
    arguments: {
      "card-id": "card-id",
      filename: "note.txt",
      content: "SGVsbG8=",
      "media-type": "application/octet-stream",
    },
  });

  expect(result.isError).not.toBe(true);
  expect(uploaded).toEqual([{
    cardId: "card-id",
    bytes: [72, 101, 108, 108, 111],
    filename: "note.txt",
    mediaType: "application/octet-stream",
  }]);

  await Promise.all([client.close(), server.close()]);
});
