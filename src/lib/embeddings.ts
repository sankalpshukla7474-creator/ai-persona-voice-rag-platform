import OpenAI from "openai";
import { requireEnv } from "@/lib/env";

let client: OpenAI | null = null;

function openai() {
  if (!client) client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  return client;
}

export async function embedText(input: string) {
  const response = await openai().embeddings.create({
    model: "text-embedding-3-small",
    input,
    encoding_format: "float"
  });
  return response.data[0].embedding;
}

export async function embedMany(texts: string[]) {
  if (texts.length === 0) return [];
  const response = await openai().embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
    encoding_format: "float"
  });
  return response.data.map((item) => item.embedding);
}
