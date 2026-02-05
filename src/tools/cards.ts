import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMochiClient, MochiApiError } from "../client.ts";

const CardFieldValueSchema = z.object({
  id: z.string().describe("Field ID (should match the key)"),
  value: z.string().describe("Field value"),
});

export function registerCardTools(server: McpServer): void {
  // ===========================================================================
  // list_cards
  // ===========================================================================
  server.tool(
    "list_cards",
    "List cards with optional filtering by deck. Returns paginated results.",
    {
      "deck-id": z.string().optional().describe("Filter cards by deck ID"),
      limit: z.number().min(1).max(100).optional().describe("Items per page (1-100, default 10)"),
      bookmark: z.string().optional().describe("Pagination cursor from previous request"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
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
  server.tool(
    "get_card",
    "Retrieve a single card by its ID.",
    {
      id: z.string().describe("Card ID to retrieve"),
    },
    async ({ id }) => {
      try {
        const client = getMochiClient();
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
  server.tool(
    "create_card",
    "Create a new flashcard in a deck.",
    {
      content: z.string().describe("Markdown content of the card"),
      "deck-id": z.string().describe("ID of the deck this card belongs to"),
      "template-id": z.string().optional().describe("ID of the template to use"),
      "archived?": z.boolean().optional().describe("Whether the card is archived"),
      "review-reverse?": z.boolean().optional().describe("Review in reverse order (bottom to top)"),
      pos: z.string().optional().describe("Relative position within deck (lexicographic sorting)"),
      "manual-tags": z.array(z.string()).optional().describe("Tags without the # prefix"),
      fields: z.record(z.string(), CardFieldValueSchema).optional().describe("Map of field IDs to field values"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
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
  server.tool(
    "update_card",
    "Update an existing card's properties.",
    {
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
    },
    async (params) => {
      try {
        const client = getMochiClient();
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
  server.tool(
    "delete_card",
    "Permanently delete a card. WARNING: This cannot be undone. Use update_card with trashed? for soft delete.",
    {
      id: z.string().describe("Card ID to delete"),
    },
    async ({ id }) => {
      try {
        const client = getMochiClient();
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
  server.tool(
    "add_attachment",
    "Upload a file attachment to a card. Provide either file-path (local/Bun only) or base64-data (Workers compatible). Reference it in card content as ![](@media/filename).",
    {
      "card-id": z.string().describe("Card ID to attach file to"),
      "file-path": z.string().optional().describe("Local file path to upload (not available in Cloudflare Workers)"),
      "base64-data": z.string().optional().describe("Base64-encoded file data (use this for Cloudflare Workers)"),
      "content-type": z.string().optional().describe("MIME type when using base64-data (e.g., 'image/png')"),
      filename: z.string().describe("Filename to use in Mochi"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
        let blob: Blob;
        const filename = params.filename;

        if (params["base64-data"]) {
          // Base64 data mode - Works in Cloudflare Workers
          const binaryString = atob(params["base64-data"]);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: params["content-type"] ?? "application/octet-stream" });
        } else if (params["file-path"]) {
          // File path mode - Only works with Bun runtime
          if (typeof Bun === "undefined") {
            return {
              content: [{ type: "text", text: "Error: file-path is not supported in Cloudflare Workers. Use base64-data instead." }],
              isError: true,
            };
          }
          const filePath = params["file-path"];
          const file = Bun.file(filePath);

          if (!(await file.exists())) {
            return {
              content: [{ type: "text", text: `Error: File not found: ${filePath}` }],
              isError: true,
            };
          }

          blob = await file.arrayBuffer().then((ab) => new Blob([ab]));
        } else {
          return {
            content: [{ type: "text", text: "Error: Either file-path or base64-data must be provided" }],
            isError: true,
          };
        }

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
  server.tool(
    "delete_attachment",
    "Remove an attachment from a card.",
    {
      "card-id": z.string().describe("Card ID"),
      filename: z.string().describe("Filename of attachment to delete"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
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
