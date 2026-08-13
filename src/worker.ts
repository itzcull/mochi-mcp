import { createMochiHttpHandler } from "./http.ts";

interface Env {
  MOCHI_API_KEY: string;
  MCP_AUTH_TOKEN: string;
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== "/mcp") {
      return Promise.resolve(new Response("Not found", { status: 404 }));
    }

    return createMochiHttpHandler({
      mochiApiKey: env.MOCHI_API_KEY,
      authToken: env.MCP_AUTH_TOKEN,
    })(request);
  },
};
