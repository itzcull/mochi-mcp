# mochi-mcp

MCP server for the [Mochi Cards](https://mochi.cards) API. Enables AI assistants to manage flashcards, decks, and templates through the Model Context Protocol.

## Features

### Cards
- `list_cards` - List cards with optional filtering by deck
- `get_card` - Retrieve a single card by ID
- `create_card` - Create a new flashcard
- `update_card` - Update an existing card
- `delete_card` - Permanently delete a card
- `add_attachment` - Upload file attachments to cards
- `delete_attachment` - Remove attachments from cards

### Decks
- `list_decks` - List all decks
- `get_deck` - Retrieve a single deck by ID
- `create_deck` - Create a new deck
- `update_deck` - Update deck properties
- `delete_deck` - Permanently delete a deck

### Templates
- `list_templates` - List all templates
- `get_template` - Retrieve a template by ID
- `create_template` - Create a new card template

### Due Cards
- `get_due_cards` - Get cards due for review (spaced repetition)

## Installation

```bash
bun install
```

## Configuration

This server requires a Mochi API key. To get your API key:

1. Open the Mochi Cards app
2. Go to **Account Settings**
3. Copy your API key

Set the `MOCHI_API_KEY` environment variable when running the server.

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mochi": {
      "command": "bun",
      "args": ["run", "/path/to/mochi-mcp/src/index.ts"],
      "env": {
        "MOCHI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `/path/to/mochi-mcp` with the actual path to this repository.

## Development

```bash
# Run with hot reload
bun run dev

# Run once
bun run start
```

## License

MIT
