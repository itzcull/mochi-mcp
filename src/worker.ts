import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
import { createMochiClient, setMochiClient } from "./client.ts";
import { registerCardTools } from "./tools/cards.ts";
import { registerDeckTools } from "./tools/decks.ts";
import { registerTemplateTools } from "./tools/templates.ts";
import { registerDueTools } from "./tools/due.ts";

export interface Env {
  MOCHI_API_KEY: string;
}

function createServer(env: Env): McpServer {
  // Initialize the Mochi client with the API key from environment
  setMochiClient(createMochiClient(env.MOCHI_API_KEY));

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

  return server;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", server: "mochi-mcp" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Root endpoint - API info
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          name: "mochi-mcp",
          version: "1.0.0",
          description: "MCP server for Mochi Cards API",
          transport: "Streamable HTTP (MCP standard)",
          endpoints: {
            "/mcp": "MCP endpoint (Streamable HTTP transport)",
            "/health": "Health check endpoint",
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate API key is configured before handling MCP requests
    if (!env.MOCHI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "MOCHI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create server and handle MCP requests using Cloudflare's official handler
    const server = createServer(env);
    const handler = createMcpHandler(server);

    return handler(request, env, ctx);
  },
};
