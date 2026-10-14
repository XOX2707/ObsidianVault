import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { findProjectRoot } from "./project.js";
/** Events whose hooks can abort the action when they fail (and continueOnError is not set). */
const BLOCKING_EVENTS = new Set(["preToolUse", "userPromptSubmit"]);
export function hooksPath(cwd) {
    return path.join(findProjectRoot(cwd), ".deepseek", "hooks.json");
}
export function createHooksTemplate(cwd) {
    const file = hooksPath(cwd);
    if (fs.existsSync(file))
        return { path: file, created: false };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const template = {
        preToolUse: [
            {
                command: "echo preToolUse:$DEEPSEEK_TOOL_NAME",
                timeoutMs: 10000,
                continueOnError: true,
            },
        ],
        postToolUse: [
            {
                command: "echo postToolUse:$DEEPSEEK_TOOL_NAME:$DEEPSEEK_TOOL_STATUS",
                timeoutMs: 10000,
                continueOnError: true,
            },
        ],
    };
    fs.writeFileSync(file, JSON.stringify(template, null, 2) + "\n", "utf8");
    return { path: file, created: true };
}
const HOOK_EVENTS = ["preToolUse", "postToolUse", "userPromptSubmit", "sessionStart", "stop"];
export function loadHooks(cwd) {
    const file = hooksPath(cwd);
    try {
        if (!fs.existsSync(file))
            return {};
        const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
        const config = {};
        for (const event of HOOK_EVENTS) {
            const list = parsed[event];
            config[event] = Array.isArray(list) ? list.filter(isHookSpec) : [];
        }
        return config;
    }
    catch {
        return {};
    }
}
function isHookSpec(value) {
    return !!value && typeof value === "object" && typeof value.command === "string" && Boolean(value.command.trim());
}
export function runHooks(event, cwd, context) {
    const config = loadHooks(cwd);
    const hooks = config[event] ?? [];
    const results = [];
    for (const hook of hooks) {
        const command = hook.command.trim();
        const blocking = BLOCKING_EVENTS.has(event) && hook.continueOnError !== true;
        try {
            const output = execSync(command, {
                cwd,
                encoding: "utf8",
                shell: process.env.SHELL || "/bin/sh",
                timeout: Math.min(Math.max(hook.timeoutMs ?? 30000, 1000), 600000),
                maxBuffer: 1024 * 1024,
                env: {
                    ...process.env,
                    DEEPSEEK_HOOK_EVENT: event,
                    DEEPSEEK_TOOL_NAME: context.toolName ?? "",
                    DEEPSEEK_TOOL_PREVIEW: context.preview ?? "",
                    DEEPSEEK_TOOL_STATUS: context.status ?? "",
                    DEEPSEEK_PROMPT: context.prompt ?? "",
                },
            });
            results.push({ command, ok: true, output: output.trim(), blocking });
        }
        catch (err) {
            const e = err;
            const output = [e.stdout, e.stderr, e.message].filter(Boolean).map(String).join("\n").trim();
            results.push({ command, ok: false, output, blocking });
            if (blocking)
                break;
        }
    }
    return results;
}
//# sourceMappingURL=hooks.js.map