-- ============================================================================
-- 0003 · Base de conocimiento (RAG) + Chat personalizado
-- Embeddings de Gemini text-embedding-004 → 768 dimensiones
-- ============================================================================

create extension if not exists "vector";

-- ---------------------------------------------------------------------------
-- Documentos de conocimiento (los sube el equipo / admin)
--   kind: propuesta | logro | desmentido | biografia | faq | otro
-- ---------------------------------------------------------------------------
create table if not exists public.kb_documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  kind        text not null default 'otro',
  source_url  text,
  region      text,                      -- para logros/propuestas territoriales
  published   boolean not null default true,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Fragmentos vectorizados
create table if not exists public.kb_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.kb_documents (id) on delete cascade,
  content     text not null,
  token_count int,
  chunk_index int not null default 0,
  embedding   vector(768),
  created_at  timestamptz not null default now()
);

-- Índice ANN para búsqueda por similitud coseno
create index if not exists idx_kb_chunks_embedding
  on public.kb_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists idx_kb_chunks_document on public.kb_chunks (document_id);

-- ---------------------------------------------------------------------------
-- Búsqueda semántica: devuelve los chunks más cercanos a una consulta
-- ---------------------------------------------------------------------------
create or replace function public.match_kb_chunks(
  query_embedding vector(768),
  match_count int default 6,
  similarity_threshold float default 0.5,
  filter_kind text default null
) returns table (
  chunk_id    uuid,
  document_id uuid,
  title       text,
  kind        text,
  source_url  text,
  content     text,
  similarity  float
)
language sql stable set search_path = public as $$
  select
    c.id, c.document_id, d.title, d.kind, d.source_url, c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.kb_chunks c
  join public.kb_documents d on d.id = c.document_id
  where d.published
    and (filter_kind is null or d.kind = filter_kind)
    and 1 - (c.embedding <=> query_embedding) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- Chat personalizado (historial por usuario)
-- ---------------------------------------------------------------------------
create table if not exists public.chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null default 'Nueva conversación',
  assistant  text not null default 'general', -- general | salud | abogado | beneficios | comparador
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_chat_sessions_user on public.chat_sessions (user_id, updated_at desc);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant', 'system')),
  content    text not null,
  citations  jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_messages_session on public.chat_messages (session_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.kb_documents  enable row level security;
alter table public.kb_chunks     enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Conocimiento: lectura para usuarios autenticados; escritura solo staff
drop policy if exists "kb lectura" on public.kb_documents;
create policy "kb lectura" on public.kb_documents
  for select using (published or public.is_staff());
drop policy if exists "kb escritura staff" on public.kb_documents;
create policy "kb escritura staff" on public.kb_documents
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "chunks lectura" on public.kb_chunks;
create policy "chunks lectura" on public.kb_chunks
  for select using (true);
drop policy if exists "chunks escritura staff" on public.kb_chunks;
create policy "chunks escritura staff" on public.kb_chunks
  for all using (public.is_staff()) with check (public.is_staff());

-- Chat: estrictamente privado por usuario
drop policy if exists "mis sesiones" on public.chat_sessions;
create policy "mis sesiones" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mis mensajes" on public.chat_messages;
create policy "mis mensajes" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
