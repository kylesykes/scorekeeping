-- NerdScore: Game Night Scoreboard
-- Supabase schema — run this in the SQL Editor

-- =============================================================
-- Tables
-- =============================================================

create table sessions (
  code        text primary key,            -- 4-char alphanumeric e.g. 'K7QM'
  game_name   text,                        -- optional, e.g. 'Wingspan'
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '24 hours'
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

create table rounds (
  id            uuid primary key default gen_random_uuid(),
  session_code  text not null references sessions(code) on delete cascade,
  round_number  integer not null,
  status        text not null default 'open' check (status in ('open', 'complete')),
  created_at    timestamptz not null default now(),
  unique(session_code, round_number)
);

create index idx_rounds_session on rounds(session_code);

create table scores (
  id          uuid primary key default gen_random_uuid(),
  round_id    uuid not null references rounds(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  score       integer not null,
  entered_by  text,                        -- device_id of who entered this score
  entered_at  timestamptz not null default now(),
  unique(round_id, player_id)
);

create index idx_scores_round on scores(round_id);

-- =============================================================
-- RPC: create a new round with the next round_number
-- Prevents race conditions when two people tap "New round" at once
-- =============================================================

create or replace function create_round(p_session_code text)
returns rounds
language plpgsql
as $$
declare
  v_next integer;
  v_round rounds;
begin
  select coalesce(max(round_number), 0) + 1
    into v_next
    from rounds
   where session_code = p_session_code;

  insert into rounds (session_code, round_number)
  values (p_session_code, v_next)
  returning * into v_round;

  return v_round;
end;
$$;

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
-- Enable Realtime on tables that need live sync
-- =============================================================

alter publication supabase_realtime add table players;
alter publication supabase_realtime add table rounds;
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
alter table rounds enable row level security;
alter table scores enable row level security;

-- Allow all operations for anon users (v1 - no auth)
create policy "anon_all_sessions" on sessions for all using (true) with check (true);
create policy "anon_all_players"  on players  for all using (true) with check (true);
create policy "anon_all_rounds"   on rounds   for all using (true) with check (true);
create policy "anon_all_scores"   on scores   for all using (true) with check (true);
