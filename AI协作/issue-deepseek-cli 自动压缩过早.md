---
tags: [issue, deepseek-cli, 上游反馈]
created: 2026-10-20
upstream: "@kavienw/deepseek-cli@0.5.0"
status: 待推送
---

# issue 草稿：自动压缩在上下文还很小时就触发

> 2026-10-20 记。用户在终端看到 `Context is large (~9,728 estimated tokens); compressing before continuing.`，实际是撞了「80 条消息」的限制，不是 token 太多。下面是能直接粘给 Claude 去提的英文正文。
>
> 仓库地址：npm 元数据里**没有** `repository` 字段，`package.json` 也没有，要 Claude 先确认上游在不在 GitHub；实在找不到就发 npm 主页维护者邮箱 `wangqieyu@gmail.com`。

---

**Title**: Auto-compaction fires at 80 messages while the context is still tiny (~10k tokens), and the warning reports a misleading reason

### Summary

`shouldAutoCompress()` compacts on `messageCount() >= 80` **or** estimated tokens >= 48,000. In a tool-heavy session the message count is reached long before the token limit: every tool round-trip pushes **two** messages (assistant with `tool_calls` + the `tool` result), so ~40 tool calls is enough. The session then gets compacted at roughly 9,700 estimated tokens, and the warning prints only the token estimate, so it reads like `Context is large (~9,728 estimated tokens)` when nothing about the context is large.

### Environment

- `@kavienw/deepseek-cli` 0.5.0 (npm, gitHead `0310336`)
- Windows, PowerShell
- Tools enabled (shell / read_file / write_file / edit_file in use)
- Session usage at the moment of compaction: 916,879 prompt tokens, 17,448 completion tokens, 934,327 total

### Steps to reproduce

1. Start a session with tools enabled.
2. Send a few short prompts that each make 5 to 10 tool calls (e.g. "look through these files", "run this command").
3. Keep going until the transcript reaches 80 messages.
4. Send the next short prompt.

### Actual

```
Context is large (~9,728 estimated tokens); compressing before continuing.
auto-compressing context…
```

The transcript is compacted while the estimated context is still about one fifth of `AUTO_COMPRESS_ESTIMATED_TOKEN_LIMIT`.

### Expected

- Compaction should be driven by how full the model's context actually is, or at least by a limit that reflects real usage, not by raw message count where tool results inflate the count.
- When it does fire, the warning should say which limit was hit (`messages 80/80` vs `tokens 9,728/48,000`) so users can tell a genuine overflow from a policy threshold.

### Root cause

In `dist/agent.js` (0.5.0):

- L87 `const AUTO_COMPRESS_ESTIMATED_TOKEN_LIMIT = 48_000;`
- L88 `const AUTO_COMPRESS_MESSAGE_LIMIT = 80;`
- L412 `estimatedContextTokens()` serializes every message via `formatMessageForCompression` and runs `estimateTokensFromText`
- L418 to L423 `shouldAutoCompress()` returns `messageCount() >= 80 || estimated >= 48_000`
- L379 `messageCount()` counts **every** non system message, including `tool` results
- L686 the warning passes only `this.estimatedContextTokens(estimate)`, so the message-count branch is invisible to the user

### Suggested fix (any one is enough)

1. **Count turns, not messages.** Gate on user turns (e.g. `messages.filter(m => m.role === "user").length`), or weight `tool` results as a fraction of a message, so tool-heavy work does not compact 5x earlier than chat.
2. **Raise and split the limits.** Keep 48,000 as the token gate and lift the message gate to something like 200, or drop it entirely and let tokens decide.
3. **Fix the warning.** Print both numbers, e.g. `Context will be compacted (messages 80/80, ~9,728/48,000 tokens)`, so the branch that fired is obvious.

### Related: the estimator under-counts in two common cases

- `estimateTokensFromText()` is `Math.ceil(text.length / 4)`. That ratio is fine for English but too low for CJK, where a character is often one token or more, so Chinese transcripts can be under-estimated by 2 to 3x.
- Image messages are reduced to the placeholder `[1 image(s)]` in `buildUserContent()`'s `estimate` string, so image tokens never enter the estimate. A session with several screenshots can be far past the real window while the estimator still shows ~10k.

Both mean the token gate can fail to protect the context exactly when a session is heavy, which makes the message-count backstop do all the work, hence the premature compaction.
