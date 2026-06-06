import { chunkDocuments } from "@/lib/chunking";
import { ensureSchema, replaceChunks } from "@/lib/db";
import { embedMany } from "@/lib/embeddings";
import { collectGithubDocuments } from "@/lib/github";
import { collectResumeDocuments } from "@/lib/resume";

export async function runIngestion() {
  await ensureSchema();
  const startedAt = Date.now();
  const documents = [
    ...(await collectResumeDocuments()),
    ...(await collectGithubDocuments())
  ];
  const chunks = chunkDocuments(documents);
  const embeddings = await embedMany(chunks.map((chunk) => chunk.content));
  await replaceChunks(
    chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index]
    }))
  );

  return {
    ok: true,
    documents: documents.length,
    chunks: chunks.length,
    durationMs: Date.now() - startedAt
  };
}
