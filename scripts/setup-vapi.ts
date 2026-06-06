import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { vapiAssistantPayload } from "../src/lib/voice-config";

dotenv.config({ path: ".env.local" });
dotenv.config();

const payload = vapiAssistantPayload();
const payloadPath = path.resolve("docs", "vapi-assistant-payload.json");
await fs.mkdir(path.dirname(payloadPath), { recursive: true });
await fs.writeFile(payloadPath, JSON.stringify(payload, null, 2), "utf8");

if (!process.env.VAPI_API_KEY) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: "VAPI_API_KEY is missing. Payload was written for dashboard/manual setup.",
        payloadPath
      },
      null,
      2
    )
  );
  process.exit(0);
}

const assistantId = process.env.VAPI_ASSISTANT_ID;
const response = await fetch(`https://api.vapi.ai/assistant${assistantId ? `/${assistantId}` : ""}`, {
  method: assistantId ? "PATCH" : "POST",
  headers: {
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

const text = await response.text();
let body: unknown;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

console.log(JSON.stringify({ ok: response.ok, status: response.status, payloadPath, body }, null, 2));
