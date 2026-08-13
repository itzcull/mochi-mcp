import { describe, expect, test } from "bun:test";
import { createMochiHttpHandler } from "./http.ts";

function mcpRequest(body: unknown): Request {
  return new Request("https://mcp.example/mcp", {
    method: "POST",
    headers: {
      Authorization: "Bearer deployment-token",
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("remote MCP access", () => {
  test("rejects requests without the deployment bearer token", async () => {
    const handleRequest = createMochiHttpHandler({
      mochiApiKey: "mochi-api-key",
      authToken: "deployment-token",
    });

    const response = await handleRequest(new Request("https://mcp.example/mcp", {
      method: "POST",
    }));

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
  });

  test("rejects an invalid deployment bearer token", async () => {
    const handleRequest = createMochiHttpHandler({
      mochiApiKey: "mochi-api-key",
      authToken: "deployment-token",
    });

    const response = await handleRequest(new Request("https://mcp.example/mcp", {
      method: "POST",
      headers: { Authorization: "Bearer invalid-token" },
    }));

    expect(response.status).toBe(401);
  });

  test("refuses to start without both deployment secrets", () => {
    expect(() => createMochiHttpHandler({
      mochiApiKey: "",
      authToken: "deployment-token",
    })).toThrow("MOCHI_API_KEY is required");
    expect(() => createMochiHttpHandler({
      mochiApiKey: "mochi-api-key",
      authToken: "",
    })).toThrow("MCP_AUTH_TOKEN is required");
  });

  test("accepts MCP requests with the deployment bearer token", async () => {
    const handleRequest = createMochiHttpHandler({
      mochiApiKey: "mochi-api-key",
      authToken: "deployment-token",
    });

    const response = await handleRequest(mcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        serverInfo: { name: "mochi-mcp" },
      },
    });
  });

  test("handles independent requests without shared session state", async () => {
    const handleRequest = createMochiHttpHandler({
      mochiApiKey: "mochi-api-key",
      authToken: "deployment-token",
    });

    const response = await handleRequest(mcpRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      id: 2,
      result: {
        tools: expect.arrayContaining([
          expect.objectContaining({ name: "list_cards" }),
        ]),
      },
    });
  });
});
