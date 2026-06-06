import crypto from "node:crypto";

export type RawDocument = {
  sourceType: "resume" | "github" | "portfolio";
  sourceLabel: string;
  sourceUrl?: string | null;
  repo?: string | null;
  path?: string | null;
  commitSha?: string | null;
  content: string;
};

export function chunkDocuments(documents: RawDocument[], maxChars = 1400, overlap = 220) {
  return documents.flatMap((doc) => {
    const normalized = doc.content.replace(/\s+/g, " ").trim();
    if (!normalized) return [];

    const chunks = [];
    let start = 0;
    while (start < normalized.length) {
      const end = Math.min(start + maxChars, normalized.length);
      const content = normalized.slice(start, end).trim();
      if (content.length > 80) {
        chunks.push({
          ...doc,
          id: stableId(`${doc.sourceLabel}:${doc.path ?? ""}:${start}:${content}`),
          content
        });
      }
      if (end === normalized.length) break;
      start = Math.max(0, end - overlap);
    }
    return chunks;
  });
}

function stableId(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}
