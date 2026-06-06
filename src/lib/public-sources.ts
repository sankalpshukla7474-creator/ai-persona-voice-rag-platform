import fs from "node:fs/promises";
import path from "node:path";
import type { RawDocument } from "@/lib/chunking";

type CachedPublicSource = RawDocument & {
  fetchedAt?: string;
};

export async function collectCachedPublicSources(): Promise<RawDocument[]> {
  const filePath = path.join(process.cwd(), "data", "public-sources.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, "")) as CachedPublicSource[];
    return parsed.map((source) => ({
      sourceType: source.sourceType,
      sourceLabel: source.sourceLabel,
      sourceUrl: source.sourceUrl,
      repo: source.repo,
      path: source.path,
      commitSha: source.commitSha,
      content: source.content
    }));
  } catch {
    return [];
  }
}
