export const tools = [
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