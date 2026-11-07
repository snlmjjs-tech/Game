-- Berry Run Online · esquema de Supabase
-- Pégalo en SQL Editor y ejecútalo una vez.
-- Antes: Authentication › Sign In / Providers → activa «Allow anonymous sign-ins»
-- (el navegador del profesor entra como usuario anónimo para ser dueño de su sala).

create table if not exists public.rooms (
  code        text primary key check (code ~ '^[0-9]{6}$'),
  host_id     uuid not null default auth.uid(),
  quiz        jsonb not null,
  status      text not null default 'open' check (status in ('open','closed')),
  created_at  timestamptz not null default now()
);

create table if not exists public.results (
  id           bigint generated always as identity primary key,
  room_code    text not null references public.rooms(code) on delete cascade,
  player_id    text not null,
  player_name  text not null,
  level_idx    int  not null,
  level_name   text,
  points       int  not null,
  correct      int  not null default 0,
  position     int,
  created_at   timestamptz not null default now()
);
create index if not exists results_room_idx on public.results(room_code);

alter table public.rooms   enable row level security;
alter table public.results enable row level security;

-- Salas: cualquiera con el código puede leerla (los estudiantes necesitan las preguntas);
-- solo su profesor (usuario anónimo creador) puede crearla, cerrarla o borrarla.
drop policy if exists rooms_read   on public.rooms;
drop policy if exists rooms_insert on public.rooms;
drop policy if exists rooms_update on public.rooms;
drop policy if exists rooms_delete on public.rooms;
create policy rooms_read   on public.rooms for select using (true);
create policy rooms_insert on public.rooms for insert to authenticated with check (host_id = auth.uid());
create policy rooms_update on public.rooms for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy rooms_delete on public.rooms for delete to authenticated using (host_id = auth.uid());

-- Resultados: solo el profesor dueño de la sala puede guardarlos y verlos.
drop policy if exists results_read   on public.results;
drop policy if exists results_insert on public.results;
create policy results_read on public.results for select to authenticated
  using (exists (select 1 from public.rooms r where r.code = room_code and r.host_id = auth.uid()));
create policy results_insert on public.results for insert to authenticated
  with check (exists (select 1 from public.rooms r where r.code = room_code and r.host_id = auth.uid()));

-- Permisos de tabla: los proyectos nuevos de Supabase NO los dan solos para tablas creadas con SQL.
-- (RLS decide qué filas; GRANT decide si el rol puede tocar la tabla.)
grant usage on schema public to anon, authenticated;
grant select on public.rooms to anon, authenticated;
grant insert, update, delete on public.rooms to authenticated;
grant select, insert on public.results to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Opcional: borrar salas de más de 2 días (requiere la extensión pg_cron)
-- select cron.schedule('berry-clean', '0 4 * * *', $$delete from public.rooms where created_at < now() - interval '2 days'$$);
