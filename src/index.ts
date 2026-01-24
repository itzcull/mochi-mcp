#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCardTools } from "./tools/cards.ts";
import { registerDeckTools } from "./tools/decks.ts";
import { registerTemplateTools } from "./tools/templates.ts";
import { registerDueTools } from "./tools/due.ts";

// Validate API key is present
const apiKey = process.env.MOCHI_API_KEY;
if (!apiKey) {
  console.error("Error: MOCHI_API_KEY environment variable is required");
  console.error("");
  console.error("To get your API key:");
  console.error("  1. Open Mochi Cards app");
  console.error("  2. Go to Account Settings");
  console.error("  3. Find your API key");
  console.error("");
  console.error("Then run with:");
  console.error("  MOCHI_API_KEY=your_api_key bun src/index.ts");
  process.exit(1);
}

// Create MCP server
const server = new McpServer({
  name: "mochi-mcp",
  version: "1.0.0",
});

// Register all tools
registerCardTools(server);
registerDeckTools(server);
registerTemplateTools(server);
registerDueTools(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Mochi MCP server running on stdio");
