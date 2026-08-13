import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMochiServer } from "./server.ts";

interface MochiHttpHandlerOptions {
  mochiApiKey: string;
  authToken: string;
}

export function createMochiHttpHandler(options: MochiHttpHandlerOptions) {
  if (!options.mochiApiKey) {
    throw new Error("MOCHI_API_KEY is required");
  }
  if (!options.authToken) {
    throw new Error("MCP_AUTH_TOKEN is required");
  }

  return async (request: Request): Promise<Response> => {
    if (request.headers.get("authorization") !== `Bearer ${options.authToken}`) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer" },
      });
    }

    const server = createMochiServer(options.mochiApiKey);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    return transport.handleRequest(request);
  };
}
