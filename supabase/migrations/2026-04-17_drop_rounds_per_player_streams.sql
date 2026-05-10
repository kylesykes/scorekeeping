-- Migrate from shared-round scores to per-player score streams.
-- Run this once in the Supabase SQL editor after pulling the code change.
--
-- The app treats a player's Nth entry (by entered_at) as their Nth "round,"
-- so rounds as a database concept go away. Existing rows are preserved by
-- copying round.session_code onto each score before the old tables are dropped.

alter table scores add column if not exists session_code text
  references sessions(code) on delete cascade;

update scores s
   set session_code = r.session_code
  from rounds r
 where s.round_id = r.id
   and s.session_code is null;

-- Scores without a matching round are orphans; drop them.
delete from scores where session_code is null;

alter table scores alter column session_code set not null;

alter table scores drop column if exists round_id;

drop index if exists idx_scores_round;
create index if not exists idx_scores_session on scores(session_code);
create index if not exists idx_scores_player on scores(player_id, entered_at);

drop table if exists rounds cascade;
drop function if exists create_round(text);
