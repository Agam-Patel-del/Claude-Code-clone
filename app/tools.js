export const tools = [
  // read
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

  // write
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

  // bash
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

  // list
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
  },

  // edit
  {
    type: "function",
    function: {
      name: "Edit",
      description: "Edit a file by replacing an old string with a new string",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The path to the file to edit"
          },
          old_string: {
            type: "string",
            description: "The exact string to be replaced"
          },
          new_string: {
            type: "string",
            description: "The new string to replace the old string with"
          }
        },
        required: ["file_path", "old_string", "new_string"]
      }
    }
  },

  // search
  {
    type: "function",
    function: {
      name: "Search",
      description: "Search for a string or regex pattern in a directory",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The string or regex pattern to search for"
          },
          dir_path: {
            type: "string",
            description: "The directory path to search in (use '.' for current directory)"
          }
        },
        required: ["query", "dir_path"]
      }
    }
  }
]