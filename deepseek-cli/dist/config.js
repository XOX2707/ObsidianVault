import fs from "node:fs";
import os from "node:os";
import path from "node:path";
export const MODELS = [
    {
        id: "deepseek-v4-pro",
        label: "DeepSeek-V4 Pro",
        supportsTools: true,
        description: "Flagship V4 model. Best for complex coding, reasoning, and agentic work.",
    },
    {
        id: "deepseek-v4-flash",
        label: "DeepSeek-V4 Flash",
        supportsTools: true,
        description: "Fast and cost-efficient V4 model for everyday coding tasks.",
    },
];
export const DEFAULT_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_MODEL = "deepseek-v4-pro";
export function normalizeThinkingMode(value) {
    const v = String(value ?? "").trim().toLowerCase();
    if (v === "off" || v === "hide" || v === "none")
        return "off";
    if (v === "collapsed" || v === "short" || v === "fold")
        return "collapsed";
    if (v === "full" || v === "on" || v === "show" || v === "all")
        return "full";
    return undefined;
}
const LEGACY_MODEL_ALIASES = {
    "deepseek-chat": DEFAULT_MODEL,
    "deepseek-reasoner": DEFAULT_MODEL,
};
/** Mask a secret for display, e.g. "sk-86214…bd47" → "sk-86…bd47". */
export function maskKey(key) {
    const k = (key ?? "").trim();
    if (!k)
        return "";
    if (k.length <= 10)
        return k.slice(0, 2) + "…" + k.slice(-2);
    return k.slice(0, 5) + "…" + k.slice(-4);
}
/** The conventional name used when the env var supplies the key. */
export const ENV_KEY_NAME = "env";
const CONFIG_DIR = path.join(os.homedir(), ".deepseek-cli");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
const DEFAULTS = {
    baseURL: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
    alwaysAllow: [],
    thinkingMode: "off",
};
export function loadConfig() {
    let fileConfig = {};
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
        }
    }
    catch {
        // Corrupt config: fall back to defaults rather than crashing.
    }
    const savedThinkingMode = normalizeThinkingMode(fileConfig.thinkingMode);
    const thinkingModeConfigured = fileConfig.thinkingModeConfigured === true;
    const config = {
        ...DEFAULTS,
        ...fileConfig,
        alwaysAllow: fileConfig.alwaysAllow ?? [],
        thinkingMode: thinkingModeConfigured ? (savedThinkingMode ?? DEFAULTS.thinkingMode) : DEFAULTS.thinkingMode,
        thinkingModeConfigured,
    };
    // Normalize the profile map and migrate any legacy single key into it.
    const apiKeys = { ...(fileConfig.apiKeys ?? {}) };
    if (fileConfig.apiKey && Object.keys(apiKeys).length === 0) {
        apiKeys.default = { key: fileConfig.apiKey };
        if (!config.activeApiKey)
            config.activeApiKey = "default";
    }
    config.apiKeys = apiKeys;
    // Drop a stale active pointer that no longer matches a profile.
    if (config.activeApiKey && !apiKeys[config.activeApiKey]) {
        config.activeApiKey = Object.keys(apiKeys)[0];
    }
    else if (!config.activeApiKey && Object.keys(apiKeys).length > 0) {
        config.activeApiKey = Object.keys(apiKeys)[0];
    }
    // Resolve the effective key from the active profile (file-based).
    config.apiKeyFromEnv = false;
    if (config.activeApiKey && apiKeys[config.activeApiKey]) {
        const profile = apiKeys[config.activeApiKey];
        config.apiKey = profile.key;
        if (profile.baseURL)
            config.baseURL = profile.baseURL;
    }
    // Environment variables take precedence over the stored file.
    if (process.env.DEEPSEEK_API_KEY) {
        config.apiKey = process.env.DEEPSEEK_API_KEY;
        config.apiKeyFromEnv = true;
    }
    if (process.env.DEEPSEEK_BASE_URL)
        config.baseURL = process.env.DEEPSEEK_BASE_URL;
    if (process.env.DEEPSEEK_MODEL)
        config.model = process.env.DEEPSEEK_MODEL;
    // DEEPSEEK_THINKING (off|collapsed|full) wins; legacy DEEPSEEK_SHOW_THINKING still honored.
    const envThinking = normalizeThinkingMode(process.env.DEEPSEEK_THINKING);
    if (envThinking) {
        config.thinkingMode = envThinking;
    }
    else if (process.env.DEEPSEEK_SHOW_THINKING) {
        const v = process.env.DEEPSEEK_SHOW_THINKING.trim().toLowerCase();
        config.thinkingMode = ["0", "false", "no", "off"].includes(v) ? "off" : "full";
    }
    config.model = LEGACY_MODEL_ALIASES[config.model] ?? config.model;
    return config;
}
export function saveConfig(config) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    const toStore = {
        baseURL: config.baseURL,
        model: config.model,
        alwaysAllow: config.alwaysAllow,
    };
    if (config.thinkingModeConfigured) {
        toStore.thinkingMode = config.thinkingMode;
        toStore.thinkingModeConfigured = true;
    }
    // Persist named key profiles (these are user-entered, never the env key).
    const profiles = config.apiKeys ?? {};
    if (Object.keys(profiles).length > 0) {
        toStore.apiKeys = profiles;
        if (config.activeApiKey && profiles[config.activeApiKey]) {
            toStore.activeApiKey = config.activeApiKey;
        }
    }
    else if (config.apiKey && !config.apiKeyFromEnv) {
        // Legacy single-key fallback when no profiles exist.
        toStore.apiKey = config.apiKey;
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(toStore, null, 2), "utf8");
}
export function configPath() {
    return CONFIG_PATH;
}
export function findModel(id) {
    return MODELS.find((m) => m.id === id);
}
//# sourceMappingURL=config.js.map