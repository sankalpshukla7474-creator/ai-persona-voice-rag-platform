import { adminToken } from "@/lib/env";
import { runIngestion } from "@/lib/run-ingestion";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const token = request.headers.get("x-admin-token") ?? "";
  if (token !== adminToken()) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await runIngestion());
}
