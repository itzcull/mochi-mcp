import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMochiClient, MochiApiError } from "../client.ts";

const SortBySchema = z.enum([
  "none",
  "lexigraphically",
  "lexicographically",
  "created-at",
  "updated-at",
  "retention-rate-asc",
  "interval-length",
]);

const CardsViewSchema = z.enum(["list", "grid", "note", "column"]);

export function registerDeckTools(server: McpServer): void {
  // ===========================================================================
  // list_decks
  // ===========================================================================
  server.tool(
    "list_decks",
    "List all decks with pagination.",
    {
      bookmark: z.string().optional().describe("Pagination cursor from previous request"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
        const result = await client.listDecks(params);
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

  // ===========================================================================
  // get_deck
  // ===========================================================================
  server.tool(
    "get_deck",
    "Retrieve a single deck by its ID.",
    {
      id: z.string().describe("Deck ID to retrieve"),
    },
    async ({ id }) => {
      try {
        const client = getMochiClient();
        const result = await client.getDeck(id);
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

  // ===========================================================================
  // create_deck
  // ===========================================================================
  server.tool(
    "create_deck",
    "Create a new deck for organizing flashcards.",
    {
      name: z.string().describe("Name of the deck"),
      "parent-id": z.string().optional().describe("ID of parent deck for nesting"),
      sort: z.number().optional().describe("Numeric sort order"),
      "archived?": z.boolean().optional().describe("Whether the deck is archived"),
      "trashed?": z.string().optional().describe("ISO 8601 timestamp if trashed"),
      "sort-by": SortBySchema.optional().describe("Card sorting method on deck page"),
      "cards-view": CardsViewSchema.optional().describe("Card display mode: list, grid, note, or column"),
      "show-sides?": z.boolean().optional().describe("Show all sides of cards on deck page"),
      "sort-by-direction": z.boolean().optional().describe("Reverse sort order when true"),
      "review-reverse?": z.boolean().optional().describe("Review cards in reverse order (bottom to top)"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
        const result = await client.createDeck(params);
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

  // ===========================================================================
  // update_deck
  // ===========================================================================
  server.tool(
    "update_deck",
    "Update an existing deck's properties.",
    {
      id: z.string().describe("Deck ID to update"),
      name: z.string().optional().describe("Name of the deck"),
      "parent-id": z.string().optional().describe("ID of parent deck for nesting"),
      sort: z.number().optional().describe("Numeric sort order"),
      "archived?": z.boolean().optional().describe("Whether the deck is archived"),
      "trashed?": z.string().optional().describe("ISO 8601 timestamp if trashed"),
      "sort-by": SortBySchema.optional().describe("Card sorting method"),
      "cards-view": CardsViewSchema.optional().describe("Card display mode"),
      "show-sides?": z.boolean().optional().describe("Show all sides of cards"),
      "sort-by-direction": z.boolean().optional().describe("Reverse sort order"),
      "review-reverse?": z.boolean().optional().describe("Review cards in reverse"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
        const { id, ...data } = params;
        const result = await client.updateDeck(id, data);
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

  // ===========================================================================
  // delete_deck
  // ===========================================================================
  server.tool(
    "delete_deck",
    "Permanently delete a deck. WARNING: This cannot be undone. Use update_deck with trashed? for soft delete.",
    {
      id: z.string().describe("Deck ID to delete"),
    },
    async ({ id }) => {
      try {
        const client = getMochiClient();
        await client.deleteDeck(id);
        return {
          content: [{ type: "text", text: `Deck ${id} deleted successfully.` }],
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
