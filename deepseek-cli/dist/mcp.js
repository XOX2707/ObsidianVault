import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findProjectRoot } from "./project.js";
const CONFIG_DIR = path.join(os.homedir(), ".deepseek-cli");
const GLOBAL_MCP_PATH = path.join(CONFIG_DIR, "mcp.json");
const PROTOCOL_VERSION = "2024-11-05";
const DEFAULT_TIMEOUT_MS = 30_000;
let loadedInfos = [];
let loadedErrors = [];
const clients = new Map();
export function globalMcpPath() {
    return GLOBAL_MCP_PATH;
}
export function projectMcpPath(cwd) {
    return path.join(findProjectRoot(cwd), ".deepseek", "mcp.json");
}
export function claudeMcpPath(cwd) {
    return path.join(findProjectRoot(cwd), ".mcp.json");
}
export function mcpStatus() {
    return { infos: [...loadedInfos], errors: [...loadedErrors] };
}
export function createMcpTemplate(cwd, scope = "project") {
    const file = scope === "global" ? GLOBAL_MCP_PATH : projectMcpPath(cwd);
    if (fs.existsSync(file))
        return { path: file, created: false };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const template = {
        servers: {
            // Replace this with a real MCP stdio server.
            example: {
                command: "node",
                args: ["/absolute/path/to/mcp-server.js"],
                disabled: true,
            },
        },
    };
    fs.writeFileSync(file, JSON.stringify(template, null, 2) + "\n", "utf8");
    return { path: file, created: true };
}
function readJson(file) {
    try {
        if (!fs.existsSync(file))
            return {};
        const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
        return parsed && typeof parsed === "object" ? parsed : {};
    }
    catch {
        return {};
    }
}
function serversFromConfig(config) {
    return { ...(config.mcpServers ?? {}), ...(config.servers ?? {}) };
}
function loadConfig(cwd) {
    const root = findProjectRoot(cwd);
    const globalConfig = serversFromConfig(readJson(GLOBAL_MCP_PATH));
    const claudeProjectConfig = serversFromConfig(readJson(path.join(root, ".mcp.json")));
    const projectConfig = serversFromConfig(readJson(projectMcpPath(cwd)));
    return { ...globalConfig, ...claudeProjectConfig, ...projectConfig };
}
function sanitizeToolPart(value) {
    return value.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "tool";
}
function mcpToolName(serverName, remoteName) {
    return `mcp__${sanitizeToolPart(serverName)}__${sanitizeToolPart(remoteName)}`.slice(0, 64);
}
function textFromMcpResult(result) {
    const content = result?.content;
    if (Array.isArray(content)) {
        return content.map((item) => {
            if (!item || typeof item !== "object")
                return String(item);
            const record = item;
            if (typeof record.text === "string")
                return record.text;
            if (typeof record.data === "string")
                return record.data;
            return JSON.stringify(record);
        }).join("\n");
    }
    if (typeof content === "string")
        return content;
    if (result === undefined)
        return "";
    return JSON.stringify(result, null, 2);
}
class McpStdioClient {
    serverName;
    config;
    baseCwd;
    child = null;
    nextId = 1;
    buffer = "";
    pending = new Map();
    initialized = false;
    constructor(serverName, config, baseCwd) {
        this.serverName = serverName;
        this.config = config;
        this.baseCwd = baseCwd;
    }
    timeoutMs() {
        return Math.min(Math.max(this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS, 1000), 600_000);
    }
    start() {
        if (this.child)
            return;
        if (!this.config.command)
            throw new Error(`MCP server ${this.serverName} has no command.`);
        const cwd = this.config.cwd ? path.resolve(this.baseCwd, this.config.cwd) : this.baseCwd;
        this.child = spawn(this.config.command, this.config.args ?? [], {
            cwd,
            env: { ...process.env, ...(this.config.env ?? {}) },
            stdio: ["pipe", "pipe", "pipe"],
        });
        this.child.stdout.setEncoding("utf8");
        this.child.stdout.on("data", (chunk) => this.onData(chunk));
        this.child.stderr.setEncoding("utf8");
        this.child.on("exit", () => {
            this.child = null;
            this.initialized = false;
            for (const [, pending] of this.pending) {
                clearTimeout(pending.timer);
                pending.reject(new Error(`MCP server ${this.serverName} exited.`));
            }
            this.pending.clear();
        });
    }
    onData(chunk) {
        this.buffer += chunk;
        while (true) {
            const newline = this.buffer.indexOf("\n");
            if (newline === -1)
                return;
            const raw = this.buffer.slice(0, newline).trim();
            this.buffer = this.buffer.slice(newline + 1);
            if (!raw)
                continue;
            let message;
            try {
                message = JSON.parse(raw);
            }
            catch {
                continue;
            }
            if (message.id === undefined)
                continue;
            const id = Number(message.id);
            const pending = this.pending.get(id);
            if (!pending)
                continue;
            this.pending.delete(id);
            clearTimeout(pending.timer);
            if (message.error) {
                pending.reject(new Error(message.error.message ?? `MCP error ${message.error.code ?? "unknown"}`));
            }
            else {
                pending.resolve(message.result);
            }
        }
    }
    request(method, params) {
        this.start();
        const child = this.child;
        if (!child)
            return Promise.reject(new Error(`Could not start MCP server ${this.serverName}.`));
        const id = this.nextId++;
        const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`MCP request timed out: ${this.serverName}.${method}`));
            }, this.timeoutMs());
            this.pending.set(id, { resolve, reject, timer });
            child.stdin.write(payload, "utf8");
        });
    }
    notify(method, params) {
        this.start();
        this.child?.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n", "utf8");
    }
    async initialize() {
        if (this.initialized)
            return;
        await this.request("initialize", {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: "deepseek-cli", version: "0.1.0" },
        });
        this.notify("notifications/initialized");
        this.initialized = true;
    }
    async listTools() {
        await this.initialize();
        const result = await this.request("tools/list", {});
        const tools = result?.tools;
        return Array.isArray(tools) ? tools.filter((tool) => {
            return !!tool && typeof tool.name === "string";
        }) : [];
    }
    async callTool(name, args) {
        await this.initialize();
        const result = await this.request("tools/call", { name, arguments: args });
        return textFromMcpResult(result);
    }
    shutdown() {
        this.child?.kill();
        this.child = null;
    }
}
/** Parse one or more SSE `data:` blocks and return the JSON-RPC message for `id`. */
function parseSseJson(text, id) {
    const candidates = [];
    for (const block of text.split(/\r?\n\r?\n/)) {
        const data = block
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");
        if (!data)
            continue;
        try {
            candidates.push(JSON.parse(data));
        }
        catch {
            // ignore non-JSON event payloads
        }
    }
    if (id !== undefined) {
        const matched = candidates.find((c) => Number(c.id) === Number(id));
        if (matched)
            return matched;
    }
    return candidates.find((c) => c.result !== undefined || c.error !== undefined) ?? candidates[0] ?? null;
}
/** MCP client over Streamable HTTP (POST JSON-RPC; JSON or SSE responses). */
class McpHttpClient {
    serverName;
    url;
    headers;
    timeoutMs;
    sessionId = null;
    nextId = 1;
    initialized = false;
    constructor(serverName, url, headers, timeoutMs) {
        this.serverName = serverName;
        this.url = url;
        this.headers = headers;
        this.timeoutMs = timeoutMs;
    }
    async rpc(method, params, isNotification = false) {
        const id = isNotification ? undefined : this.nextId++;
        const payload = isNotification
            ? { jsonrpc: "2.0", method, params }
            : { jsonrpc: "2.0", id, method, params };
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        let res;
        try {
            res = await fetch(this.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json, text/event-stream",
                    ...(this.sessionId ? { "Mcp-Session-Id": this.sessionId } : {}),
                    ...this.headers,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
        }
        finally {
            clearTimeout(timer);
        }
        const sid = res.headers.get("mcp-session-id");
        if (sid)
            this.sessionId = sid;
        if (isNotification) {
            await res.text().catch(() => "");
            return undefined;
        }
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} ${body.slice(0, 200)}`.trim());
        }
        const contentType = res.headers.get("content-type") ?? "";
        const text = await res.text();
        const message = contentType.includes("text/event-stream")
            ? parseSseJson(text, id)
            : JSON.parse(text);
        if (!message)
            throw new Error(`No JSON-RPC response for ${method}`);
        if (message.error) {
            throw new Error(message.error.message ?? `MCP error ${message.error.code ?? "unknown"}`);
        }
        return message.result;
    }
    async initialize() {
        if (this.initialized)
            return;
        await this.rpc("initialize", {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: "deepseek-cli", version: "0.1.0" },
        });
        await this.rpc("notifications/initialized", undefined, true);
        this.initialized = true;
    }
    async listTools() {
        await this.initialize();
        const result = await this.rpc("tools/list", {});
        const tools = result?.tools;
        return Array.isArray(tools)
            ? tools.filter((tool) => !!tool && typeof tool.name === "string")
            : [];
    }
    async callTool(name, args) {
        await this.initialize();
        const result = await this.rpc("tools/call", { name, arguments: args });
        return textFromMcpResult(result);
    }
    shutdown() {
        // Stateless HTTP — nothing to tear down.
    }
}
function toolFromMcp(client, serverName, remote) {
    const toolName = mcpToolName(serverName, remote.name);
    const description = remote.description || `MCP tool ${remote.name} from ${serverName}`;
    const info = { toolName, serverName, remoteName: remote.name, description };
    const tool = {
        name: toolName,
        description: `[MCP:${serverName}] ${description}`,
        needsApproval: true,
        parameters: remote.inputSchema ?? { type: "object", properties: {} },
        preview(args) {
            const argText = Object.keys(args).length > 0 ? ` ${JSON.stringify(args).slice(0, 160)}` : "";
            return `mcp ${serverName}.${remote.name}${argText}`;
        },
        async run(args) {
            try {
                const output = await client.callTool(remote.name, args);
                return {
                    content: output || `(MCP ${serverName}.${remote.name} returned no content)`,
                    summary: `mcp ${serverName}.${remote.name}`,
                };
            }
            catch (err) {
                return {
                    content: `Error calling MCP tool ${serverName}.${remote.name}: ${err.message}`,
                    summary: `mcp ${serverName}.${remote.name} failed`,
                    isError: true,
                };
            }
        },
    };
    return { tool, info };
}
export async function loadMcpTools(cwd) {
    shutdownMcp();
    loadedInfos = [];
    loadedErrors = [];
    const tools = [];
    const servers = loadConfig(cwd);
    for (const [serverName, config] of Object.entries(servers)) {
        if (!config || config.disabled)
            continue;
        const isHttp = config.type === "http" || config.type === "sse" || (!!config.url && !config.command);
        let client;
        if (isHttp) {
            if (!config.url) {
                loadedErrors.push(`${serverName}: missing url for http transport`);
                continue;
            }
            const timeoutMs = Math.min(Math.max(config.timeoutMs ?? DEFAULT_TIMEOUT_MS, 1000), 600_000);
            client = new McpHttpClient(serverName, config.url, config.headers ?? {}, timeoutMs);
        }
        else {
            if (!config.command) {
                loadedErrors.push(`${serverName}: missing command (or url for http transport)`);
                continue;
            }
            client = new McpStdioClient(serverName, config, cwd);
        }
        clients.set(serverName, client);
        try {
            const remoteTools = await client.listTools();
            for (const remote of remoteTools) {
                const wrapped = toolFromMcp(client, serverName, remote);
                tools.push(wrapped.tool);
                loadedInfos.push(wrapped.info);
            }
        }
        catch (err) {
            loadedErrors.push(`${serverName}: ${err.message}`);
            client.shutdown();
            clients.delete(serverName);
        }
    }
    return { tools, infos: [...loadedInfos], errors: [...loadedErrors] };
}
export function shutdownMcp() {
    for (const client of clients.values())
        client.shutdown();
    clients.clear();
}
//# sourceMappingURL=mcp.js.map