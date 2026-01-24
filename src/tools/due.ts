import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMochiClient, MochiApiError } from "../client.ts";

export function registerDueTools(server: McpServer): void {
  // ===========================================================================
  // get_due_cards
  // ===========================================================================
  server.tool(
    "get_due_cards",
    "Get cards that are due for review on a specific date. Useful for spaced repetition study sessions.",
    {
      date: z.string().optional().describe("ISO 8601 date to check (defaults to today)"),
      "deck-id": z.string().optional().describe("Filter by specific deck ID"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
        const result = await client.getDueCards(params);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof MochiApiError) {
          return {
            content: [{ type: "text", text: `Error ${error.statusCode}: ${error.message}` }],
            isError: true,
          };
        }
        throw error;
      }
    }
  );
}
