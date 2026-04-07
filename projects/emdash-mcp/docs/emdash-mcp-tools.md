# EmDash MCP Tools Reference

## Overview

EmDash MCP server exposes content management tools via the MCP protocol. Agents use these tools to autonomously manage content workflows.

**Endpoint:** `https://cms.tkpdevstudio.com/mcp`
**Transport:** HTTP (remote MCP)
**Auth:** Bearer token (scoped per agent)

---

## Tool Reference

### Content Management

#### `get_collections`
List all content collections.
```json
{ "collection": "string" }
```

#### `get_entry`
Fetch a single content entry by ID.
```json
{ "collection": "string", "id": "string" }
```

#### `create_entry`
Create a new content entry.
```json
{ "collection": "string", "data": { ... }, "locale": "string?" }
```

#### `update_entry`
Update an existing entry.
```json
{ "collection": "string", "id": "string", "data": { ... } }
```

#### `delete_entry`
Delete an entry.
```json
{ "collection": "string", "id": "string" }
```

#### `search_entries`
Full-text search across collections.
```json
{ "collection": "string", "query": "string", "limit": "number?" }
```

### Media

#### `upload_media`
Upload a media asset.
```json
{ "file": "string (base64)", "filename": "string", "mimeType": "string" }
```

### Plugins

#### `get_plugins`
List installed plugins.
```json
{}
```

#### `configure_plugin`
Update plugin settings.
```json
{ "pluginId": "string", "settings": { ... } }
```

---

## Collections

| Collection | Description |
|------------|-------------|
| `games` | Game entries for portfolio showcase |
| `case_studies` | Client case studies for marketing |
| `team_members` | Team bios and highlights |
| `blog_posts` | Dev diaries and updates |
| `media_assets` | Screenshots, videos, thumbnails |

---

## Auth

Each agent uses a scoped Bearer token. Tokens are set via `EMDASH_CONTENT_TOKEN` environment variable.

Do NOT commit tokens to version control. Use `.env` files (gitignored) for local development.
