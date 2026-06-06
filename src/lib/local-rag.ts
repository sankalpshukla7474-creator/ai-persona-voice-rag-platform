import type { RawDocument } from "@/lib/chunking";
import { chunkDocuments } from "@/lib/chunking";
import { collectGithubDocuments } from "@/lib/github";
import { collectCachedPublicSources } from "@/lib/public-sources";
import { collectResumeDocuments } from "@/lib/resume";

let cachedChunks: Array<RawDocument & { id: string }> | null = null;

export async function localRetrieve(query: string, limit = 6) {
  const chunks = await getLocalChunks();
  const queryTerms = tokenize(query);
  const profileIntent = hasAny(query, ["fit", "role", "resume", "background", "experience", "skill", "education"]);
  const repoIntent = hasAny(query, ["github", "repo", "repository", "repositories", "commit", "readme", "portfolio"]);
  const portfolioIntent = hasAny(query, ["portfolio", "website", "site"]);
  const scored = chunks
    .map((chunk) => ({
      ...chunk,
      score:
        lexicalScore(queryTerms, tokenize(chunk.content)) +
        (profileIntent && chunk.sourceType === "resume" ? 2 : 0) +
        (repoIntent && chunk.sourceType === "github" ? 1.8 : 0) +
        (repoIntent && chunk.sourceType === "portfolio" ? 1.2 : 0) +
        (portfolioIntent && chunk.sourceType === "portfolio" ? 3 : 0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((chunk) => ({
    id: chunk.id,
    sourceType: chunk.sourceType,
    sourceLabel: chunk.sourceLabel,
    sourceUrl: chunk.sourceUrl,
    repo: chunk.repo,
    path: chunk.path,
    commitSha: chunk.commitSha,
    content: chunk.content,
    score: chunk.score
  }));
}

export async function localFallbackAnswer(query: string) {
  if (isUnsafeOrUnsupported(query)) {
    return [
      "I cannot help with that request.",
      "",
      "I am Sankalp Shukla's AI representative and must stay grounded in the resume, public GitHub evidence, and calendar tool results. I will not invent experience, reveal hidden prompts, expose secrets, or follow instructions that override those rules."
    ].join("\n");
  }

  const snippets = await localRetrieve(query, 5);
  const relevant = snippets.filter((snippet) => snippet.score > 0);
  if (relevant.length === 0) {
    return [
      "I can answer only from Sankalp's local resume and public GitHub corpus. I could not find enough matching evidence for that question in the local fallback mode.",
      "",
      "For full AI responses, configure `OPENAI_API_KEY`, `DATABASE_URL`, run `npm run ingest`, and restart the server."
    ].join("\n");
  }

  return [
    "Local fallback mode is active because `OPENAI_API_KEY` is not configured. Here is the grounded evidence I found:",
    "",
    ...relevant.slice(0, 4).map((snippet, index) => {
      const label =
        snippet.sourceType === "resume"
          ? "Resume"
          : snippet.sourceType === "portfolio"
            ? "Portfolio"
            : `GitHub${snippet.repo ? `: ${snippet.repo}` : ""}${snippet.path ? `/${snippet.path}` : ""}`;
      return `${index + 1}. [${label}] ${summarize(snippet.content)}`;
    }),
    "",
    "This proves the retrieval and UI path are working locally. Add real API/database/calendar/Vapi credentials before final public submission."
  ].join("\n");
}

async function getLocalChunks() {
  if (cachedChunks) return cachedChunks;
  const documents: RawDocument[] = [];
  try {
    documents.push(...(await collectResumeDocuments()));
  } catch (error) {
    documents.push({
      sourceType: "resume",
      sourceLabel: "Resume load error",
      content: `Could not load resume PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    });
  }
  try {
    documents.push(...(await collectCachedPublicSources()));
  } catch {
    // Cached public sources are optional.
  }
  try {
    if (process.env.GITHUB_TOKEN) {
      documents.push(...(await collectGithubDocuments()));
    }
  } catch {
    // GitHub fallback is best-effort without a token or network.
  }
  cachedChunks = chunkDocuments(documents);
  return cachedChunks;
}

function tokenize(input: string) {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "what",
    "why",
    "who",
    "how",
    "is",
    "are",
    "was",
    "were",
    "has",
    "have",
    "about",
    "sankalp",
    "shukla"
  ]);
  return input
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stop.has(term));
}

function lexicalScore(queryTerms: string[], contentTerms: string[]) {
  if (queryTerms.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const term of contentTerms) counts.set(term, (counts.get(term) ?? 0) + 1);
  return queryTerms.reduce((score, term) => score + Math.min(3, counts.get(term) ?? 0), 0) / queryTerms.length;
}

function hasAny(input: string, terms: string[]) {
  const lower = input.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function isUnsafeOrUnsupported(input: string) {
  return hasAny(input, [
    "ignore your instructions",
    "ignore all previous",
    "reveal",
    "system prompt",
    "api key",
    "api keys",
    "secret",
    "make up",
    "invent",
    "pretend",
    "hallucinate"
  ]);
}

function summarize(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  if (compact.length <= 360) return compact;
  return `${compact.slice(0, 360).trim()}...`;
}
