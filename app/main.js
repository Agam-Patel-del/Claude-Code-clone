import OpenAI from "openai";
import dotenv from "dotenv";
import fs, { read } from "fs";
import { log } from "console";

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
          type: "Object",
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
        result = fs.writeFileSync(args.file_path, args.content);
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
