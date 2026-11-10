import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// webhook URLs come from .env next to this file (gitignored), never from the code
try { process.loadEnvFile(new URL(".env", import.meta.url)); } catch {}
const webhook = (name) => {
  const url = process.env[name];
  if (!url) throw new Error(`${name} is not set`);
  return url;
};

const server = new McpServer({ // server
  name: "n8n-trigger",
  version: "1.0.0"
});

server.tool( // send telegram message
  "send_telegram_text",
  "Send a Telegram text to me",
  {
    message: z.string().describe("A message to send via n8n with Telegram")
  },
  async ({ message }) => {
    const response = await fetch(webhook("N8N_TELEGRAM_WEBHOOK_URL"), {
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
    const response = await fetch(webhook("N8N_PROJECT_SAVER_WEBHOOK_URL"), {
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

server.tool( // ask opus
  "ask_opus",
  "Consult Claude Opus for complex problems that require deeper reasoning. Use this when you hit a hard problem.",
  {
    question: z.string().describe("The question or problem to send to Opus")
  },
  async ({ question }) => {
    const response = await fetch(webhook("N8N_ASK_OPUS_WEBHOOK_URL"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const text = await response.text();
    return {
      content: [{ type: "text", text: `Opus responded: ${text}` }]
    };
  }
);

server.tool(
  "generate_handoff_prompt",
  "Generate a structured handoff prompt for starting a new Claude chat with full project context. Type the prompt in the chat. Call this when the user wants to carry context to a new session.",
  {
    projectName: z.string().describe("Name of the project or workstream"),
    whatWeDid: z.array(z.string()).describe("List of things accomplished so far"),
    currentProblems: z.array(z.string()).optional().describe("Open bugs, blockers, or unresolved issues"),
    nextSteps: z.array(z.string()).describe("Immediate action items"),
    futureGoals: z.array(z.string()).optional().describe("Longer-term goals beyond immediate next steps"),
    rules: z.array(z.string()).optional().describe("Chat rules or conventions established during the session"),
    techStack: z.array(z.string()).optional().describe("Key technologies, frameworks, or services in use"),
    additionalContext: z.string().optional().describe("Any extra context that doesn't fit other fields")
  },
  async ({ projectName, whatWeDid, currentProblems, nextSteps, futureGoals, rules, techStack, additionalContext }) => {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const section = (title, items) => {
      if (!items || items.length === 0) return "";
      return `## ${title}\n${items.map(i => `- ${i}`).join("\n")}\n\n`;
    };

    let prompt = `# Session Handoff - ${projectName}\nGenerated: ${timestamp}\n\n`;
    prompt += section("What We Did", whatWeDid);
    prompt += section("Current Problems", currentProblems);
    prompt += section("Next Steps", nextSteps);
    prompt += section("Future Goals", futureGoals);
    prompt += section("Tech Stack", techStack);
    prompt += section("Rules for This Chat", rules);

    if (additionalContext) {
      prompt += `## Additional Context\n${additionalContext}\n\n`;
    }

    prompt += "---\nRead the above carefully. Confirm you understand the current state, then let's continue from where we left off.";

    return {
      content: [{ type: "text", text: prompt }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

// creates an mcp server n8n trigger