# MCP n8n Project Saver

A tool that connects **Claude Desktop** to **n8n** via a custom MCP server, 
enabling Claude to automatically save project summaries to Google Sheets.

## How it works

1. You say "save this project" to Claude Desktop
2. Claude generates a LinkedIn post and GitHub description of what was built
3. The MCP server sends that data to an n8n webhook
4. n8n appends a new row to a Google Sheets spreadsheet

## Project Structure

| File | Purpose |
|------|---------|
| `index.js` | MCP server with two tools: `trigger_n8n_workflow` and `save_project` |
| `package.json` | Node.js dependencies |
| `Project Saver.json` | n8n workflow export (import this into your own n8n) |

## Setup

### Prerequisites
- Claude Desktop
- n8n running locally via Docker
- A Google Sheet with these columns: Date, Project Name, LinkedIn Post, GitHub Description

### 1 — Install dependencies
```bash
npm install
```

### 2 — Import the n8n workflow
- Open n8n at `http://localhost:5678`
- Click **Add workflow → Import from file**
- Select `project-saver-workflow.json`
- Connect your Google Sheets credential
- Publish the workflow

### 3 — Connect to Claude Desktop
Add this to your Claude Desktop `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "n8n-trigger": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USERNAME\\mcp-n8n\\index.js"]
    }
  }
}
```

### 4 — Use it
Start any conversation in Claude Desktop with this system prompt:
> "When I say 'save this project', generate a LinkedIn post and GitHub 
> description of what we built, then call the save_project tool."

Then just say **"save this project"** at the end of any coding session!

## Tech Stack
- Node.js
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- n8n (Docker)
- Google Sheets API
- Google Cloud OAuth2