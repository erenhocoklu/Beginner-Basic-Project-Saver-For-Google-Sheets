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
    projectName: z.string().describe("Short name of the project in English"),
    linkedinPost: z.string().describe("Formal LinkedIn post in English"),
    githubDescription: z.string().describe("Technical GitHub description in English"),
    projectNameTR: z.string().describe("Project name translated into Turkish"),
    linkedinPostTR: z.string().describe("Formal LinkedIn post translated into Turkish"),
    githubDescriptionTR: z.string().describe("Technical GitHub description translated into Turkish")
  },
  async ({projectName, linkedinPost, githubDescription, projectNameTR, linkedinPostTR, githubDescriptionTR}) => {
    const response = await fetch("http://localhost:5678/webhook/project-saver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({projectName, linkedinPost, githubDescription, projectNameTR, linkedinPostTR, githubDescriptionTR})
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