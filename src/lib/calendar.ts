import { google } from "googleapis";
import { z } from "zod";
import { DEFAULT_TIMEZONE, env, requireEnv } from "@/lib/env";
import { insertBookingAudit, hasDatabase } from "@/lib/db";

export const bookingSchema = z.object({
  attendeeName: z.string().min(2),
  attendeeEmail: z.string().email(),
  start: z.string().datetime(),
  notes: z.string().max(1000).optional()
});

export const availabilitySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(90).default(30)
});

export async function getAvailability(input: z.infer<typeof availabilitySchema>) {
  const timezone = env("BOOKING_TIMEZONE", DEFAULT_TIMEZONE);
  const now = new Date();
  const from = input.from ? new Date(input.from) : nextSearchStart(now);
  const to = input.to ? new Date(input.to) : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  const duration = input.durationMinutes ?? 30;

  const busy = await getBusyBlocks(from, to, timezone);
  const slots = buildSlots(from, to, duration, busy);
  return { timezone, durationMinutes: duration, slots: slots.slice(0, 12) };
}

export async function bookInterview(input: z.infer<typeof bookingSchema>) {
  const parsed = bookingSchema.parse(input);
  const start = new Date(parsed.start);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const availability = await getAvailability({
    from: new Date(start.getTime() - 60 * 1000).toISOString(),
    to: new Date(end.getTime() + 60 * 1000).toISOString(),
    durationMinutes: 30
  });

  const exactSlot = availability.slots.find((slot) => slot.start === start.toISOString());
  if (!exactSlot) {
    if (hasDatabase()) {
      await insertBookingAudit({
        attendeeEmail: parsed.attendeeEmail,
        attendeeName: parsed.attendeeName,
        requestedSlot: parsed.start,
        status: "rejected_busy"
      });
    }
    return {
      confirmed: false,
      reason: "That slot is not available. Offer one of the returned availability slots instead.",
      alternatives: availability.slots.slice(0, 5)
    };
  }

  const calendar = calendarClient();
  const response = await calendar.events.insert({
    calendarId: env("GOOGLE_CALENDAR_ID", "primary"),
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: "Scaler interview with Sankalp Shukla",
      description: `Booked by Sankalp's AI representative.\n\n${parsed.notes ?? ""}`,
      attendees: [{ email: parsed.attendeeEmail, displayName: parsed.attendeeName }],
      start: { dateTime: start.toISOString(), timeZone: env("BOOKING_TIMEZONE", DEFAULT_TIMEZONE) },
      end: { dateTime: end.toISOString(), timeZone: env("BOOKING_TIMEZONE", DEFAULT_TIMEZONE) },
      conferenceData: {
        createRequest: {
          requestId: `sankalp-scaler-${Date.now()}`
        }
      }
    }
  });

  if (hasDatabase()) {
    await insertBookingAudit({
      attendeeEmail: parsed.attendeeEmail,
      attendeeName: parsed.attendeeName,
      requestedSlot: parsed.start,
      status: "confirmed",
      calendarEventId: response.data.id ?? undefined
    });
  }

  return {
    confirmed: true,
    eventId: response.data.id,
    eventLink: response.data.htmlLink,
    meetLink: response.data.hangoutLink
  };
}

async function getBusyBlocks(from: Date, to: Date, timezone: string) {
  const calendar = calendarClient();
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: timezone,
      items: [{ id: env("GOOGLE_CALENDAR_ID", "primary") }]
    }
  });
  const calendarId = env("GOOGLE_CALENDAR_ID", "primary");
  return (response.data.calendars?.[calendarId]?.busy ?? [])
    .filter((item) => item.start && item.end)
    .map((item) => ({ start: new Date(item.start!), end: new Date(item.end!) }));
}

function calendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET")
  );
  oauth2Client.setCredentials({
    refresh_token: requireEnv("GOOGLE_REFRESH_TOKEN")
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

function nextSearchStart(now: Date) {
  const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
  oneHour.setMinutes(0, 0, 0);
  return oneHour;
}

function buildSlots(from: Date, to: Date, durationMinutes: number, busy: Array<{ start: Date; end: Date }>) {
  const slots: Array<{ start: string; end: string }> = [];
  const cursor = new Date(from);
  cursor.setMinutes(Math.ceil(cursor.getMinutes() / 30) * 30, 0, 0);

  while (cursor < to) {
    const end = new Date(cursor.getTime() + durationMinutes * 60 * 1000);
    if (isWeekdayBusinessSlot(cursor, end) && !overlapsBusy(cursor, end, busy)) {
      slots.push({ start: cursor.toISOString(), end: end.toISOString() });
    }
    cursor.setMinutes(cursor.getMinutes() + 30);
  }
  return slots;
}

function isWeekdayBusinessSlot(start: Date, end: Date) {
  const localStart = new Date(start.toLocaleString("en-US", { timeZone: DEFAULT_TIMEZONE }));
  const localEnd = new Date(end.toLocaleString("en-US", { timeZone: DEFAULT_TIMEZONE }));
  const day = localStart.getDay();
  if (day === 0 || day === 6) return false;
  const startMinutes = localStart.getHours() * 60 + localStart.getMinutes();
  const endMinutes = localEnd.getHours() * 60 + localEnd.getMinutes();
  return startMinutes >= 10 * 60 && endMinutes <= 18 * 60;
}

function overlapsBusy(start: Date, end: Date, busy: Array<{ start: Date; end: Date }>) {
  return busy.some((block) => start < block.end && end > block.start);
}
