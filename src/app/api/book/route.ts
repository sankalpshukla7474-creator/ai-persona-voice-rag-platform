import { bookingSchema, bookInterview } from "@/lib/calendar";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = bookingSchema.parse(await request.json());
    return Response.json(await bookInterview(input));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          confirmed: false,
          error: "Booking requires a valid attendee name, email, and ISO start time.",
          issues: error.issues
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        confirmed: false,
        error: error instanceof Error ? error.message : "Booking failed",
        setupRequired:
          error instanceof Error && error.message.toLowerCase().includes("environment variable")
      },
      { status: 503 }
    );
  }
}
