import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI, openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type ModelChoice = {
  name: string;
  model: LanguageModel;
};

export function chatModel() {
  return availableChatModels()[0]?.model ?? openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini");
}

export function availableChatModels(): ModelChoice[] {
  const models: ModelChoice[] = [];
  if (process.env.GEMINI_API_KEY) {
    const gemini = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY
    });
    models.push({
      name: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      model: gemini(process.env.GEMINI_MODEL || "gemini-2.5-flash")
    });
  }

  if (process.env.GROQ_API_KEY) {
    const groq = createOpenAI({
      name: "groq",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
    models.push({
      name: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      model: groq(process.env.GROQ_MODEL || "llama-3.1-8b-instant")
    });
  }

  if (process.env.OPENAI_API_KEY) {
    models.push({
      name: process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini",
      model: openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini")
    });
  }

  return models;
}

export function hasChatModel() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
}

export function activeModelName() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (process.env.GROQ_API_KEY) return process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";
  return "local-fallback";
}
