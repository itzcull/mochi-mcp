import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MochiClient } from "./client.ts";
import { registerCardTools } from "./tools/cards.ts";
import { registerDeckTools } from "./tools/decks.ts";
import { registerDueTools } from "./tools/due.ts";
import { registerTemplateTools } from "./tools/templates.ts";

export function createMochiServer(apiKey: string): McpServer {
  const server = new McpServer({
    name: "mochi-mcp",
    version: "1.0.0",
  });
  const client = new MochiClient(apiKey);

  registerCardTools(server, client);
  registerDeckTools(server, client);
  registerTemplateTools(server, client);
  registerDueTools(server, client);

  return server;
}
