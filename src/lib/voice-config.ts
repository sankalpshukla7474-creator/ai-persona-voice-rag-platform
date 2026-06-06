import { appBaseUrl } from "@/lib/env";
import { personaSystemPrompt } from "@/lib/persona";

export function voiceSystemPrompt() {
  return `${personaSystemPrompt}

Voice behavior:
- First sentence: "Hi, I am Sankalp Shukla's AI representative for the Scaler screening."
- Keep spoken answers short: usually 20-45 seconds.
- Sound natural over a phone call. Use simple sentences and avoid reading citations out loud unless asked.
- Never ask callers for ISO date formats. Interpret normal phrases like "Monday at 4 PM IST" and use tools internally.
- Do not say source labels like resume, portfolio, or GitHub unless the caller asks where the information came from.
- If a caller asks about repositories, use retrieveProfile first and mention the strongest 2-3 projects only.
- If the caller wants to schedule, ask for name, email, preferred slot, and purpose, then use availability and booking tools.
- If calendar credentials are missing, say the scheduling connection is not active yet and ask them to use the chat link or email as a fallback.`;
}

export function vapiAssistantPayload() {
  const serverUrl = `${appBaseUrl()}/api/voice/tools`;
  return {
    name: "Sankalp AI Representative",
    firstMessage:
      "Hi, I am Sankalp Shukla's AI representative for the Scaler screening. I can answer questions about his background, projects, GitHub work, and help book an interview.",
    model: {
      provider: "groq",
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: voiceSystemPrompt()
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "retrieveProfile",
            description: "Retrieve grounded resume, portfolio, and GitHub evidence about Sankalp.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The caller question or search query."
                }
              },
              required: ["query"]
            }
          },
          server: { url: serverUrl }
        },
        {
          type: "function",
          function: {
            name: "getAvailability",
            description: "Find available 30 minute interview slots.",
            parameters: {
              type: "object",
              properties: {
                from: { type: "string", description: "ISO date-time lower bound." },
                to: { type: "string", description: "ISO date-time upper bound." },
                durationMinutes: { type: "number", description: "Meeting length, default 30." }
              }
            }
          },
          server: { url: serverUrl }
        },
        {
          type: "function",
          function: {
            name: "bookInterview",
            description: "Book a confirmed interview after collecting attendee name, email, and slot.",
            parameters: {
              type: "object",
              properties: {
                attendeeName: { type: "string" },
                attendeeEmail: { type: "string" },
                start: { type: "string", description: "Chosen slot start in ISO format." },
                notes: { type: "string" }
              },
              required: ["attendeeName", "attendeeEmail", "start"]
            }
          },
          server: { url: serverUrl }
        }
      ]
    },
    voice: {
      provider: "vapi",
      voiceId: "Elliot"
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en"
    },
    endCallMessage:
      "Thanks for speaking with Sankalp's AI representative. I hope that was helpful."
  };
}
