export const TODO_STATUSES = ["pending", "in_progress", "completed"];
function isTodoStatus(value) {
    return typeof value === "string" && TODO_STATUSES.includes(value);
}
function fallbackId(index) {
    return `todo-${index + 1}`;
}
export function validateTodos(rawTodos) {
    if (!Array.isArray(rawTodos)) {
        return { error: "todos must be an array." };
    }
    const ids = new Set();
    const todos = [];
    for (let i = 0; i < rawTodos.length; i++) {
        const raw = rawTodos[i];
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
            return { error: `todo ${i + 1} must be an object.` };
        }
        const item = raw;
        const content = typeof item.content === "string" ? item.content.trim() : "";
        if (!content) {
            return { error: `todo ${i + 1} content must be a non-empty string.` };
        }
        if (!isTodoStatus(item.status)) {
            return {
                error: `todo ${i + 1} status must be one of: ${TODO_STATUSES.join(", ")}.`,
            };
        }
        const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : fallbackId(i);
        if (ids.has(id)) {
            return { error: `duplicate todo id: ${id}.` };
        }
        ids.add(id);
        todos.push({ id, content, status: item.status });
    }
    const inProgress = todos.filter((todo) => todo.status === "in_progress");
    if (inProgress.length > 1) {
        return { error: "only one todo may be in_progress at a time." };
    }
    return { todos };
}
export class TodoStore {
    todos = [];
    list() {
        return this.todos.map((todo) => ({ ...todo }));
    }
    replace(todos) {
        this.todos = todos.map((todo) => ({ ...todo }));
    }
    clear() {
        this.todos = [];
    }
    formatForModel() {
        return formatTodoList(this.todos);
    }
}
export function formatTodoList(todos) {
    if (todos.length === 0)
        return "No active todos.";
    const marker = {
        pending: "[ ]",
        in_progress: "[>]",
        completed: "[x]",
    };
    return todos.map((todo) => `${marker[todo.status]} ${todo.content} (${todo.id})`).join("\n");
}
//# sourceMappingURL=todo.js.map