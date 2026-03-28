import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useIdentity } from "../hooks/useIdentity";
import { useSession } from "../hooks/useSession";
import { useRounds } from "../hooks/useRounds";
import Leaderboard from "../components/Leaderboard";
import RoundsTable from "../components/RoundsTable";
import ShareModal from "../components/ShareModal";
import AddPlayerModal from "../components/AddPlayerModal";
import useWakeLock from "../hooks/useWakeLock";
import styles from "./Game.module.css";

export default function Game() {
  const { code } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { deviceId } = useIdentity();
  useWakeLock();
  const { session, players, addPlayer, removePlayer } = useSession(code);
  const {
    rounds,
    totals,
    scoresByRound,
    createRound,
    upsertScore,
    deleteRound,
  } = useRounds(code);

  const [tab, setTab] = useState("leaderboard");
  const [showShare, setShowShare] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // Show share modal on first visit for the creator (?new=1)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowShare(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Player display order — persisted to localStorage per session
  const orderKey = `tally_player_order_${code}`;
  const [playerOrder, setPlayerOrder] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(orderKey)) ?? [];
    } catch {
      return [];
    }
  });

  // Sync order to localStorage
  useEffect(() => {
    if (playerOrder.length > 0) {
      localStorage.setItem(orderKey, JSON.stringify(playerOrder));
    }
  }, [playerOrder, orderKey]);

  // Ordered players: use saved order, append any new players at the end
  const orderedPlayers = useMemo(() => {
    if (playerOrder.length === 0) return players;
    const byId = new Map(players.map((p) => [p.id, p]));
    const ordered = playerOrder
      .filter((id) => byId.has(id))
      .map((id) => byId.get(id));
    // Append players not in the saved order
    const inOrder = new Set(playerOrder);
    for (const p of players) {
      if (!inOrder.has(p.id)) ordered.push(p);
    }
    return ordered;
  }, [players, playerOrder]);

  const handleMovePlayer = useCallback(
    (playerId, direction) => {
      const ids = orderedPlayers.map((p) => p.id);
      const idx = ids.indexOf(playerId);
      if (idx < 0) return;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= ids.length) return;
      const next = [...ids];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      setPlayerOrder(next);
    },
    [orderedPlayers]
  );

  const handleNewRound = async () => {
    await createRound();
    setTab("rounds");
  };

  const handleAddPlayer = async (playerName) => {
    await addPlayer(playerName);
  };

  // Sort players by total score descending for leaderboard
  const ranked = [...players].sort(
    (a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0)
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.gameName}>
            {session?.game_name || "Game"}
          </h1>
          <p className={styles.meta}>
            {code} · {rounds.length} round{rounds.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.headerBtn}
            onClick={() => setShowShare(true)}
            aria-label="Share"
          >
            Share
          </button>
          <button className={styles.headerBtn} onClick={() => setShowAddPlayer(true)}>
            + Player
          </button>
          <button className={styles.headerBtn} onClick={handleNewRound}>
            + Round
          </button>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "leaderboard" ? styles.tabActive : ""}`}
          onClick={() => setTab("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          className={`${styles.tab} ${tab === "rounds" ? styles.tabActive : ""}`}
          onClick={() => setTab("rounds")}
        >
          Rounds
        </button>
      </div>

      {tab === "leaderboard" ? (
        <Leaderboard players={ranked} totals={totals} rounds={rounds} />
      ) : (
        <RoundsTable
          players={orderedPlayers}
          rounds={rounds}
          scoresByRound={scoresByRound}
          totals={totals}
          onScore={upsertScore}
          onDeleteRound={deleteRound}
          onRemovePlayer={removePlayer}
          onMovePlayer={handleMovePlayer}
          deviceId={deviceId}
        />
      )}

      {showShare && (
        <ShareModal code={code} onDismiss={() => setShowShare(false)} />
      )}

      {showAddPlayer && (
        <AddPlayerModal
          onAdd={handleAddPlayer}
          onDismiss={() => setShowAddPlayer(false)}
        />
      )}
    </div>
  );
}
