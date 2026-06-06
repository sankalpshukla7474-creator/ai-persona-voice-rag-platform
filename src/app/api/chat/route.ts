import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  stepCountIs,
  tool,
  type UIMessage
} from "ai";
import { z } from "zod";
import { bookInterview, getAvailability } from "@/lib/calendar";
import { localFallbackAnswer } from "@/lib/local-rag";
import { availableChatModels, hasChatModel } from "@/lib/model-provider";
import { contextBlock, personaSystemPrompt } from "@/lib/persona";
import { retrieveProfile } from "@/lib/retrieval";

export const runtime = "nodejs";
export const maxDuration = 60;

const availabilityInput = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(90).default(30)
});

const bookingInput = z.object({
  attendeeName: z.string().min(2),
  attendeeEmail: z.string().describe("Interviewer's email address."),
  start: z.string().datetime(),
  notes: z.string().max(1000).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const messages = (body.messages ?? []) as UIMessage[];
  const lastUserText = extractLastUserText(messages);

  if (!hasChatModel()) {
    const answer = await localFallbackAnswer(lastUserText || "Sankalp Shukla AI engineer profile");
    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: ({ writer }) => {
        const id = "local-fallback";
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: answer });
        writer.write({ type: "text-end", id });
      }
    });
    return createUIMessageStreamResponse({ stream });
  }

  const retrieval = await retrieveProfile(lastUserText || "Sankalp Shukla AI engineer profile", 4);
  const needsGithubEvidence = /\b(github|repo|repos|repository|repositories|commit|readme)\b/i.test(lastUserText);
  const hasGithubEvidence = retrieval.snippets.some((snippet) => snippet.citation.startsWith("GitHub:"));

  const modelMessages = await convertToModelMessages(messages);
  const system = `${personaSystemPrompt}

Retrieved context for this turn:
${contextBlock(retrieval.snippets)}

When you use evidence, cite it inline like [Resume] or [GitHub: repo/path].
${needsGithubEvidence && !hasGithubEvidence ? "The user asked about GitHub, but retrieved context has no GitHub source. Do not infer repository names from resume projects. Say GitHub evidence is not available until GITHUB_TOKEN is configured or repository ingestion succeeds." : ""}`;

  let answer = "";
  for (const candidate of availableChatModels()) {
    try {
      const result = await generateText({
        model: candidate.model,
        maxOutputTokens: 360,
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        },
        system,
        messages: modelMessages,
        stopWhen: stepCountIs(5),
        tools: {
          getAvailability: tool({
            description: "Find real free interview slots on Sankalp's Google Calendar.",
            inputSchema: availabilityInput,
            execute: async (input) => getAvailability(input)
          }),
          bookInterview: tool({
            description:
              "Book a confirmed 30 minute Scaler interview after collecting attendee name, email, and chosen ISO start time.",
            inputSchema: bookingInput,
            execute: async (input) => bookInterview(input)
          })
        }
      });
      answer = result.text;
      break;
    } catch {
      answer = "";
    }
  }

  if (!answer) {
    answer = await localFallbackAnswer(lastUserText || "Sankalp Shukla AI engineer profile");
  }

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      const id = crypto.randomUUID();
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: answer });
      writer.write({ type: "text-end", id });
    }
  });
  return createUIMessageStreamResponse({ stream });
}

function extractLastUserText(messages: UIMessage[]) {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  return (
    lastUser?.parts
      ?.map((part) => (part.type === "text" ? part.text : ""))
      .join(" ")
      .trim() ?? ""
  );
}
