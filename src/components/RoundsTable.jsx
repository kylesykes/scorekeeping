import { useState, useRef, useEffect, useMemo } from "react";
import MathKeypad from "./MathKeypad";
import styles from "./RoundsTable.module.css";

export default function RoundsTable({
  players,
  scoresByPlayer,
  totals,
  maxEntries,
  onUpdateScore,
  onDeleteScore,
  onRemovePlayer,
  onMovePlayer,
  deviceId,
}) {
  const [playerMenu, setPlayerMenu] = useState(null);
  const [focusedScore, setFocusedScore] = useState(null); // { id, playerId, score, formula }
  const [keypadValue, setKeypadValue] = useState("");
  const [changedCells, setChangedCells] = useState({});
  const prevScoresRef = useRef(scoresByPlayer);

  // Highlight cells that were updated remotely
  useEffect(() => {
    const prev = prevScoresRef.current;
    const newChanges = {};
    let hasChanges = false;
    for (const pid in scoresByPlayer) {
      const prevStream = prev[pid] ?? [];
      const prevById = new Map(prevStream.map((s) => [s.id, s]));
      for (const s of scoresByPlayer[pid]) {
        if (s.entered_by === deviceId) continue;
        const before = prevById.get(s.id);
        if (!before) {
          newChanges[s.id] = Date.now();
          hasChanges = true;
        } else if (before.score !== s.score) {
          newChanges[s.id] = Date.now();
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      setChangedCells((c) => ({ ...c, ...newChanges }));
      setTimeout(() => {
        setChangedCells((c) => {
          const next = { ...c };
          for (const k in newChanges) delete next[k];
          return next;
        });
      }, 2000);
    }
    prevScoresRef.current = scoresByPlayer;
  }, [scoresByPlayer, deviceId]);

  const rowIndices = useMemo(() => {
    const arr = [];
    for (let i = 0; i < maxEntries; i++) arr.push(i);
    return arr;
  }, [maxEntries]);

  const openKeypad = (scoreObj) => {
    setFocusedScore(scoreObj);
    setKeypadValue(scoreObj.formula || String(scoreObj.score));
  };

  const handleKeypadSubmit = (formula, score) => {
    if (!focusedScore) return;
    onUpdateScore({ scoreId: focusedScore.id, score, formula, deviceId });
    setFocusedScore(null);
    setKeypadValue("");
  };

  const handleKeypadCancel = () => {
    setFocusedScore(null);
    setKeypadValue("");
  };

  const handleKeypadDelete = () => {
    if (!focusedScore) return;
    onDeleteScore(focusedScore.id);
    setFocusedScore(null);
    setKeypadValue("");
  };

  const handleRemovePlayer = (playerId) => {
    onRemovePlayer(playerId);
    setPlayerMenu(null);
  };

  const leaderIds = (() => {
    const entries = Object.entries(totals);
    if (entries.length === 0) return new Set();
    const max = Math.max(...entries.map(([, v]) => v));
    if (max === 0) return new Set();
    return new Set(entries.filter(([, v]) => v === max).map(([id]) => id));
  })();

  if (maxEntries === 0) {
    return (
      <p className={styles.empty}>
        No scores yet. Tap a player on the leaderboard to add one.
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.roundLabelCol}></th>
            {players.map((p) => (
              <th key={p.id} className={`${styles.playerCol} ${leaderIds.has(p.id) ? styles.leaderCol : ""}`}>
                <button
                  className={styles.playerColBtn}
                  onClick={() => setPlayerMenu(playerMenu === p.id ? null : p.id)}
                >
                  <div
                    className={styles.avatar}
                    style={{ backgroundColor: p.color ?? "#888" }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={styles.playerName}>{p.name}</span>
                </button>
                {playerMenu === p.id && (
                  <div className={styles.playerDropdown}>
                    <div className={styles.moveRow}>
                      <button
                        className={styles.moveBtn}
                        disabled={players.indexOf(p) === 0}
                        onClick={() => {
                          onMovePlayer(p.id, -1);
                          setPlayerMenu(null);
                        }}
                      >
                        &larr;
                      </button>
                      <span className={styles.moveLabel}>Move</span>
                      <button
                        className={styles.moveBtn}
                        disabled={players.indexOf(p) === players.length - 1}
                        onClick={() => {
                          onMovePlayer(p.id, 1);
                          setPlayerMenu(null);
                        }}
                      >
                        &rarr;
                      </button>
                    </div>
                    <button
                      className={styles.playerDropdownDelete}
                      onClick={() => handleRemovePlayer(p.id)}
                    >
                      Remove player
                    </button>
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowIndices.map((idx) => (
            <tr key={idx} className={styles.roundRow}>
              <td className={styles.roundLabel}>{idx + 1}</td>
              {players.map((p) => {
                const stream = scoresByPlayer[p.id] ?? [];
                const entry = stream[idx];
                const highlight = entry && changedCells[entry.id];
                return (
                  <td
                    key={p.id}
                    className={`${styles.scoreCell} ${highlight ? styles.remoteUpdateHighlight : ""}`}
                    onClick={() => entry && openKeypad({ ...entry, playerId: p.id })}
                  >
                    <div className={styles.scoreInput}>
                      {entry ? entry.score : <span className={styles.scorePlaceholder}>—</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {focusedScore && (
        <div className={styles.keypadOverlay} onClick={handleKeypadCancel}>
          <div className={styles.keypadSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.keypadHeader}>
              <span className={styles.keypadEditLabel}>Editing entry</span>
              <button
                className={styles.keypadDeleteBtn}
                onClick={handleKeypadDelete}
                aria-label="Delete entry"
              >
                Delete
              </button>
            </div>
            <MathKeypad
              value={keypadValue}
              onChange={setKeypadValue}
              onSubmit={handleKeypadSubmit}
              onCancel={handleKeypadCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
