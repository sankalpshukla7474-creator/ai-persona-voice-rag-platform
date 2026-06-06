import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export type CorpusChunk = {
  id: string;
  sourceType: "resume" | "github" | "portfolio";
  sourceLabel: string;
  sourceUrl?: string | null;
  repo?: string | null;
  path?: string | null;
  commitSha?: string | null;
  content: string;
  score?: number;
};

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false }
    });
  }
  return pool;
}

export async function ensureSchema() {
  const db = getPool();
  await db.query(`create extension if not exists vector`);
  await db.query(`
    create table if not exists corpus_chunks (
      id text primary key,
      source_type text not null,
      source_label text not null,
      source_url text,
      repo text,
      path text,
      commit_sha text,
      content text not null,
      embedding vector(1536) not null,
      created_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create index if not exists corpus_chunks_embedding_idx
    on corpus_chunks using ivfflat (embedding vector_cosine_ops)
    with (lists = 100)
  `);
  await db.query(`
    create table if not exists eval_runs (
      id bigserial primary key,
      kind text not null,
      metrics jsonb not null,
      notes text,
      created_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create table if not exists booking_audit (
      id bigserial primary key,
      attendee_email text,
      attendee_name text,
      requested_slot timestamptz,
      status text not null,
      calendar_event_id text,
      transcript jsonb,
      created_at timestamptz not null default now()
    )
  `);
}

export async function replaceChunks(chunks: Array<CorpusChunk & { embedding: number[] }>) {
  const db = getPool();
  await ensureSchema();
  await db.query("delete from corpus_chunks");
  for (const chunk of chunks) {
    await db.query(
      `insert into corpus_chunks
        (id, source_type, source_label, source_url, repo, path, commit_sha, content, embedding)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::vector)`,
      [
        chunk.id,
        chunk.sourceType,
        chunk.sourceLabel,
        chunk.sourceUrl ?? null,
        chunk.repo ?? null,
        chunk.path ?? null,
        chunk.commitSha ?? null,
        chunk.content,
        vectorLiteral(chunk.embedding)
      ]
    );
  }
}

export async function searchChunks(embedding: number[], limit = 6): Promise<CorpusChunk[]> {
  const db = getPool();
  const result = await db.query(
    `select id, source_type, source_label, source_url, repo, path, commit_sha, content,
            1 - (embedding <=> $1::vector) as score
     from corpus_chunks
     order by embedding <=> $1::vector
     limit $2`,
    [vectorLiteral(embedding), limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    repo: row.repo,
    path: row.path,
    commitSha: row.commit_sha,
    content: row.content,
    score: Number(row.score)
  }));
}

export async function insertEvalRun(kind: string, metrics: unknown, notes?: string) {
  const db = getPool();
  await ensureSchema();
  await db.query("insert into eval_runs (kind, metrics, notes) values ($1, $2, $3)", [
    kind,
    JSON.stringify(metrics),
    notes ?? null
  ]);
}

export async function insertBookingAudit(input: {
  attendeeEmail?: string;
  attendeeName?: string;
  requestedSlot?: string;
  status: string;
  calendarEventId?: string;
  transcript?: unknown;
}) {
  const db = getPool();
  await ensureSchema();
  await db.query(
    `insert into booking_audit
      (attendee_email, attendee_name, requested_slot, status, calendar_event_id, transcript)
     values ($1,$2,$3,$4,$5,$6)`,
    [
      input.attendeeEmail ?? null,
      input.attendeeName ?? null,
      input.requestedSlot ?? null,
      input.status,
      input.calendarEventId ?? null,
      input.transcript ? JSON.stringify(input.transcript) : null
    ]
  );
}

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}
