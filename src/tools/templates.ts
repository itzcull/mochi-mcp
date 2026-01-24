import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMochiClient, MochiApiError } from "../client.ts";

const TemplateFieldTypeSchema = z.enum([
  "text",
  "boolean",
  "number",
  "draw",
  "ai",
  "speech",
  "image",
  "translate",
  "transcription",
  "dictionary",
  "pinyin",
  "furigana",
]);

const TemplateFieldOptionsSchema = z
  .object({
    "multi-line?": z.boolean().optional().describe("Allow multiple lines of text"),
    "hide-term": z.boolean().optional().describe("Hide the term in review"),
    "ai-task": z.string().optional().describe("AI task description"),
  })
  .passthrough();

const TemplateFieldSchema = z.object({
  id: z.string().describe("Field ID (should match the key)"),
  name: z.string().optional().describe("Human-readable field name"),
  type: TemplateFieldTypeSchema.optional().describe("Field input type"),
  pos: z.string().optional().describe("Relative position for sorting"),
  content: z.string().optional().describe("Default content or instructions"),
  options: TemplateFieldOptionsSchema.optional().describe("Field-specific options"),
});

const TemplateFieldsSchema = z.record(z.string(), TemplateFieldSchema);

const TemplateStyleSchema = z.object({
  "text-alignment": z.enum(["left", "center", "right"]).optional().describe("Text alignment"),
});

const TemplateOptionsSchema = z.object({
  "show-sides-separately?": z.boolean().optional().describe("Show template sides separately during review"),
});

export function registerTemplateTools(server: McpServer): void {
  // ===========================================================================
  // list_templates
  // ===========================================================================
  server.tool(
    "list_templates",
    "List all templates with pagination.",
    {
      bookmark: z.string().optional().describe("Pagination cursor from previous request"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
        const result = await client.listTemplates(params);
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
  // get_template
  // ===========================================================================
  server.tool(
    "get_template",
    "Retrieve a single template by its ID. Useful for examining template structure before creating cards.",
    {
      id: z.string().describe("Template ID to retrieve"),
    },
    async ({ id }) => {
      try {
        const client = getMochiClient();
        const result = await client.getTemplate(id);
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
  // create_template
  // ===========================================================================
  server.tool(
    "create_template",
    "Create a new template for cards. Use field placeholders like << Field name >> in content.",
    {
      name: z.string().min(1).max(64).describe("Template name (1-64 characters)"),
      content: z.string().describe("Markdown content with field placeholders like << Field name >>"),
      pos: z.string().optional().describe("Relative position for sorting"),
      fields: TemplateFieldsSchema.describe("Map of field IDs to field definitions"),
      style: TemplateStyleSchema.optional().describe("Styling options"),
      options: TemplateOptionsSchema.optional().describe("Template-level options"),
    },
    async (params) => {
      try {
        const client = getMochiClient();
        const result = await client.createTemplate(params);
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
