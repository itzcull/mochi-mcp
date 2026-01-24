import { z } from "zod";

// =============================================================================
// Common Schemas
// =============================================================================

export const PaginatedRequestSchema = z.object({
  bookmark: z.string().optional().describe("Cursor for pagination from previous request"),
  limit: z.number().min(1).max(100).optional().describe("Number of items per page (1-100, default 10)"),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(docsSchema: T) =>
  z.object({
    bookmark: z.string().optional(),
    docs: z.array(docsSchema),
  });

export const TimestampSchema = z.object({
  date: z.string(),
});

// =============================================================================
// Card Schemas
// =============================================================================

export const CardFieldValueSchema = z.object({
  id: z.string().describe("Field ID (should match the key)"),
  value: z.string().describe("Field value"),
});

export const CardFieldsSchema = z.record(z.string(), CardFieldValueSchema);

export const CreateCardInputSchema = z.object({
  content: z.string().describe("Markdown content of the card"),
  "deck-id": z.string().describe("ID of the deck this card belongs to"),
  "template-id": z.string().optional().describe("ID of the template to use"),
  "archived?": z.boolean().optional().describe("Whether the card is archived"),
  "review-reverse?": z.boolean().optional().describe("Review in reverse order (bottom to top)"),
  pos: z.string().optional().describe("Relative position within deck (lexicographic sorting)"),
  "manual-tags": z.array(z.string()).optional().describe("Tags without the # prefix"),
  fields: CardFieldsSchema.optional().describe("Map of field IDs to field values"),
});

export const UpdateCardInputSchema = z.object({
  id: z.string().describe("Card ID to update"),
  content: z.string().optional().describe("Markdown content of the card"),
  "deck-id": z.string().optional().describe("ID of the deck this card belongs to"),
  "template-id": z.string().optional().describe("ID of the template to use"),
  "archived?": z.boolean().optional().describe("Whether the card is archived"),
  "trashed?": z.string().optional().describe("ISO 8601 timestamp if trashed, or omit to untrash"),
  "review-reverse?": z.boolean().optional().describe("Review in reverse order"),
  pos: z.string().optional().describe("Relative position within deck"),
  "manual-tags": z.array(z.string()).optional().describe("Tags without the # prefix"),
  fields: CardFieldsSchema.optional().describe("Map of field IDs to field values"),
});

export const CardReviewSchema = z.object({
  date: TimestampSchema.optional(),
  due: TimestampSchema.optional(),
  "remembered?": z.boolean().optional(),
});

export const CardSchema = z.object({
  id: z.string(),
  content: z.string(),
  name: z.string().nullable().optional(),
  "deck-id": z.string(),
  "template-id": z.string().nullable().optional(),
  pos: z.string().optional(),
  tags: z.array(z.string()).optional(),
  "manual-tags": z.array(z.string()).optional(),
  fields: CardFieldsSchema.optional(),
  references: z.array(z.string()).optional(),
  reviews: z.array(CardReviewSchema).optional(),
  "created-at": TimestampSchema.optional(),
  "updated-at": TimestampSchema.optional(),
  "new?": z.boolean().optional(),
  "archived?": z.boolean().optional(),
  "trashed?": z.union([z.string(), TimestampSchema]).optional(),
  attachments: z.record(z.string(), z.unknown()).optional(),
});

export const ListCardsInputSchema = PaginatedRequestSchema.extend({
  "deck-id": z.string().optional().describe("Filter cards by deck ID"),
});

export const GetCardInputSchema = z.object({
  id: z.string().describe("Card ID to retrieve"),
});

export const DeleteCardInputSchema = z.object({
  id: z.string().describe("Card ID to delete"),
});

export const AddAttachmentInputSchema = z.object({
  "card-id": z.string().describe("Card ID to attach file to"),
  "file-path": z.string().describe("Local file path to upload"),
  filename: z.string().optional().describe("Filename to use in Mochi (defaults to original filename)"),
});

export const DeleteAttachmentInputSchema = z.object({
  "card-id": z.string().describe("Card ID"),
  filename: z.string().describe("Filename of attachment to delete"),
});

// =============================================================================
// Deck Schemas
// =============================================================================

export const SortBySchema = z.enum([
  "none",
  "lexigraphically",
  "lexicographically",
  "created-at",
  "updated-at",
  "retention-rate-asc",
  "interval-length",
]);

export const CardsViewSchema = z.enum(["list", "grid", "note", "column"]);

export const CreateDeckInputSchema = z.object({
  name: z.string().describe("Name of the deck"),
  "parent-id": z.string().optional().describe("ID of parent deck for nesting"),
  sort: z.number().optional().describe("Numeric sort order"),
  "archived?": z.boolean().optional().describe("Whether the deck is archived"),
  "trashed?": z.string().optional().describe("ISO 8601 timestamp if trashed"),
  "sort-by": SortBySchema.optional().describe("Card sorting method on deck page"),
  "cards-view": CardsViewSchema.optional().describe("Card display mode"),
  "show-sides?": z.boolean().optional().describe("Show all sides of cards"),
  "sort-by-direction": z.boolean().optional().describe("Reverse sort order when true"),
  "review-reverse?": z.boolean().optional().describe("Review cards in reverse order"),
});

export const UpdateDeckInputSchema = z.object({
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
});

export const DeckSchema = z.object({
  id: z.string(),
  name: z.string(),
  "parent-id": z.string().nullable().optional(),
  sort: z.number().optional(),
  "archived?": z.boolean().optional(),
  "trashed?": z.union([z.string(), TimestampSchema]).optional(),
  "sort-by": z.string().optional(),
  "cards-view": z.string().optional(),
  "show-sides?": z.boolean().optional(),
  "sort-by-direction": z.boolean().optional(),
  "review-reverse?": z.boolean().optional(),
});

export const ListDecksInputSchema = PaginatedRequestSchema;

export const GetDeckInputSchema = z.object({
  id: z.string().describe("Deck ID to retrieve"),
});

export const DeleteDeckInputSchema = z.object({
  id: z.string().describe("Deck ID to delete"),
});

// =============================================================================
// Template Schemas
// =============================================================================

export const TemplateFieldTypeSchema = z.enum([
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

export const TemplateFieldOptionsSchema = z.object({
  "multi-line?": z.boolean().optional(),
  "hide-term": z.boolean().optional(),
  "ai-task": z.string().optional(),
}).passthrough();

export const TemplateFieldSchema = z.object({
  id: z.string().describe("Field ID (should match the key)"),
  name: z.string().optional().describe("Human-readable field name"),
  type: TemplateFieldTypeSchema.optional().describe("Field input type"),
  pos: z.string().optional().describe("Relative position for sorting"),
  content: z.string().optional().describe("Default content or instructions"),
  options: TemplateFieldOptionsSchema.optional().describe("Field-specific options"),
});

export const TemplateFieldsSchema = z.record(z.string(), TemplateFieldSchema);

export const TemplateStyleSchema = z.object({
  "text-alignment": z.enum(["left", "center", "right"]).optional(),
});

export const TemplateOptionsSchema = z.object({
  "show-sides-separately?": z.boolean().optional(),
});

export const CreateTemplateInputSchema = z.object({
  name: z.string().min(1).max(64).describe("Template name (1-64 characters)"),
  content: z.string().describe("Markdown content with field placeholders like << Field name >>"),
  pos: z.string().optional().describe("Relative position for sorting"),
  fields: TemplateFieldsSchema.describe("Map of field IDs to field definitions"),
  style: TemplateStyleSchema.optional().describe("Styling options"),
  options: TemplateOptionsSchema.optional().describe("Template-level options"),
});

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  pos: z.string().optional(),
  fields: TemplateFieldsSchema.optional(),
  style: TemplateStyleSchema.optional(),
  options: TemplateOptionsSchema.optional(),
});

export const ListTemplatesInputSchema = PaginatedRequestSchema;

export const GetTemplateInputSchema = z.object({
  id: z.string().describe("Template ID to retrieve"),
});

// =============================================================================
// Due Cards Schemas
// =============================================================================

export const GetDueCardsInputSchema = z.object({
  date: z.string().optional().describe("ISO 8601 date to check (defaults to today)"),
  "deck-id": z.string().optional().describe("Filter by deck ID"),
});

export const DueCardsResponseSchema = z.object({
  cards: z.array(CardSchema),
});

// =============================================================================
// Type Exports
// =============================================================================

export type Card = z.infer<typeof CardSchema>;
export type CreateCardInput = z.infer<typeof CreateCardInputSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardInputSchema>;
export type ListCardsInput = z.infer<typeof ListCardsInputSchema>;

export type Deck = z.infer<typeof DeckSchema>;
export type CreateDeckInput = z.infer<typeof CreateDeckInputSchema>;
export type UpdateDeckInput = z.infer<typeof UpdateDeckInputSchema>;
export type ListDecksInput = z.infer<typeof ListDecksInputSchema>;

export type Template = z.infer<typeof TemplateSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateInputSchema>;
export type ListTemplatesInput = z.infer<typeof ListTemplatesInputSchema>;

export type GetDueCardsInput = z.infer<typeof GetDueCardsInputSchema>;
