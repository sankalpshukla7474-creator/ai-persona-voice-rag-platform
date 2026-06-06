import { bookInterview, getAvailability } from "@/lib/calendar";

const selfEmails = new Set(["sankalpshukla212@gmail.com"]);
const monthMap: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11
};

type UserTextMessage = {
  role: "user" | "assistant" | "system";
  text: string;
};

export async function schedulingAnswer(messages: UserTextMessage[]) {
  const transcript = messages
    .filter((message) => message.role === "user")
    .map((message) => message.text)
    .join("\n");

  if (!isSchedulingIntent(transcript)) return null;

  const attendeeEmail = extractEmail(transcript);
  const attendeeName = extractName(transcript, attendeeEmail);
  const requestedStart = parseRequestedStart(transcript);

  if (!attendeeName || !attendeeEmail || !requestedStart) {
    const availability = await getAvailability({ durationMinutes: 30 });
    return [
      "Sure. I can schedule a 30-minute interview.",
      "",
      "Please share the interviewer's name, email, and preferred day/time. If helpful, the earliest open slots are:",
      ...availability.slots.slice(0, 3).map((slot) => `- ${formatSlot(slot.start)}`)
    ].join("\n");
  }

  const result = await bookInterview({
    attendeeName,
    attendeeEmail,
    start: requestedStart.toISOString(),
    notes: "AI Engineer Intern interview"
  });

  if (result.confirmed) {
    return [
      `Done. I booked the interview for ${formatSlot(requestedStart.toISOString())}.`,
      result.meetLink ? `Google Meet: ${result.meetLink}` : null,
      result.eventLink ? `Calendar event: ${result.eventLink}` : null
    ]
      .filter(Boolean)
      .join("\n");
  }

  const alternatives =
    result.alternatives && result.alternatives.length > 0
      ? result.alternatives
      : (await getAvailability({ durationMinutes: 30 })).slots.slice(0, 3);
  return [
    `That requested time is not available. The closest open options are:`,
    ...alternatives.slice(0, 3).map((slot) => `- ${formatSlot(slot.start)}`),
    "",
    "Tell me which one works, and I will book it."
  ].join("\n");
}

function isSchedulingIntent(text: string) {
  return /\b(schedule|book|interview|meeting|calendar|slot|availability|available)\b/i.test(text);
}

function extractEmail(text: string) {
  const emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return emails.find((email) => !selfEmails.has(email.toLowerCase())) ?? null;
}

function extractName(text: string, email: string | null) {
  const explicit =
    text.match(/\b(?:name|interviewer)\s*(?:is|:)\s*([a-z][a-z .'-]{1,60})/i)?.[1]?.trim() ?? null;
  if (explicit) return titleCase(cleanName(explicit));
  if (!email) return null;
  const local = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\d+/g, "").trim();
  return local ? titleCase(local) : "Interviewer";
}

function cleanName(name: string) {
  return name.split(/\b(?:email|time|date|on|at)\b/i)[0].trim();
}

function parseRequestedStart(text: string) {
  const lower = text.toLowerCase();
  const dateMatch =
    lower.match(/\b(\d{1,2})\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{4})?\b/) ??
    lower.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ?? lower.match(/\b(\d{1,2}):(\d{2})\b/);

  if (!dateMatch || !timeMatch) return null;

  let day: number;
  let month: number;
  let year: number;

  if (Number.isNaN(Number(dateMatch[2]))) {
    day = Number(dateMatch[1]);
    month = monthMap[dateMatch[2]];
    year = Number(dateMatch[3] ?? new Date().getFullYear());
  } else {
    day = Number(dateMatch[1]);
    month = Number(dateMatch[2]) - 1;
    year = Number(dateMatch[3]);
    if (year < 100) year += 2000;
  }

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] ?? 0);
  const meridiem = timeMatch[3];
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  return istDateToUtc(year, month, day, hour, minute);
}

function istDateToUtc(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month, day, hour - 5, minute - 30, 0, 0));
}

function formatSlot(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
    timeZoneName: "short"
  }).format(new Date(iso));
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1).toLowerCase()}`)
    .join(" ");
}
