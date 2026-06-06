import { bookingSchema, bookInterview } from "@/lib/calendar";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = bookingSchema.parse(await request.json());
    return Response.json(await bookInterview(input));
  } catch (error) {
    return Response.json(
      {
        confirmed: false,
        error: error instanceof Error ? error.message : "Booking failed",
        setupRequired: true
      },
      { status: 503 }
    );
  }
}
