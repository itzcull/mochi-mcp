#!/usr/bin/env bun
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMochiServer } from "./server.ts";

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

const server = createMochiServer(apiKey);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Mochi MCP server running on stdio");
