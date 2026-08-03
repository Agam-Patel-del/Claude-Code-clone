import OpenAI from "openai";
import dotenv from "dotenv";
import fs, { read } from "fs";
import { log } from "console";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

dotenv.config({ quiet: true });

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const messages = [
    {
      role: "user",
      content: prompt
    }
  ];
  const tools = [
    {
      type: "function",
      function: {
        name: "Read",
        description: "Read and return the contents of the file",
        parameters: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "The path to the file to read",
            }
          },
          required: ["file_path"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "Write",
        description: "Write contents in a file",
        parameters: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "The path of file in which it is to write"
            },
            content: {
              type: "string",
              description: "The content to write in a file"
            }
          },
          required: ["file_path", "content"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "Bash",
        description: "Execute the bash commands",
        parameters: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The bash command to execute"
            }
          },
          required: ["command"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "List",
        description: "To list files in a directory",
        parameters: {
          type: "object",
          properties: {
            dir_path: {
              type: "string",
              description: "The path of directory to list"
            }
          },
          required: ["dir_path"]
        }
      }
    }
  ]

  while (1) {
    const response = await client.chat.completions.create({
      model: "anthropic/claude-haiku-4.5",
      messages,
      max_tokens: 512,
      tools
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }

    const choice = response.choices[0];
    const message = choice.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];

      messages.push(message);

      let result;
      if (toolCall.function.name === "Read") {
        const args = JSON.parse(toolCall.function.arguments);
        result = fs.readFileSync(args.file_path, "utf-8");
      }
      else if (toolCall.function.name === "Write") {
        const args = JSON.parse(toolCall.function.arguments);
        fs.writeFileSync(args.file_path, args.content);
        result = `Successfully wrote the content in the file ${args.file_path}`;
      }
      else if (toolCall.function.name === "Bash") {
        const args = JSON.parse(toolCall.function.arguments);
        try {
          const { stdout, stderr } = await execAsync(args.command);
          result = stdout || stderr || "(no output)";
        } catch (err) {
          result = `Error: ${err.message}`;
        }
      }
      else if (toolCall.function.name === "List") {
        const args = JSON.parse(toolCall.function.arguments);
        const entries = fs.readdirSync(args.dir_path);
        result = entries.join("\n");
        console.log(result);
      }
      

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result
      })
    }
    else {
      console.log(message.content);
      break;
    }
  }
}

main();
