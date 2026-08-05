import OpenAI from "openai";
import dotenv from "dotenv";
import fs, { read } from "fs";
import { log } from "console";
import { exec } from "child_process";
import { promisify } from "util";
import { tools } from "./tools.js";
import { systemMessages } from "./systemMessages.js";

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
    ...systemMessages,
    {
      role: "user",
      content: prompt
    }
  ];

  const MAX_CONSECUTIVE_ERRORS = process.env.MAX_CONSECUTIVE_ERRORS || 3;
  const MAX_TOTAL_ITERATIONS = process.env.MAX_TOTAL_ITERATIONS || 20;

  let consecutiveErrors = 0;
  let totalIterations = 0;

  while (totalIterations < MAX_TOTAL_ITERATIONS) {
    totalIterations++;
    const response = await client.chat.completions.create({
      model: "inclusionai/ling-3.0-flash:free",
      messages,
      max_tokens: 32768,
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
      let isError = false;
      try {
        if (toolCall.function.name === "Read") {
          const args = JSON.parse(toolCall.function.arguments);
          try {
            result = fs.readFileSync(args.file_path, "utf-8");
          } catch (err) {
            isError = true;
            result = `Error reading file: ${err.message}`;
          }
        } else if (toolCall.function.name === "Write") {
          const args = JSON.parse(toolCall.function.arguments);
          try {
            fs.writeFileSync(args.file_path, args.content);
            result = `Successfully wrote the content in the file ${args.file_path}`;
          } catch (err) {
            isError = true;
            result = `Error writing file: ${err.message}`;
          }
        } else if (toolCall.function.name === "Bash") {
          const args = JSON.parse(toolCall.function.arguments);
          try {
            const { stdout, stderr } = await execAsync(args.command);
            result = stdout || stderr || "(no output)";
          } catch (err) {
            isError = true;
            result = `Error: ${err.message}`;
          }
        } else if (toolCall.function.name === "List") {
          const args = JSON.parse(toolCall.function.arguments);
          try {
            const entries = fs.readdirSync(args.dir_path);
            result = entries.join("\n");
          } catch (err) {
            isError = true;
            result = `Error listing directory: ${err.message}`;
          }
        } else {
          isError = true;
          result = `Unknown tool: ${toolCall.function.name}`;
        }
      } catch (err) {
        isError = true;
        result = `Error parsing tool arguments: ${err.message}`;
      }

      if (isError) {
        consecutiveErrors++;
      } else {
        consecutiveErrors = 0;
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result
      });

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`Stopping: Exceeded maximum consecutive tool errors (${MAX_CONSECUTIVE_ERRORS}).`);
        break;
      }
    }
    else {
      console.log(message.content);
      break;
    }
  }

  if (totalIterations >= MAX_TOTAL_ITERATIONS) {
    console.error(`Stopping: Exceeded maximum total iterations (${MAX_TOTAL_ITERATIONS}).`);
  }
}

main();
