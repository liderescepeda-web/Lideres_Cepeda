-- ============================================================================
-- 0009 · Clasificación de la base de conocimiento por ÁREA (asistente)
-- area: salud | abogado | beneficios | comparador | logros | verificador | general
-- Permite que cada IA recupere SOLO el conocimiento de su área → respuestas mejores.
-- ============================================================================

alter table public.kb_documents
  add column if not exists area text not null default 'general';

create index if not exists idx_kb_documents_area on public.kb_documents (area);

-- Búsqueda semántica con filtro opcional por área (y por kind, como antes)
create or replace function public.match_kb_chunks(
  query_embedding vector(768),
  match_count int default 6,
  similarity_threshold float default 0.5,
  filter_kind text default null,
  filter_area text default null
) returns table (
  chunk_id    uuid,
  document_id uuid,
  title       text,
  kind        text,
  area        text,
  source_url  text,
  content     text,
  similarity  float
)
language sql stable set search_path = public as $$
  select
    c.id, c.document_id, d.title, d.kind, d.area, d.source_url, c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.kb_chunks c
  join public.kb_documents d on d.id = c.document_id
  where d.published
    and (filter_kind is null or d.kind = filter_kind)
    and (filter_area is null or d.area = filter_area or d.area = 'general')
    and 1 - (c.embedding <=> query_embedding) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
