import { expect, test } from "bun:test";
import worker from "./worker.ts";

const env = {
  MOCHI_API_KEY: "mochi-api-key",
  MCP_AUTH_TOKEN: "deployment-token",
};

test("exposes the remote MCP handler at /mcp", async () => {
  const response = await worker.fetch(new Request("https://worker.example/mcp", {
    method: "POST",
  }), env);

  expect(response.status).toBe(401);
  expect(response.headers.get("www-authenticate")).toBe("Bearer");
});

test("does not expose MCP on other paths", async () => {
  const response = await worker.fetch(new Request("https://worker.example/"), env);

  expect(response.status).toBe(404);
});
