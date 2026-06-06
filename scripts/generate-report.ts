import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

dotenv.config({ path: ".env.local" });
dotenv.config();

const outputPath = path.resolve("docs", "eval-report.pdf");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const doc = new PDFDocument({ size: "LETTER", margin: 54 });
doc.pipe(fs.createWriteStream(outputPath));

doc.font("Helvetica-Bold").fontSize(18).text("Scaler AI Persona Evaluation Report");
doc.moveDown(0.4);
doc.font("Helvetica").fontSize(9).fillColor("#555").text(`Generated: ${new Date().toISOString()}`);
doc.moveDown(1);

section("Voice Quality", [
  "Measure first-response latency from call connect to first audible token across at least 5 Vapi/Twilio calls.",
  "Record transcription quality by manually labeling misunderstood turns / total turns.",
  "Report booking task completion as successful confirmed calendar events / attempted booking calls."
]);

section("Chat Groundedness", [
  "Run `npm run evals` after ingestion. Use the golden/adversarial Q&A set to estimate hallucination rate.",
  "Retrieval quality: inspect whether top 5 chunks contain relevant resume/GitHub evidence for each answerable question.",
  "Manual label answers as grounded, unsupported, or refusal. Unsupported factual claims count as hallucinations."
]);

section("Failure Modes Found", [
  "Calendar credentials missing: booking cannot complete. Fix: explicit env validation and honest tool error.",
  "Sparse GitHub README coverage: repo questions may lack design rationale. Fix: ingest metadata, files, and commits.",
  "Prompt injection attempts: user asks to ignore grounding. Fix: system policy plus refusal tests."
]);

section("Tradeoff", [
  "Used `text-embedding-3-small` instead of larger embeddings to reduce cost and ingestion latency. This is enough for a personal corpus; upgrade to larger embeddings if recall is weak."
]);

section("Two More Weeks", [
  "Add a larger labeled eval set, live observability dashboard, call recording review workflow, repo-level summarization jobs, and a fallback Cal.com booking link for calendar API outages."
]);

doc.end();
console.log(outputPath);

function section(title: string, bullets: string[]) {
  doc.fillColor("#111").font("Helvetica-Bold").fontSize(12).text(title);
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(9.5).fillColor("#222");
  for (const bullet of bullets) {
    doc.text(`- ${bullet}`, { lineGap: 2 });
  }
  doc.moveDown(0.8);
}
