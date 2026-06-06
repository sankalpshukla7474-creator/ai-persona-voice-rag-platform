import { availabilitySchema, getAvailability } from "@/lib/calendar";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = availabilitySchema.parse(await request.json());
    return Response.json(await getAvailability(input));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Availability lookup failed",
        setupRequired: true
      },
      { status: 503 }
    );
  }
}
