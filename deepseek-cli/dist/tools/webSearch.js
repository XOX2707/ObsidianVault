const TIMEOUT_MS = 20_000;
function decodeEntities(s) {
    return s
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'")
        .trim();
}
async function fetchWithTimeout(url, init) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    }
    finally {
        clearTimeout(timer);
    }
}
/** Decide which provider to use based on env configuration. */
function selectProvider() {
    const explicit = (process.env.WEB_SEARCH_PROVIDER || "").trim().toLowerCase();
    if (explicit === "bocha")
        return "bocha";
    if (explicit === "tavily")
        return "tavily";
    if (explicit === "duckduckgo" || explicit === "ddg")
        return "duckduckgo";
    if (process.env.BOCHA_API_KEY)
        return "bocha";
    if (process.env.TAVILY_API_KEY)
        return "tavily";
    return "duckduckgo";
}
// ---------------------------------------------------------------------------
// Bocha (博查) — https://open.bochaai.com  | China-friendly, AI search API.
// ---------------------------------------------------------------------------
async function searchBocha(query, limit) {
    const key = process.env.BOCHA_API_KEY;
    if (!key)
        throw new Error("BOCHA_API_KEY is not set");
    const res = await fetchWithTimeout("https://api.bochaai.com/v1/web-search", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, summary: true, count: limit, page: 1 }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Bocha HTTP ${res.status} ${res.statusText} ${body.slice(0, 200)}`.trim());
    }
    const data = (await res.json());
    if (data.code !== undefined && data.code !== 200) {
        throw new Error(`Bocha error ${data.code}: ${data.msg ?? "unknown"}`);
    }
    const value = data.data?.webPages?.value ?? [];
    const hits = value.slice(0, limit).map((item) => ({
        title: item.name ?? "(untitled)",
        url: item.url ?? "",
        snippet: (item.summary || item.snippet || "").trim(),
    }));
    return { hits };
}
// ---------------------------------------------------------------------------
// Tavily — https://tavily.com  | reliable international AI search API.
// ---------------------------------------------------------------------------
async function searchTavily(query, limit) {
    const key = process.env.TAVILY_API_KEY;
    if (!key)
        throw new Error("TAVILY_API_KEY is not set");
    const res = await fetchWithTimeout("https://api.tavily.com/search", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, max_results: limit, search_depth: "basic" }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Tavily HTTP ${res.status} ${res.statusText} ${body.slice(0, 200)}`.trim());
    }
    const data = (await res.json());
    const hits = (data.results ?? []).slice(0, limit).map((item) => ({
        title: item.title ?? "(untitled)",
        url: item.url ?? "",
        snippet: (item.content ?? "").trim(),
    }));
    return { hits, answer: data.answer?.trim() || undefined };
}
// ---------------------------------------------------------------------------
// DuckDuckGo HTML — no key, but often blocked/unreliable (e.g. mainland China).
// ---------------------------------------------------------------------------
function unwrapDuckUrl(href) {
    try {
        const u = href.startsWith("//") ? "https:" + href : href;
        const parsed = new URL(u, "https://duckduckgo.com");
        const uddg = parsed.searchParams.get("uddg");
        return uddg ? decodeURIComponent(uddg) : href;
    }
    catch {
        return href;
    }
}
function parseDuckResults(html, limit) {
    const hits = [];
    const linkRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRe = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippets = [];
    let sm;
    while ((sm = snippetRe.exec(html)) !== null)
        snippets.push(decodeEntities(sm[1]));
    let m;
    let i = 0;
    while ((m = linkRe.exec(html)) !== null && hits.length < limit) {
        hits.push({
            url: unwrapDuckUrl(m[1]),
            title: decodeEntities(m[2]),
            snippet: snippets[i] ?? "",
        });
        i++;
    }
    return hits;
}
async function searchDuckDuckGo(query, limit) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        },
    });
    if (!res.ok)
        throw new Error(`DuckDuckGo HTTP ${res.status}`);
    const html = await res.text();
    return { hits: parseDuckResults(html, limit) };
}
const PROVIDERS = {
    bocha: searchBocha,
    tavily: searchTavily,
    duckduckgo: searchDuckDuckGo,
};
export const webSearchTool = {
    name: "web_search",
    description: "Search the web and return a list of result titles, URLs, and snippets. " +
        "Uses the configured provider (Bocha or Tavily via API key; DuckDuckGo otherwise). " +
        "Follow up with web_fetch to read a specific result.",
    needsApproval: false,
    parameters: {
        type: "object",
        properties: {
            query: { type: "string", description: "The search query." },
            limit: { type: "number", description: "Max results to return (optional, default 8)." },
        },
        required: ["query"],
    },
    preview(args) {
        return `search "${String(args.query)}"`;
    },
    async run(args) {
        const query = String(args.query);
        const limit = Math.min(Number(args.limit) || 8, 15);
        const provider = selectProvider();
        try {
            const { hits, answer } = await PROVIDERS[provider](query, limit);
            if (hits.length === 0 && !answer) {
                return {
                    content: `No results for "${query}" (provider: ${provider}).`,
                    summary: `search "${query}" via ${provider}: 0 results`,
                };
            }
            const sections = [];
            if (answer)
                sections.push(`Answer: ${answer}`);
            sections.push(hits
                .map((h, i) => `${i + 1}. ${h.title}\n   ${h.url}\n   ${h.snippet}`.trimEnd())
                .join("\n\n"));
            return {
                content: sections.filter(Boolean).join("\n\n"),
                summary: `search "${query}" via ${provider}: ${hits.length} results`,
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const hint = provider === "duckduckgo"
                ? " DuckDuckGo may be blocked on this network — set BOCHA_API_KEY (recommended in China) or TAVILY_API_KEY to use a reliable provider."
                : "";
            return {
                content: `Error searching via ${provider}: ${msg}.${hint}`,
                summary: `search "${query}" via ${provider}: failed`,
                isError: true,
            };
        }
    },
};
//# sourceMappingURL=webSearch.js.map