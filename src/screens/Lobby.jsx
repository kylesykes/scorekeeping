import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIdentity } from "../hooks/useIdentity";
import { useSession } from "../hooks/useSession";
import { useRounds } from "../hooks/useRounds";
import PlayerRow from "../components/PlayerRow";
import styles from "./Lobby.module.css";

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { deviceId, name, setName } = useIdentity();
  const { session, players, join, addPlayer, error } = useSession(code);
  const { createRound } = useRounds(code);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-join if the user has a name and hasn't joined yet
  useEffect(() => {
    if (name && !joined && code) {
      join({ code, playerName: name, deviceId }).then((sess) => {
        if (sess) setJoined(true);
      });
    }
  }, [name, joined, code, deviceId, join]);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    await addPlayer(newPlayerName.trim());
    setNewPlayerName("");
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — select-and-copy won't work everywhere but that's fine
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my Tally game!", url });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  const handleStartGame = async () => {
    // Create the first round, then navigate to the game screen
    await createRound();
    navigate(`/${code}/game`);
  };

  // If the user hasn't set a name yet, prompt them
  if (!name) {
    return (
      <div className={styles.container}>
        <div className={styles.namePrompt}>
          <p className={styles.nameLabel}>Enter your name to join</p>
          <input
            type="text"
            className={styles.nameInput}
            placeholder="Your name"
            autoFocus
            maxLength={24}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                setName(e.target.value.trim());
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.codeSection}>
        <p className={styles.codeLabel}>SESSION CODE</p>
        <div className={styles.codeDisplay}>
          {(code ?? "").split("").map((char, i) => (
            <div key={i} className={styles.codeChar}>
              {char}
            </div>
          ))}
        </div>
        <div className={styles.shareRow}>
          <button className={styles.shareBtn} onClick={handleCopy}>
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button className={styles.shareBtn} onClick={handleShare}>
            Share
          </button>
        </div>
      </div>

      <div className={styles.playersSection}>
        <p className={styles.playersLabel}>
          PLAYERS · {players.length}
        </p>
        <div className={styles.playerList}>
          {players.map((p) => (
            <PlayerRow key={p.id} player={p} deviceId={deviceId} />
          ))}
        </div>

        <div className={styles.addPlayerRow}>
          <input
            type="text"
            className={styles.addPlayerInput}
            placeholder="Add a player manually…"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
            maxLength={24}
          />
          <button
            className={styles.addPlayerBtn}
            onClick={handleAddPlayer}
            disabled={!newPlayerName.trim()}
          >
            Add
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.startBtn}
        onClick={handleStartGame}
        disabled={players.length < 2}
      >
        Start game
      </button>
    </div>
  );
}
