import { adminToken } from "@/lib/env";
import { runEvaluationSuite } from "@/lib/run-evals";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const token = request.headers.get("x-admin-token") ?? "";
  if (token !== adminToken()) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await runEvaluationSuite());
}
