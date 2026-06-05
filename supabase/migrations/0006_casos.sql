-- ============================================================================
-- 0006 · Casos del usuario (histórico con etiquetas)
-- Cada chat_session se vuelve un "caso": categoría, estado, etiquetas e intake.
-- ============================================================================

alter table public.chat_sessions
  add column if not exists category text,                          -- salud | abogado | beneficios | comparador | verificador
  add column if not exists status   text not null default 'abierto', -- abierto | en_proceso | resuelto
  add column if not exists tags     text[] not null default '{}',
  add column if not exists intake   jsonb  not null default '{}';   -- datos del flujo guiado

create index if not exists idx_chat_sessions_tags
  on public.chat_sessions using gin (tags);
create index if not exists idx_chat_sessions_user_status
  on public.chat_sessions (user_id, status);

-- (RLS ya existente en chat_sessions: cada usuario ve/edita solo lo suyo)
