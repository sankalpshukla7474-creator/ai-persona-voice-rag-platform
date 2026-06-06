create extension if not exists vector;

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
);

create index if not exists corpus_chunks_embedding_idx
on corpus_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create table if not exists eval_runs (
  id bigserial primary key,
  kind text not null,
  metrics jsonb not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists booking_audit (
  id bigserial primary key,
  attendee_email text,
  attendee_name text,
  requested_slot timestamptz,
  status text not null,
  calendar_event_id text,
  transcript jsonb,
  created_at timestamptz not null default now()
);
