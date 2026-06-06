import { embedText } from "@/lib/embeddings";
import { hasDatabase, searchChunks } from "@/lib/db";
import { localRetrieve } from "@/lib/local-rag";

export type RetrievalResult = {
  answerable: boolean;
  snippets: Array<{
    id: string;
    content: string;
    score?: number;
    citation: string;
    sourceUrl?: string | null;
  }>;
};

export async function retrieveProfile(query: string, limit = 6): Promise<RetrievalResult> {
  if (!hasDatabase()) {
    const chunks = await localRetrieve(query, limit);
    return {
      answerable: chunks.some((chunk) => (chunk.score ?? 0) > 0),
      snippets: chunks.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        score: chunk.score,
        citation: formatCitation(chunk),
        sourceUrl: chunk.sourceUrl
      }))
    };
  }

  const embedding = await embedText(query);
  const chunks = await searchChunks(embedding, limit);
  const snippets = chunks.map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    score: chunk.score,
    citation: formatCitation(chunk),
    sourceUrl: chunk.sourceUrl
  }));

  return {
    answerable: snippets.some((snippet) => (snippet.score ?? 0) > 0.2),
    snippets
  };
}

function formatCitation(chunk: {
  sourceType: string;
  sourceLabel: string;
  repo?: string | null;
  path?: string | null;
  commitSha?: string | null;
}) {
  if (chunk.sourceType === "resume") return `Resume: ${chunk.sourceLabel}`;
  if (chunk.sourceType === "portfolio") return `Portfolio: ${chunk.sourceLabel}`;
  const path = chunk.path ? `/${chunk.path}` : "";
  const sha = chunk.commitSha ? ` @ ${chunk.commitSha.slice(0, 7)}` : "";
  return `GitHub: ${chunk.repo ?? chunk.sourceLabel}${path}${sha}`;
}
