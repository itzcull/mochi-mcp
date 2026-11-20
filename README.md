# mochi-mcp

MCP server for the [Mochi Cards](https://mochi.cards) API. Enables AI assistants to manage flashcards, decks, and templates through the Model Context Protocol.

See the [official Mochi API reference](https://mochi.cards/docs/api/).

## API operations

The operations below follow the [official Mochi API reference](https://mochi.cards/docs/api/). An operation heading ending in **(TODO)** is not implemented. All currently documented operations are implemented.

### Cards

#### Create a card

- API: `POST /cards/`
- MCP tool: `create_card`

#### Retrieve a card

- API: `GET /cards/:card-id`
- MCP tool: `get_card`

#### List cards

- API: `GET /cards/`
- MCP tool: `list_cards`

#### Update a card

- API: `POST /cards/:card-id`
- MCP tool: `update_card`

#### Delete a card

- API: `DELETE /cards/:card-id`
- MCP tool: `delete_card`

#### Add an attachment

- API: `POST /cards/:card-id/attachments/:file-name`
- MCP tool: `add_attachment`

#### Delete an attachment

- API: `DELETE /cards/:card-id/attachments/:file-name`
- MCP tool: `delete_attachment`

### Decks

#### Create a deck

- API: `POST /decks/`
- MCP tool: `create_deck`

#### Retrieve a deck

- API: `GET /decks/:deck-id`
- MCP tool: `get_deck`

#### List all decks

- API: `GET /decks/`
- MCP tool: `list_decks`

#### Update a deck

- API: `POST /decks/:deck-id`
- MCP tool: `update_deck`

#### Delete a deck

- API: `DELETE /decks/:deck-id`
- MCP tool: `delete_deck`

### Templates

#### Create a template

- API: `POST /templates/`
- MCP tool: `create_template`

#### Retrieve a template

- API: `GET /templates/:id`
- MCP tool: `get_template`

#### List all templates

- API: `GET /templates/`
- MCP tool: `list_templates`

### Due cards

#### Get all due cards

- API: `GET /due/`
- API by deck: `GET /due/:deck-id`
- MCP tool: `get_due_cards`

## Requirements

- Node.js 26 or later

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
      "command": "npx",
      "args": ["-y", "@itzcull/mochi-mcp"],
      "env": {
        "MOCHI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Development

This project uses Node.js 26 and npm, as set in `devEngines` in `package.json`. Node runs the TypeScript source directly, so development needs no build step.

```bash
# Install dependencies
npm install

# Run with restart on file changes
MOCHI_API_KEY=your-api-key-here npm run dev

# Run once
MOCHI_API_KEY=your-api-key-here npm start

# Type-check
npm run typecheck

# Compile to dist/, which is what the npm package ships
npm run build
```

## License

MIT
