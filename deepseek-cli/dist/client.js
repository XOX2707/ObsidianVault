import OpenAI from "openai";
export class DeepSeekClient {
    config;
    client;
    constructor(config) {
        this.config = config;
        if (!config.apiKey) {
            throw new Error("Missing DeepSeek API key.");
        }
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
        });
    }
    /**
     * Stream one assistant turn. Accumulates streamed text + tool calls and returns
     * the full turn once the stream completes.
     */
    async stream(messages, tools, model, callbacks = {}, options = {}) {
        const stream = await this.client.chat.completions.create({
            model,
            messages,
            tools: tools.length > 0 ? tools : undefined,
            tool_choice: tools.length > 0 ? "auto" : undefined,
            stream: true,
        }, options.signal ? { signal: options.signal } : undefined);
        let content = "";
        let reasoning = "";
        let usage;
        const toolCallsAcc = {};
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            // Some APIs (including DeepSeek) return usage on the final chunk.
            if (chunk.usage) {
                usage = {
                    promptTokens: chunk.usage.prompt_tokens,
                    completionTokens: chunk.usage.completion_tokens,
                    totalTokens: chunk.usage.total_tokens,
                };
            }
            if (!delta)
                continue;
            if (delta.reasoning_content) {
                reasoning += delta.reasoning_content;
                callbacks.onReasoning?.(delta.reasoning_content);
            }
            if (delta.content) {
                content += delta.content;
                callbacks.onText?.(delta.content);
            }
            if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                    const idx = tc.index;
                    if (!toolCallsAcc[idx]) {
                        toolCallsAcc[idx] = {
                            id: tc.id ?? "",
                            type: "function",
                            function: { name: "", arguments: "" },
                        };
                    }
                    const acc = toolCallsAcc[idx];
                    if (tc.id)
                        acc.id = tc.id;
                    if (tc.function?.name)
                        acc.function.name += tc.function.name;
                    if (tc.function?.arguments)
                        acc.function.arguments += tc.function.arguments;
                }
            }
        }
        const toolCalls = Object.keys(toolCallsAcc)
            .map(Number)
            .sort((a, b) => a - b)
            .map((i) => toolCallsAcc[i])
            .filter((tc) => tc.function.name);
        return { content, reasoning, toolCalls, usage };
    }
    async listModels() {
        const models = await this.client.models.list();
        return models.data
            .filter((model) => typeof model.id === "string" && model.id.length > 0)
            .map((model) => ({
            id: model.id,
            ownedBy: "owned_by" in model ? model.owned_by : undefined,
        }));
    }
}
/**
 * Lightweight check that a key/endpoint pair works, via a models.list call.
 * Never throws; returns the failure reason instead so callers can show ✓/✗.
 */
export async function validateApiKey(apiKey, baseURL) {
    try {
        const client = new DeepSeekClient({
            apiKey,
            baseURL,
            model: "",
            alwaysAllow: [],
            thinkingMode: "off",
        });
        await client.listModels();
        return { ok: true };
    }
    catch (err) {
        const status = err?.status;
        let message = err?.message ?? String(err);
        if (status === 401 || status === 403)
            message = "Invalid or unauthorized API key.";
        return { ok: false, error: message };
    }
}
//# sourceMappingURL=client.js.map