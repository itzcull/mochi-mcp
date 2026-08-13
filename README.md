# Mochi MCP Server

An MCP server for the [Mochi Cards](https://mochi.cards) API. It lets MCP clients manage cards, decks, templates, attachments, and due cards.

The server separates MCP tools from deployment adapters:

- `src/server.ts` creates a runtime-neutral MCP server.
- `src/index.ts` connects the server to local stdio transport.
- `src/http.ts` exposes an authenticated Streamable HTTP handler based on Web APIs.
- `src/worker.ts` connects Cloudflare Workers bindings to the HTTP handler.

The Streamable HTTP handler can run on any host that supports standard `Request`, `Response`, `fetch`, `Blob`, and stream APIs.

## Tools

### Cards

- `list_cards` lists cards and can filter by deck.
- `get_card` retrieves a card.
- `create_card` creates a card.
- `update_card` updates a card.
- `delete_card` permanently deletes a card.
- `add_attachment` uploads base64-encoded content to a card.
- `delete_attachment` removes an attachment from a card.

### Decks

- `list_decks` lists decks.
- `get_deck` retrieves a deck.
- `create_deck` creates a deck.
- `update_deck` updates a deck.
- `delete_deck` permanently deletes a deck.

### Templates

- `list_templates` lists templates.
- `get_template` retrieves a template.
- `create_template` creates a template.

### Due Cards

- `get_due_cards` lists cards that are due for review.

## Configuration

Every deployment needs a Mochi API key from the Mochi Cards account settings.

| Setting | Purpose |
| --- | --- |
| `MOCHI_API_KEY` | Authenticates requests to the Mochi API. |
| `MCP_AUTH_TOKEN` | Protects the remote Streamable HTTP endpoint. It is not used by stdio. |

One deployment uses one Mochi account. Keep both values secret.

## Local Stdio

Install dependencies:

```sh
bun install
```

Start the stdio server:

```sh
MOCHI_API_KEY=<mochi-api-key> bun run start
```

Configure an MCP client to run the repository entry point:

```json
{
  "mcpServers": {
    "mochi": {
      "command": "bun",
      "args": ["run", "/path/to/mochi-mcp/src/index.ts"],
      "env": {
        "MOCHI_API_KEY": "<mochi-api-key>"
      }
    }
  }
}
```

## Streamable HTTP

`createMochiHttpHandler` in `src/http.ts` accepts the Mochi API key and a deployment bearer token. It returns a standard asynchronous request handler:

```ts
const handleMcpRequest = createMochiHttpHandler({
  mochiApiKey: environment.MOCHI_API_KEY,
  authToken: environment.MCP_AUTH_TOKEN,
});

const response = await handleMcpRequest(request);
```

Mount this handler at an endpoint such as `/mcp`. MCP clients must send this header:

```http
Authorization: Bearer <mcp-auth-token>
```

The handler uses stateless Streamable HTTP. It creates a new MCP server for each request. The deployment does not need shared session storage.

## Cloudflare Workers

The included `src/worker.ts` adapter exposes `/mcp`. The included `wrangler.jsonc` contains no account, route, or domain values.

Set deployment secrets:

```sh
bunx wrangler secret put MOCHI_API_KEY
bunx wrangler secret put MCP_AUTH_TOKEN
```

Run the Worker locally by defining both values in `.dev.vars`, then start Wrangler:

```sh
bun run worker:dev
```

Deploy it:

```sh
bun run worker:deploy
```

The MCP endpoint is `https://<deployment-host>/mcp`. Configure the client to send `MCP_AUTH_TOKEN` as its bearer token.

## Attachments

Remote deployments cannot read files from an MCP client's local file system. The `add_attachment` tool therefore accepts:

- `card-id`: target card ID.
- `filename`: attachment filename.
- `content`: base64-encoded file content.
- `media-type`: optional media type such as `image/png`.

Base64 increases request size by about one third. The deployment host and MCP client can impose lower request limits than the Mochi API.

## Development

```sh
bun run test
bun run typecheck
```

## License

MIT
