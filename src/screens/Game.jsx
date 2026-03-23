import { useState } from "react";
import { useParams } from "react-router-dom";
import { useIdentity } from "../hooks/useIdentity";
import { useSession } from "../hooks/useSession";
import { useRounds } from "../hooks/useRounds";
import Leaderboard from "../components/Leaderboard";
import RoundsTable from "../components/RoundsTable";
import styles from "./Game.module.css";

export default function Game() {
  const { code } = useParams();
  const { deviceId } = useIdentity();
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

  const handleNewRound = async () => {
    await createRound();
    setTab("rounds");
  };

  const handleAddPlayer = async () => {
    const name = prompt("Player name:");
    if (!name?.trim()) return;
    await addPlayer(name.trim());
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
    </div>
  );
}
