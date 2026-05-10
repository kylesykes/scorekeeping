-- NerdScore: Game Night Scoreboard
-- Supabase schema — run this in the SQL Editor

-- =============================================================
-- Tables
-- =============================================================

create table sessions (
  code        text primary key,            -- 4-char alphanumeric e.g. 'K7QM'
  game_name   text,                        -- optional, e.g. 'Wingspan'
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '48 hours'
);

create table players (
  id            uuid primary key default gen_random_uuid(),
  session_code  text not null references sessions(code) on delete cascade,
  name          text not null,
  color         text,                      -- hex color for avatar, assigned on join
  device_id     text,                      -- localStorage UUID, null for manually-added players
  is_host       boolean not null default false,
  joined_at     timestamptz not null default now()
);

create index idx_players_session on players(session_code);
create unique index idx_players_device_session on players(session_code, device_id)
  where device_id is not null;             -- one entry per device per session

create table scores (
  id            uuid primary key default gen_random_uuid(),
  session_code  text not null references sessions(code) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,
  score         integer not null,
  formula       text,                        -- optional math formula user typed
  entered_by    text,                        -- device_id of who entered this score
  entered_at    timestamptz not null default now()
);

create index idx_scores_session on scores(session_code);
create index idx_scores_player on scores(player_id, entered_at);

-- =============================================================
-- RPC: generate a unique 4-char session code
-- Retries on collision (very unlikely with ~1.6M combinations)
-- =============================================================

create or replace function generate_session_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no I/L/O/0/1 to avoid confusion
  v_code text;
  attempts integer := 0;
begin
  loop
    v_code := '';
    for i in 1..4 loop
      v_code := v_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;

    -- check for collision
    if not exists (select 1 from sessions where sessions.code = v_code) then
      return v_code;
    end if;

    attempts := attempts + 1;
    if attempts > 10 then
      raise exception 'Could not generate unique session code after 10 attempts';
    end if;
  end loop;
end;
$$;

-- =============================================================
-- Scheduled cleanup: delete expired sessions every hour
-- Requires pg_cron extension (enable via Supabase dashboard first)
-- Cascading FKs automatically clean up players and scores
-- =============================================================

select cron.schedule(
  'cleanup-expired-sessions',
  '0 * * * *',
  $$DELETE FROM sessions WHERE expires_at < now()$$
);

-- =============================================================
-- Enable Realtime on tables that need live sync
-- =============================================================

alter publication supabase_realtime add table players;
alter publication supabase_realtime add table scores;

-- =============================================================
-- Row Level Security
-- For v1 we use permissive policies since there's no auth.
-- The anon key can read/write any active session.
-- This is acceptable for a casual game app but should be
-- tightened if the app gets traction (e.g. edge function proxy).
-- =============================================================

alter table sessions enable row level security;
alter table players enable row level security;
alter table scores enable row level security;

-- Allow all operations for anon users (v1 - no auth)
create policy "anon_all_sessions" on sessions for all using (true) with check (true);
create policy "anon_all_players"  on players  for all using (true) with check (true);
create policy "anon_all_scores"   on scores   for all using (true) with check (true);
