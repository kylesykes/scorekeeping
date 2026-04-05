import { useState, useCallback, useRef, useEffect } from "react";
import { evaluateMath } from "../lib/math";
import MathKeypad from "./MathKeypad";
import styles from "./RoundsTable.module.css";

export default function RoundsTable({
  players,
  rounds,
  scoresByRound,
  totals,
  onScore,
  onDeleteRound,
  onRemovePlayer,
  onMovePlayer,
  deviceId,
}) {
  // Local input state keyed by `${roundId}-${playerId}`
  const [inputs, setInputs] = useState({});
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [playerMenu, setPlayerMenu] = useState(null); // player id
  const [focusedCell, setFocusedCell] = useState(null);
  const [changedCells, setChangedCells] = useState({});
  const prevScoresRef = useRef(scoresByRound);

  useEffect(() => {
    const prev = prevScoresRef.current;
    let newChanges = {};
    let hasChanges = false;
    for (const rid in scoresByRound) {
      for (const pid in scoresByRound[rid]) {
        const after = scoresByRound[rid][pid];
        const before = prev[rid]?.[pid];
        if (after && before && after.score !== before.score && after.entered_by !== deviceId) {
           newChanges[`${rid}-${pid}`] = Date.now();
           hasChanges = true;
        } else if (after && !before && after.entered_by !== deviceId) {
           newChanges[`${rid}-${pid}`] = Date.now();
           hasChanges = true;
        }
      }
    }
    
    if (hasChanges) {
      setChangedCells(c => ({...c, ...newChanges}));
      setTimeout(() => {
        setChangedCells(c => {
           let next = {...c};
           for (let k in newChanges) delete next[k];
           return next;
        });
      }, 2000);
    }
    prevScoresRef.current = scoresByRound;
  }, [scoresByRound, deviceId]);

  const cellKey = (roundId, playerId) => `${roundId}-${playerId}`;

  const getDisplayValue = (roundId, playerId) => {
    const saved = scoresByRound[roundId]?.[playerId];
    return saved?.score !== undefined ? String(saved.score) : "";
  };

  const openKeypad = (roundId, playerId) => {
    const saved = scoresByRound[roundId]?.[playerId];
    const initial = saved?.formula || (saved?.score !== undefined ? String(saved.score) : "");
    setFocusedCell({ roundId, playerId });
    setInputs((prev) => ({ ...prev, [cellKey(roundId, playerId)]: initial }));
  };

  const handleKeypadChange = (newVal) => {
    if (!focusedCell) return;
    setInputs((prev) => ({ ...prev, [cellKey(focusedCell.roundId, focusedCell.playerId)]: newVal }));
  };

  const handleKeypadSubmit = (formula, score) => {
    if (!focusedCell) return;
    onScore({ roundId: focusedCell.roundId, playerId: focusedCell.playerId, score, formula, deviceId });
    setInputs((prev) => {
      const next = { ...prev };
      delete next[cellKey(focusedCell.roundId, focusedCell.playerId)];
      return next;
    });
    setFocusedCell(null);
  };

  const handleKeypadCancel = () => {
    if (focusedCell) {
      setInputs((prev) => {
        const next = { ...prev };
        delete next[cellKey(focusedCell.roundId, focusedCell.playerId)];
        return next;
      });
    }
    setFocusedCell(null);
  };

  const hasScores = (roundId) =>
    scoresByRound[roundId] && Object.keys(scoresByRound[roundId]).length > 0;

  const handleDeleteRound = (roundId) => {
    if (hasScores(roundId)) {
      setConfirmingDelete(roundId);
    } else {
      onDeleteRound(roundId);
    }
  };

  const handleRemovePlayer = (playerId) => {
    onRemovePlayer(playerId);
    setPlayerMenu(null);
  };

  // Determine leaders (highest total, only if there are scores)
  const leaderIds = (() => {
    const entries = Object.entries(totals);
    if (entries.length === 0) return new Set();
    const max = Math.max(...entries.map(([, v]) => v));
    if (max === 0) return new Set();
    return new Set(entries.filter(([, v]) => v === max).map(([id]) => id));
  })();

  // Show newest rounds first
  const sortedRounds = [...rounds].reverse();

  if (rounds.length === 0) {
    return (
      <p className={styles.empty}>No rounds yet. Tap "+ Round" to get started.</p>
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
                  onClick={() =>
                    setPlayerMenu(playerMenu === p.id ? null : p.id)
                  }
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
            <th className={styles.actionCol}></th>
          </tr>
        </thead>
        <tbody>
          {/* Totals row */}
          <tr className={styles.totalsRow}>
            <td className={styles.roundLabel}>Total</td>
            {players.map((p) => (
              <td key={p.id} className={`${styles.totalCell} ${leaderIds.has(p.id) ? styles.leaderTotal : ""}`}>
                {totals[p.id] ?? 0}
              </td>
            ))}
            <td></td>
          </tr>

          {/* Round rows — newest first, display number from position */}
          {sortedRounds.map((round, idx) => (
            <tr key={round.id} className={styles.roundRow}>
              <td className={styles.roundLabel}>R{rounds.length - idx}</td>
              {players.map((p) => (
                <td
                  key={p.id}
                  className={`${styles.scoreCell} ${changedCells[cellKey(round.id, p.id)] ? styles.remoteUpdateHighlight : ""}`}
                  onClick={() => openKeypad(round.id, p.id)}
                >
                  <div className={styles.scoreInput}>
                    {getDisplayValue(round.id, p.id) || <span className={styles.scorePlaceholder}>—</span>}
                  </div>
                </td>
              ))}
              <td className={styles.actionCell}>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteRound(round.id)}
                  aria-label={`Delete round ${rounds.length - idx}`}
                >
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmingDelete && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <p>This round has scores. Delete everything?</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancel}
                onClick={() => setConfirmingDelete(null)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDelete}
                onClick={() => {
                  onDeleteRound(confirmingDelete);
                  setConfirmingDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {focusedCell && (
        <div className={styles.keypadOverlay} onClick={handleKeypadCancel}>
          <div className={styles.keypadSheet} onClick={(e) => e.stopPropagation()}>
            <MathKeypad
              value={inputs[cellKey(focusedCell.roundId, focusedCell.playerId)] || ""}
              onChange={handleKeypadChange}
              onSubmit={handleKeypadSubmit}
              onCancel={handleKeypadCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
