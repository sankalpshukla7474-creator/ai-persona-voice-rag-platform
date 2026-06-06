import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_RESUME_PATH, env } from "@/lib/env";
import type { RawDocument } from "@/lib/chunking";

export async function collectResumeDocuments(path = env("RESUME_PATH", DEFAULT_RESUME_PATH)): Promise<RawDocument[]> {
  const text = await extractPdfText(path).catch(() => readResumeCache());
  return [
    {
      sourceType: "resume",
      sourceLabel: path,
      sourceUrl: null,
      path,
      content: text
    }
  ];
}

async function extractPdfText(filePath: string) {
  const buffer = await fs.readFile(filePath);
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text;
  } finally {
    await parser.destroy();
  }
}

async function readResumeCache() {
  const cachePath = path.join(process.cwd(), "data", "resume-cache.txt");
  return fs.readFile(cachePath, "utf8");
}
