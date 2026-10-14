import fs from "node:fs";
import { decodeXmlEntities } from "./xml.js";
export function isDocx(filePath) {
    return filePath.toLowerCase().endsWith(".docx");
}
/** Turn WordprocessingML markup into plain text (paragraphs → newlines). */
function docXmlToText(xml) {
    let out = xml
        .replace(/<w:tab\b[^>]*\/?>/g, "\t")
        .replace(/<w:br\b[^>]*\/?>/g, "\n")
        .replace(/<\/w:p>/g, "\n") // paragraph end → newline
        .replace(/<[^>]+>/g, ""); // strip all remaining tags (non-text nodes carry no content)
    out = decodeXmlEntities(out);
    return out
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
/**
 * Extract plain text from a .docx (Office Open XML) file. A .docx is a ZIP whose
 * main body lives in word/document.xml; we unzip with fflate (tiny, pure JS) and
 * flatten the markup. Imported lazily so fflate only loads when a docx is opened.
 */
export async function extractDocxText(absPath, maxChars = 50_000) {
    try {
        const { unzipSync, strFromU8 } = await import("fflate");
        const data = new Uint8Array(fs.readFileSync(absPath));
        const files = unzipSync(data, { filter: (f) => f.name === "word/document.xml" });
        const docXml = files["word/document.xml"];
        if (!docXml) {
            return { ok: false, error: "no word/document.xml found (not a standard .docx?)" };
        }
        let text = docXmlToText(strFromU8(docXml));
        if (!text) {
            return { ok: false, error: "no extractable text (the document may be empty or image-only)" };
        }
        const truncated = text.length > maxChars;
        if (truncated)
            text = text.slice(0, maxChars) + "\n…[truncated]";
        return { ok: true, text, truncated };
    }
    catch (err) {
        return { ok: false, error: err.message };
    }
}
//# sourceMappingURL=docx.js.map