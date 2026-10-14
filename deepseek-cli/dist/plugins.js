import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const ROOT = path.join(os.homedir(), ".deepseek-cli");
const PLUGINS_DIR = path.join(ROOT, "plugins");
const REGISTRY_PATH = path.join(ROOT, "plugins.json");
export function pluginsDir() {
    return PLUGINS_DIR;
}
export function pluginDir(name) {
    return path.join(PLUGINS_DIR, name);
}
function loadRegistry() {
    try {
        if (fs.existsSync(REGISTRY_PATH)) {
            const parsed = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
            if (Array.isArray(parsed.plugins))
                return parsed;
        }
    }
    catch {
        // Corrupt registry: start fresh rather than crashing.
    }
    return { plugins: [] };
}
function saveRegistry(registry) {
    fs.mkdirSync(ROOT, { recursive: true });
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf8");
}
export function listPlugins() {
    return loadRegistry().plugins.slice().sort((a, b) => a.name.localeCompare(b.name));
}
export function findPlugin(name) {
    return loadRegistry().plugins.find((p) => p.name === name);
}
/** Skill directories contributed by enabled, installed plugins. */
export function enabledPluginSkillSources() {
    const sources = [];
    for (const plugin of loadRegistry().plugins) {
        if (!plugin.enabled)
            continue;
        const dir = resolveSkillsDir(pluginDir(plugin.name));
        if (dir && fs.existsSync(dir))
            sources.push({ dir, plugin: plugin.name });
    }
    return sources;
}
function isGitSource(source) {
    return (/^https?:\/\//i.test(source) ||
        /^git@/i.test(source) ||
        /^ssh:\/\//i.test(source) ||
        source.endsWith(".git"));
}
function deriveNameFromSource(source) {
    const cleaned = source.replace(/\.git$/i, "").replace(/[/\\]+$/, "");
    const base = cleaned.split(/[/\\:]/).filter(Boolean).pop() ?? "plugin";
    return base.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "plugin";
}
function readManifest(dir) {
    const candidates = [
        path.join(dir, "plugin.json"),
        path.join(dir, ".deepseek-plugin", "plugin.json"),
        path.join(dir, "deepseek-plugin.json"),
    ];
    for (const file of candidates) {
        if (!fs.existsSync(file))
            continue;
        try {
            const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
            if (parsed && typeof parsed.name === "string" && parsed.name.trim())
                return parsed;
        }
        catch {
            // try next candidate
        }
    }
    return null;
}
function resolveSkillsDir(dir) {
    const manifest = readManifest(dir);
    const rel = manifest?.skills ?? "skills";
    const resolved = path.join(dir, rel);
    return fs.existsSync(resolved) ? resolved : null;
}
function countSkillFiles(dir) {
    const skillsDir = resolveSkillsDir(dir);
    if (!skillsDir)
        return 0;
    try {
        return fs.readdirSync(skillsDir).filter((f) => f.endsWith(".md")).length;
    }
    catch {
        return 0;
    }
}
function cloneOrCopy(source, dest) {
    if (isGitSource(source)) {
        try {
            execFileSync("git", ["clone", "--depth", "1", source, dest], { stdio: "pipe" });
        }
        catch (err) {
            const detail = err instanceof Error && "stderr" in err ? String(err.stderr) : "";
            throw new Error(`git clone failed: ${detail.trim() || err.message}`);
        }
    }
    else {
        const abs = path.resolve(source);
        if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
            throw new Error(`local source is not a directory: ${source}`);
        }
        fs.cpSync(abs, dest, {
            recursive: true,
            filter: (src) => !/(^|[/\\])(\.git|node_modules)([/\\]|$)/.test(src),
        });
    }
}
export function installPlugin(source) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
    // Stage into a temp dir so we can read the manifest before committing a name.
    const tmp = path.join(PLUGINS_DIR, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    try {
        cloneOrCopy(source, tmp);
        const manifest = readManifest(tmp);
        const name = (manifest?.name ?? deriveNameFromSource(source))
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
        if (!name)
            throw new Error("could not determine a valid plugin name.");
        const registry = loadRegistry();
        if (registry.plugins.some((p) => p.name === name)) {
            throw new Error(`plugin '${name}' is already installed. Remove it first with /plugin remove ${name}.`);
        }
        const dest = pluginDir(name);
        if (fs.existsSync(dest))
            fs.rmSync(dest, { recursive: true, force: true });
        fs.renameSync(tmp, dest);
        const skillCount = countSkillFiles(dest);
        if (!manifest && skillCount === 0) {
            // Not obviously a plugin — roll back to avoid clutter.
            fs.rmSync(dest, { recursive: true, force: true });
            throw new Error("no plugin.json manifest and no skills/ found — does not look like a plugin.");
        }
        const plugin = {
            name,
            version: manifest?.version ?? "0.0.0",
            description: manifest?.description ?? "(no description)",
            source,
            installedAt: new Date().toISOString(),
            enabled: true,
        };
        registry.plugins.push(plugin);
        saveRegistry(registry);
        return { plugin, skillCount };
    }
    finally {
        if (fs.existsSync(tmp))
            fs.rmSync(tmp, { recursive: true, force: true });
    }
}
export function removePlugin(name) {
    const registry = loadRegistry();
    const index = registry.plugins.findIndex((p) => p.name === name);
    if (index === -1)
        return false;
    registry.plugins.splice(index, 1);
    saveRegistry(registry);
    const dir = pluginDir(name);
    if (fs.existsSync(dir))
        fs.rmSync(dir, { recursive: true, force: true });
    return true;
}
export function setPluginEnabled(name, enabled) {
    const registry = loadRegistry();
    const plugin = registry.plugins.find((p) => p.name === name);
    if (!plugin)
        return false;
    plugin.enabled = enabled;
    saveRegistry(registry);
    return true;
}
export function updatePlugin(name) {
    const plugin = findPlugin(name);
    if (!plugin)
        return { updated: false, message: `plugin '${name}' is not installed.` };
    if (!isGitSource(plugin.source)) {
        return { updated: false, message: `plugin '${name}' was installed from a local path; reinstall to update.` };
    }
    const dir = pluginDir(name);
    try {
        execFileSync("git", ["-C", dir, "pull", "--ff-only"], { stdio: "pipe" });
    }
    catch (err) {
        const detail = err instanceof Error && "stderr" in err ? String(err.stderr) : "";
        return { updated: false, message: `git pull failed: ${detail.trim() || err.message}` };
    }
    // Refresh metadata from the manifest after pulling.
    const manifest = readManifest(dir);
    if (manifest) {
        const registry = loadRegistry();
        const entry = registry.plugins.find((p) => p.name === name);
        if (entry) {
            entry.version = manifest.version ?? entry.version;
            entry.description = manifest.description ?? entry.description;
            saveRegistry(registry);
        }
    }
    return { updated: true, message: `plugin '${name}' updated.` };
}
export function pluginSkillCount(name) {
    return countSkillFiles(pluginDir(name));
}
export function scaffoldPlugin(rawName) {
    const name = rawName
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    if (!name)
        throw new Error("plugin name must contain letters or numbers.");
    if (findPlugin(name))
        throw new Error(`plugin '${name}' is already installed.`);
    const dir = pluginDir(name);
    if (fs.existsSync(dir))
        throw new Error(`directory already exists: ${dir}`);
    const skillsDir = path.join(dir, "skills");
    fs.mkdirSync(skillsDir, { recursive: true });
    const manifest = {
        name,
        version: "0.1.0",
        description: `${name} plugin`,
        author: "",
        skills: "skills",
    };
    fs.writeFileSync(path.join(dir, "plugin.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
    const title = name
        .split(/[-_]/g)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ");
    const skillFile = path.join(skillsDir, `${name}.md`);
    const skill = [
        "---",
        `name: ${name}`,
        `description: ${title} skill`,
        "---",
        "",
        `You are the /${name} skill.`,
        "",
        "User input:",
        "{{input}}",
        "",
        "Instructions:",
        "- Describe exactly what this skill should do.",
        "- Mention which files or commands it should inspect when relevant.",
        "- Keep the final answer concise and actionable.",
        "",
    ].join("\n");
    fs.writeFileSync(skillFile, skill, "utf8");
    const registry = loadRegistry();
    registry.plugins.push({
        name,
        version: manifest.version ?? "0.1.0",
        description: manifest.description ?? "",
        source: `scaffold:${dir}`,
        installedAt: new Date().toISOString(),
        enabled: true,
    });
    saveRegistry(registry);
    return { name, dir, skillFile };
}
/** The configured marketplace index (URL or local path), or null. */
export function marketplaceSource() {
    return process.env.DEEPSEEK_PLUGIN_REGISTRY?.trim() || null;
}
async function readMarketplaceRaw(src) {
    if (/^https?:\/\//i.test(src)) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20_000);
        try {
            const res = await fetch(src, {
                signal: controller.signal,
                headers: { "User-Agent": "deepseek-cli/0.1" },
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status} ${res.statusText}`);
            return await res.text();
        }
        finally {
            clearTimeout(timer);
        }
    }
    return fs.readFileSync(path.resolve(src), "utf8");
}
export async function fetchMarketplace() {
    const src = marketplaceSource();
    if (!src) {
        throw new Error("no marketplace configured. Set DEEPSEEK_PLUGIN_REGISTRY to an index.json URL or path.");
    }
    let parsed;
    try {
        parsed = JSON.parse(await readMarketplaceRaw(src));
    }
    catch (err) {
        throw new Error(`could not load marketplace from ${src}: ${err.message}`);
    }
    const list = Array.isArray(parsed) ? parsed : parsed?.plugins;
    if (!Array.isArray(list)) {
        throw new Error("marketplace index must be a JSON array or an object with a 'plugins' array.");
    }
    return list
        .filter((e) => !!e && typeof e.name === "string" && typeof e.source === "string")
        .map((e) => ({
        name: e.name,
        source: e.source,
        description: e.description,
        version: e.version,
        author: e.author,
    }));
}
export async function searchMarketplace(query) {
    const all = await fetchMarketplace();
    const q = query.trim().toLowerCase();
    if (!q)
        return all;
    return all.filter((e) => e.name.toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q));
}
/** Resolve an install argument to a concrete source (direct URL/path or marketplace name). */
export async function resolveInstallSource(arg) {
    const trimmed = arg.trim();
    if (isGitSource(trimmed))
        return { source: trimmed, via: "direct" };
    if (fs.existsSync(path.resolve(trimmed)))
        return { source: trimmed, via: "direct" };
    const all = await fetchMarketplace();
    const entry = all.find((e) => e.name.toLowerCase() === trimmed.toLowerCase());
    if (entry)
        return { source: entry.source, via: "marketplace" };
    throw new Error(`'${trimmed}' is not a git URL, local path, or a known marketplace plugin. Try /plugin search.`);
}
//# sourceMappingURL=plugins.js.map