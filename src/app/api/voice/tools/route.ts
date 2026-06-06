import { bookInterview, getAvailability } from "@/lib/calendar";
import { retrieveProfile } from "@/lib/retrieval";

export const runtime = "nodejs";
export const maxDuration = 60;

type VapiToolCall = {
  id?: string;
  toolCallId?: string;
  function?: {
    name?: string;
    arguments?: unknown;
  };
  name?: string;
  arguments?: unknown;
  args?: unknown;
};

export async function POST(request: Request) {
  const payload = await request.json();
  const calls = normalizeToolCalls(payload);
  const results = [];

  for (const call of calls) {
    const name = call.function?.name ?? call.name;
    const args = normalizeArguments(call.function?.arguments ?? call.arguments ?? call.args);
    const toolCallId = call.id ?? call.toolCallId ?? crypto.randomUUID();
    try {
      results.push({
        toolCallId,
        result: await runTool(name, args)
      });
    } catch (error) {
      results.push({
        toolCallId,
        result: {
          error: error instanceof Error ? error.message : "Unknown tool error"
        }
      });
    }
  }

  return Response.json({ results });
}

async function runTool(name: string | undefined, args: Record<string, unknown>) {
  if (name === "retrieveProfile") {
    return retrieveProfile(String(args.query ?? ""));
  }
  if (name === "getAvailability") {
    return getAvailability({
      from: typeof args.from === "string" ? args.from : undefined,
      to: typeof args.to === "string" ? args.to : undefined,
      durationMinutes: typeof args.durationMinutes === "number" ? args.durationMinutes : 30
    });
  }
  if (name === "bookInterview") {
    return bookInterview({
      attendeeName: String(args.attendeeName ?? ""),
      attendeeEmail: String(args.attendeeEmail ?? ""),
      start: String(args.start ?? ""),
      notes: typeof args.notes === "string" ? args.notes : undefined
    });
  }
  return { error: `Unsupported tool: ${name ?? "unknown"}` };
}

function normalizeToolCalls(payload: unknown): VapiToolCall[] {
  const asRecord = payload as Record<string, unknown>;
  const message = asRecord.message as Record<string, unknown> | undefined;
  const candidates =
    asRecord.toolCalls ??
    asRecord.toolCallList ??
    message?.toolCalls ??
    message?.toolCallList ??
    asRecord.calls;
  if (Array.isArray(candidates)) return candidates as VapiToolCall[];
  return [payload as VapiToolCall];
}

function normalizeArguments(input: unknown): Record<string, unknown> {
  if (!input) return {};
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return input as Record<string, unknown>;
}
