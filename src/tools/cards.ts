import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MochiApiError, type MochiClient } from "../client.ts";

const CardFieldValueSchema = z.object({
  id: z.string().describe("Field ID (should match the key)"),
  value: z.string().describe("Field value"),
});

export function registerCardTools(server: McpServer, client: MochiClient): void {
  // ===========================================================================
  // list_cards
  // ===========================================================================
  server.registerTool(
    "list_cards",
    {
      description: "List cards with optional filtering by deck. Returns paginated results.",
      inputSchema: z.object({
        "deck-id": z.string().optional().describe("Filter cards by deck ID"),
        limit: z.number().min(1).max(100).optional().describe("Items per page (1-100, default 10)"),
        bookmark: z.string().optional().describe("Pagination cursor from previous request"),
      }),
    },
    async (params) => {
      try {
        const result = await client.listCards(params);
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
  // get_card
  // ===========================================================================
  server.registerTool(
    "get_card",
    {
      description: "Retrieve a single card by its ID.",
      inputSchema: z.object({
        id: z.string().describe("Card ID to retrieve"),
      }),
    },
    async ({ id }) => {
      try {
        const result = await client.getCard(id);
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
  // create_card
  // ===========================================================================
  server.registerTool(
    "create_card",
    {
      description: "Create a new flashcard in a deck.",
      inputSchema: z.object({
        content: z.string().describe("Markdown content of the card"),
        "deck-id": z.string().describe("ID of the deck this card belongs to"),
        "template-id": z.string().optional().describe("ID of the template to use"),
        "archived?": z.boolean().optional().describe("Whether the card is archived"),
        "review-reverse?": z.boolean().optional().describe("Review in reverse order (bottom to top)"),
        pos: z.string().optional().describe("Relative position within deck (lexicographic sorting)"),
        "manual-tags": z.array(z.string()).optional().describe("Tags without the # prefix"),
        fields: z.record(z.string(), CardFieldValueSchema).optional().describe("Map of field IDs to field values"),
      }),
    },
    async (params) => {
      try {
        const result = await client.createCard(params);
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
  // update_card
  // ===========================================================================
  server.registerTool(
    "update_card",
    {
      description: "Update an existing card's properties.",
      inputSchema: z.object({
        id: z.string().describe("Card ID to update"),
        content: z.string().optional().describe("Markdown content of the card"),
        "deck-id": z.string().optional().describe("ID of the deck this card belongs to"),
        "template-id": z.string().optional().describe("ID of the template to use"),
        "archived?": z.boolean().optional().describe("Whether the card is archived"),
        "trashed?": z.string().optional().describe("ISO 8601 timestamp if trashed, or omit to untrash"),
        "review-reverse?": z.boolean().optional().describe("Review in reverse order"),
        pos: z.string().optional().describe("Relative position within deck"),
        "manual-tags": z.array(z.string()).optional().describe("Tags without the # prefix (overwrites existing)"),
        fields: z.record(z.string(), CardFieldValueSchema).optional().describe("Map of field IDs to field values"),
      }),
    },
    async (params) => {
      try {
        const { id, ...data } = params;
        const result = await client.updateCard(id, data);
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
  // delete_card
  // ===========================================================================
  server.registerTool(
    "delete_card",
    {
      description: "Permanently delete a card. WARNING: This cannot be undone. Use update_card with trashed? for soft delete.",
      inputSchema: z.object({
        id: z.string().describe("Card ID to delete"),
      }),
    },
    async ({ id }) => {
      try {
        await client.deleteCard(id);
        return {
          content: [{ type: "text", text: `Card ${id} deleted successfully.` }],
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
  // add_attachment
  // ===========================================================================
  server.registerTool(
    "add_attachment",
    {
      description: "Upload a file attachment to a card. Reference it in card content as ![](@media/filename).",
      inputSchema: z.object({
        "card-id": z.string().describe("Card ID to attach file to"),
        filename: z.string().min(1).describe("Filename to use in Mochi"),
        content: z.base64().describe("Base64-encoded file content"),
        "media-type": z.string().optional().describe("File media type, such as image/png"),
      }),
    },
    async (params) => {
      try {
        const bytes = Uint8Array.from(atob(params.content), (character) => character.charCodeAt(0));
        const blob = new Blob([bytes], { type: params["media-type"] });
        const filename = params.filename;

        const result = await client.addAttachment(params["card-id"], blob, filename);
        return {
          content: [
            {
              type: "text",
              text: `Attachment uploaded successfully. Reference in card content as: ![](@media/${filename})\n\n${JSON.stringify(result, null, 2)}`,
            },
          ],
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
  // delete_attachment
  // ===========================================================================
  server.registerTool(
    "delete_attachment",
    {
      description: "Remove an attachment from a card.",
      inputSchema: z.object({
        "card-id": z.string().describe("Card ID"),
        filename: z.string().describe("Filename of attachment to delete"),
      }),
    },
    async (params) => {
      try {
        await client.deleteAttachment(params["card-id"], params.filename);
        return {
          content: [{ type: "text", text: `Attachment ${params.filename} deleted from card ${params["card-id"]}.` }],
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
