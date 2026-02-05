import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { createMochiClient, setMochiClient } from "./client.ts";
import { registerCardTools } from "./tools/cards.ts";
import { registerDeckTools } from "./tools/decks.ts";
import { registerTemplateTools } from "./tools/templates.ts";
import { registerDueTools } from "./tools/due.ts";

export interface Env {
  MOCHI_API_KEY: string;
}

/**
 * Custom SSE Transport for Cloudflare Workers
 * Implements the MCP Transport interface using SSE for server-to-client
 * and POST requests for client-to-server communication.
 */
class WorkerSSETransport implements Transport {
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private encoder = new TextEncoder();
  private _onclose?: () => void;
  private _onerror?: (error: Error) => void;
  private _onmessage?: (message: JSONRPCMessage) => void;

  constructor() {}

  set onclose(handler: (() => void) | undefined) {
    this._onclose = handler;
  }

  set onerror(handler: ((error: Error) => void) | undefined) {
    this._onerror = handler;
  }

  set onmessage(handler: ((message: JSONRPCMessage) => void) | undefined) {
    this._onmessage = handler;
  }

  /**
   * Create the SSE response stream
   */
  createSSEResponse(): Response {
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    this.writer = writable.getWriter();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  async start(): Promise<void> {
    // Transport is ready when createSSEResponse is called
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.writer) {
      throw new Error("Transport not started - call createSSEResponse first");
    }

    const data = `data: ${JSON.stringify(message)}\n\n`;
    await this.writer.write(this.encoder.encode(data));
  }

  async close(): Promise<void> {
    if (this.writer) {
      try {
        await this.writer.close();
      } catch {
        // Writer may already be closed
      }
      this.writer = null;
    }
    this._onclose?.();
  }

  /**
   * Handle incoming POST message from client
   */
  async handleMessage(message: JSONRPCMessage): Promise<void> {
    this._onmessage?.(message);
  }
}

// Store active sessions
const sessions = new Map<string, { server: McpServer; transport: WorkerSSETransport }>();

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
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for cross-origin requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", server: "mochi-mcp" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // SSE endpoint for MCP connections
    if (url.pathname === "/sse" && request.method === "GET") {
      // Validate API key is configured
      if (!env.MOCHI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "MOCHI_API_KEY not configured" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const server = createServer(env);
      const transport = new WorkerSSETransport();

      // Generate unique session ID
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, { server, transport });

      // Connect server to transport
      await server.connect(transport);

      // Create SSE response
      const response = transport.createSSEResponse();

      // Send initial endpoint message with session ID
      const endpointMessage = {
        jsonrpc: "2.0" as const,
        method: "endpoint",
        params: {
          sessionId,
          messageEndpoint: `${url.origin}/message`,
        },
      };
      await transport.send(endpointMessage as JSONRPCMessage);

      // Clone response to add session ID header
      const headers = new Headers(response.headers);
      headers.set("X-Session-Id", sessionId);
      Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    // Message endpoint for client-to-server messages
    if (url.pathname === "/message" && request.method === "POST") {
      const sessionId = request.headers.get("X-Session-Id");
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "Missing X-Session-Id header" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const session = sessions.get(sessionId);
      if (!session) {
        return new Response(
          JSON.stringify({ error: "Session not found or expired" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      try {
        const message = (await request.json()) as JSONRPCMessage;
        await session.transport.handleMessage(message);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(
          JSON.stringify({ error: "Failed to process message", details: errorMessage }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Root endpoint - API info
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          name: "mochi-mcp",
          version: "1.0.0",
          description: "MCP server for Mochi Cards API",
          endpoints: {
            "/sse": "GET - SSE endpoint for MCP connections",
            "/message": "POST - Message endpoint for client requests (requires X-Session-Id header)",
            "/health": "GET - Health check endpoint",
          },
          usage: "Connect via SSE at /sse, then send messages to /message with the session ID from X-Session-Id header",
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders,
    });
  },
};
