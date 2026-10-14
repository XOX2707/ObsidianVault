import { readTool } from "./read.js";
import { writeTool } from "./write.js";
import { editTool } from "./edit.js";
import { bashTool } from "./bash.js";
import { grepTool } from "./grep.js";
import { globTool } from "./glob.js";
import { webSearchTool } from "./webSearch.js";
import { webFetchTool } from "./webFetch.js";
import { setThinkingTool } from "./setThinking.js";
import { todoReadTool, todoWriteTool } from "./todo.js";
import { taskTool } from "./task.js";
const BASE_TOOLS = [
    readTool,
    writeTool,
    editTool,
    bashTool,
    grepTool,
    globTool,
    webSearchTool,
    webFetchTool,
    setThinkingTool,
    todoReadTool,
    todoWriteTool,
    taskTool,
];
export const ALL_TOOLS = [...BASE_TOOLS];
const TOOL_MAP = new Map(ALL_TOOLS.map((t) => [t.name, t]));
export function registerExternalTools(tools) {
    for (const tool of tools) {
        const existingIndex = ALL_TOOLS.findIndex((candidate) => candidate.name === tool.name);
        if (existingIndex === -1)
            ALL_TOOLS.push(tool);
        else
            ALL_TOOLS[existingIndex] = tool;
        TOOL_MAP.set(tool.name, tool);
    }
}
export function clearExternalTools(prefix = "mcp__") {
    for (let index = ALL_TOOLS.length - 1; index >= 0; index--) {
        if (ALL_TOOLS[index].name.startsWith(prefix)) {
            TOOL_MAP.delete(ALL_TOOLS[index].name);
            ALL_TOOLS.splice(index, 1);
        }
    }
}
export function getTool(name) {
    return TOOL_MAP.get(name);
}
/** Convert our tool definitions into the OpenAI function-calling schema. */
export function toOpenAITools() {
    return ALL_TOOLS.map((tool) => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
        },
    }));
}
//# sourceMappingURL=index.js.map