# EmDash CMS & MCP Integration

Setup EmDash MCP server for AI agent integration. Enable autonomous content management via MCP protocol.

## Architecture

- **EmDash CMS**: Cloudflare Workers deployment (`cms.tkpdevstudio.com`)
- **MCP Endpoint**: `https://cms.tkpdevstudio.com/mcp`
- **Protocol**: MCP over HTTP (remote transport, no local stdio)

## Project Structure

```
emdash-mcp/
├── agents/
│   └── .env.example      # API token placeholders (copy to .env)
├── mcp/
│   └── config.json       # MCP client config scaffold
├── docs/
│   └── emdash-mcp-tools.md
└── README.md
```

## MCP Client Config

```json
{
  "mcpServers": {
    "emdash": {
      "url": "https://cms.tkpdevstudio.com/mcp",
      "headers": {
        "Authorization": "Bearer <scoped_token>"
      }
    }
  }
}
```

## Available MCP Tools

- `get_collections` — List all content collections
- `get_entry` — Fetch a single content entry
- `create_entry` — Create new content entry
- `update_entry` — Update existing entry
- `delete_entry` — Delete entry
- `search_entries` — Full-text search across collections
- `upload_media` — Upload media asset
- `get_plugins` — List installed plugins
- `configure_plugin` — Update plugin settings
