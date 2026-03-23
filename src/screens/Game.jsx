import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useIdentity } from "../hooks/useIdentity";
import { useSession } from "../hooks/useSession";
import { useRounds } from "../hooks/useRounds";
import Leaderboard from "../components/Leaderboard";
import RoundsTable from "../components/RoundsTable";
import ShareModal from "../components/ShareModal";
import styles from "./Game.module.css";

export default function Game() {
  const { code } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { deviceId, name } = useIdentity();
  const { session, players, join, addPlayer, removePlayer } = useSession(code);
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
  const joinedRef = useRef(false);

  // Auto-join if the user has a name but hasn't joined this session
  useEffect(() => {
    if (name && deviceId && code && !joinedRef.current) {
      joinedRef.current = true;
      join({ code, playerName: name, deviceId });
    }
  }, [name, deviceId, code, join]);

  // Show share modal on first visit for the creator (?new=1)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowShare(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleNewRound = async () => {
    await createRound();
    setTab("rounds");
  };

  const handleAddPlayer = async () => {
    const playerName = prompt("Player name:");
    if (!playerName?.trim()) return;
    await addPlayer(playerName.trim());
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
          <button className={styles.headerBtn} onClick={handleAddPlayer}>
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
          players={players}
          rounds={rounds}
          scoresByRound={scoresByRound}
          totals={totals}
          onScore={upsertScore}
          onDeleteRound={deleteRound}
          onRemovePlayer={removePlayer}
          deviceId={deviceId}
        />
      )}

      {showShare && (
        <ShareModal code={code} onDismiss={() => setShowShare(false)} />
      )}
    </div>
  );
}
