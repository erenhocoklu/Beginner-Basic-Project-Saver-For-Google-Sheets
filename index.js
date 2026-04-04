import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ // server
  name: "n8n-trigger",
  version: "1.0.0"
});

server.tool( // trigger n8n workflow
  "trigger_n8n_workflow",
  "Triggers an n8n workflow via webhook",
  {
    message: z.string().describe("A message to send to n8n")
  },
  async ({ message }) => {
    const response = await fetch("http://localhost:5678/webhook-test/717faef3-7a52-4cd5-a095-e0f6d1647055", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const text = await response.text();
    return {
      content: [{ type: "text", text: `n8n responded: ${text}` }]
    };
  }
);

server.tool( // saves projects
  "save_project",
  "Saves a project summary to Google Sheets. Call this when the user says 'save this project'.",
  {
    projectName: z.string().describe("Short name of the project, e.g. 'Weather Dashboard App'"),
    linkedinPost: z.string().describe("A ready-to-post LinkedIn update about what was built (2-4 paragraphs)"),
    githubDescription: z.string().describe("A concise GitHub repo description (1-2 sentences, technical)")
  },
  async ({ projectName, linkedinPost, githubDescription }) => {
    const response = await fetch("http://localhost:5678/webhook/project-saver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName, linkedinPost, githubDescription })
    });

    if (!response.ok) {
      return { content: [{ type: "text", text: `Error: n8n returned status ${response.status}` }] };
    }

    return {
      content: [{
        type: "text",
        text: `Project "${projectName}" saved to Google Sheets! Check your sheet for the LinkedIn post and GitHub description.`
      }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

// creates an mcp server n8n trigger