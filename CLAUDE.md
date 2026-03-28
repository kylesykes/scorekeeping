# NerdScore

A real-time game night scoreboard by Nerd Walk. No accounts, no friction — just open it, share a code, and start tracking scores together.

## Intent

NerdScore replaces the paper scorepad at board game night. One person starts a session, shares a 4-character code (or QR), and everyone at the table joins from their phone. Scores sync live across all devices via Supabase Realtime. Sessions expire after 24 hours — this is throwaway, not archival.

## Tech stack

- **Frontend:** React 19 + Vite, CSS Modules for styling
- **Backend:** Supabase (Postgres + Realtime subscriptions)
- **Routing:** React Router v7 with client-side routing (SPA)
- **Hosting:** Vercel (see `vercel.json` for SPA rewrites)
- **No auth** — identity is a localStorage UUID (`device_id`) + player name

## Prerequisites

- Node.js (see `.nvmrc` — currently v22)
- nvm: run `nvm use` before any npm commands

## Commands

```
nvm use
npm install
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # production build
npm run preview    # preview production build locally
npm run lint       # ESLint
```

## Project structure

```
src/
├── screens/          # Page-level components (routes)
│   ├── Landing.jsx   # Home page: enter name, start or join game
│   └── Game.jsx      # Main game screen: leaderboard + rounds table
├── components/       # Reusable UI components
│   ├── Leaderboard.jsx   # Ranked player list sorted by total score
│   ├── RoundsTable.jsx   # Editable score grid (players × rounds)
│   ├── PlayerRow.jsx     # Single player row in the rounds table
│   └── ShareModal.jsx    # QR code + share link modal
├── hooks/            # Custom React hooks (all app logic lives here)
│   ├── useIdentity.js    # Device UUID + player name in localStorage
│   ├── useSession.js     # Create/join sessions, live player list
│   └── useRounds.js      # Rounds, scores, totals, realtime sync
├── lib/
│   ├── supabase.js       # Supabase client init
│   └── colors.js         # Player color assignment
├── App.jsx           # Router setup
└── main.jsx          # Entry point
supabase/
└── schema.sql        # Full database schema, RPC functions, RLS policies
```

## Key concepts

- **Session:** A game identified by a 4-char alphanumeric code (e.g. `K7QM`). Generated server-side to avoid collisions. Expires after 24h.
- **Player:** Tied to a session. Has a `device_id` (for real devices) or `null` (for manually-added players at the table who don't have the app open).
- **Round:** Sequential numbered rounds within a session. Created via an RPC function to prevent race conditions.
- **Score:** One score per player per round. Upserted (insert or update on conflict).
- **Realtime:** Players, rounds, and scores tables all publish changes via Supabase Realtime. Hooks subscribe and re-fetch on any change.

## Routes

- `/` — Landing page (start or join)
- `/:code` — Redirects to `/:code/game`
- `/:code/game` — Main game screen

## Data flow

1. Host creates session → gets a code → navigates to `/:code/game?new=1`
2. `?new=1` triggers the ShareModal so the host can share the code/QR
3. Other players join via code entry on landing or by opening the share link directly
4. Game screen auto-joins the player if they have a name + device ID
5. All data changes (new players, scores, rounds) propagate via Supabase Realtime channels

## Design decisions

- **No auth:** Intentionally frictionless. Identity is just a localStorage UUID. Acceptable for a casual game night tool. RLS is permissive (anon can read/write all active sessions). Should be tightened if the app sees real traction.
- **Re-fetch on change:** Realtime handlers re-fetch the full list rather than diffing individual changes. Simpler and reliable for small datasets.
- **Player ordering:** Persisted per-session in localStorage. Players can be reordered via arrows in the column dropdown.
- **Optimistic updates:** Deletes (rounds, players) are applied to local state immediately, with a fallback re-fetch on failure.
