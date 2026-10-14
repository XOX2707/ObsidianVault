import { select } from "@inquirer/prompts";
import { chalk } from "./ui/render.js";
export const PERMISSION_MODES = ["default", "acceptEdits", "plan"];
export function permissionModeLabel(mode) {
    switch (mode) {
        case "acceptEdits":
            return "accept edits";
        case "plan":
            return "plan mode";
        default:
            return "normal";
    }
}
/** Tools considered "edits" that auto-accept mode approves automatically. */
const EDIT_TOOLS = new Set(["write_file", "edit_file"]);
export function createPermissionManager(opts) {
    const sessionAllow = new Set(opts.preApproved);
    let mode = "default";
    const isAllowed = (toolName) => opts.autoApprove || sessionAllow.has(toolName);
    return {
        isAllowed,
        evaluate(toolName) {
            if (isAllowed(toolName))
                return "allow";
            if (mode === "plan")
                return "deny";
            if (mode === "acceptEdits" && EDIT_TOOLS.has(toolName))
                return "allow";
            return "ask";
        },
        allowForSession(toolName) {
            sessionAllow.add(toolName);
        },
        getMode() {
            return mode;
        },
        setMode(next) {
            mode = next;
        },
        cycleMode() {
            mode = PERMISSION_MODES[(PERMISSION_MODES.indexOf(mode) + 1) % PERMISSION_MODES.length];
            return mode;
        },
        async request(toolName, previewLine) {
            console.log();
            console.log(chalk.yellow("  ⚠ Permission required") + chalk.dim(` — ${toolName}`));
            console.log("  " + chalk.white(previewLine));
            const decision = await select({
                message: "Allow this action?",
                choices: [
                    { name: "Yes, once", value: "approve" },
                    { name: `Yes, and don't ask again for ${toolName} this session`, value: "always" },
                    { name: "No, and tell the model what to do differently", value: "deny" },
                ],
            });
            if (decision === "always")
                sessionAllow.add(toolName);
            return decision;
        },
    };
}
//# sourceMappingURL=permissions.js.map