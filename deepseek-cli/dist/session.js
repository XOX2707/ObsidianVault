import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
const SESSIONS_DIR = path.join(os.homedir(), ".deepseek-cli", "sessions");
function sessionPath(cwd) {
    const hash = crypto.createHash("sha256").update(path.resolve(cwd)).digest("hex").slice(0, 16);
    return path.join(SESSIONS_DIR, `${hash}.json`);
}
export function loadSession(cwd) {
    try {
        const file = sessionPath(cwd);
        if (!fs.existsSync(file))
            return null;
        const raw = fs.readFileSync(file, "utf8");
        const data = JSON.parse(raw);
        // Basic validation.
        if (!data || !Array.isArray(data.messages))
            return null;
        return {
            messages: data.messages,
            totalUsage: data.totalUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            contextSummary: typeof data.contextSummary === "string" ? data.contextSummary : null,
            compressedAt: typeof data.compressedAt === "string" ? data.compressedAt : null,
            todos: Array.isArray(data.todos) ? data.todos : [],
        };
    }
    catch {
        return null;
    }
}
export function saveSession(cwd, data) {
    try {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
        fs.writeFileSync(sessionPath(cwd), JSON.stringify(data, null, 2), "utf8");
    }
    catch {
        // Silently ignore save errors — don't break the UX.
    }
}
export function deleteSession(cwd) {
    try {
        const file = sessionPath(cwd);
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            return true;
        }
        return false;
    }
    catch {
        return false;
    }
}
export function sessionsDir() {
    return SESSIONS_DIR;
}
//# sourceMappingURL=session.js.map