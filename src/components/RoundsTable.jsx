import { useState, useCallback, useRef, useEffect } from "react";
import { evaluateMath } from "../lib/math";
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

  const getValue = (roundId, playerId) => {
    const key = cellKey(roundId, playerId);
    if (key in inputs) return inputs[key];
    const saved = scoresByRound[roundId]?.[playerId];
    return saved?.score !== undefined ? String(saved.score) : "";
  };

  const handleFocus = (roundId, playerId) => {
    const key = cellKey(roundId, playerId);
    if (key in inputs) return;
    const saved = scoresByRound[roundId]?.[playerId];
    if (saved?.formula) {
      setInputs((prev) => ({ ...prev, [key]: saved.formula }));
    } else if (saved?.score !== undefined) {
      setInputs((prev) => ({ ...prev, [key]: String(saved.score) }));
    }
    setFocusedCell({ roundId, playerId });
  };

  const handleChange = (roundId, playerId, value) => {
    if (value !== "" && value !== "-" && !/^[0-9+\-*\/().\s]*$/.test(value)) return;
    setInputs((prev) => ({ ...prev, [cellKey(roundId, playerId)]: value }));
  };

  const handleBlur = useCallback(
    (roundId, playerId) => {
      const key = cellKey(roundId, playerId);
      let val = inputs[key];
      if (val === undefined) return;
      
      if (val === "" || val === "-") {
        val = "0";
      }
      
      const num = evaluateMath(val);
      if (num === null) return;

      onScore({ roundId, playerId, score: num, formula: val, deviceId });
      setInputs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      // Important to use a small timeout to allow clicking adjacent buttons before bar vanishes
      setTimeout(() => {
         setFocusedCell(null);
      }, 50);
    },
    [inputs, onScore, deviceId]
  );

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
                <td key={p.id} className={`${styles.scoreCell} ${changedCells[cellKey(round.id, p.id)] ? styles.remoteUpdateHighlight : ""}`}>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={styles.scoreInput}
                    placeholder="—"
                    value={getValue(round.id, p.id)}
                    onChange={(e) =>
                      handleChange(round.id, p.id, e.target.value)
                    }
                    onFocus={() => handleFocus(round.id, p.id)}
                    onBlur={() => handleBlur(round.id, p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.target.blur();
                    }}
                  />
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
        <div className={styles.tableHelperRow}>
          {["+", "-", "*", "/"].map((sym) => (
            <button
              key={sym}
              type="button"
              className={styles.tableHelperBtn}
              onMouseDown={(e) => {
                e.preventDefault();
                const currentValue = getValue(focusedCell.roundId, focusedCell.playerId);
                handleChange(focusedCell.roundId, focusedCell.playerId, currentValue + sym);
              }}
            >
              {sym}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
