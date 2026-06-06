import { z } from "zod";
import { retrieveProfile } from "@/lib/retrieval";

export const runtime = "nodejs";

const schema = z.object({
  query: z.string().min(2),
  limit: z.number().int().min(1).max(12).default(6)
});

export async function POST(request: Request) {
  const input = schema.parse(await request.json());
  return Response.json(await retrieveProfile(input.query, input.limit));
}
