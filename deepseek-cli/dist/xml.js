/** Decode the common XML/HTML entities found in Office Open XML text nodes. */
export function decodeXmlEntities(text) {
    return text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&amp;/g, "&"); // last, so decoded text doesn't re-trigger
}
/** Concatenate the text of every `<tag>…</tag>` (and `<ns:tag>…</ns:tag>`) occurrence. */
export function collectTagText(xml, localName) {
    const re = new RegExp(`<(?:[A-Za-z0-9]+:)?${localName}\\b[^>]*>([\\s\\S]*?)</(?:[A-Za-z0-9]+:)?${localName}>`, "g");
    const out = [];
    let m;
    while ((m = re.exec(xml)) !== null)
        out.push(decodeXmlEntities(m[1]));
    return out;
}
//# sourceMappingURL=xml.js.map