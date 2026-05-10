import { useState } from "react";
import MathKeypad from "./MathKeypad";
import styles from "./QuickScoreModal.module.css";

export default function QuickScoreModal({
  player,
  lastEntry,
  onSave,
  onDelete,
  onDismiss,
}) {
  const [mode, setMode] = useState("append"); // 'append' | 'edit'
  const [val, setVal] = useState("");

  const enterEditMode = () => {
    if (!lastEntry) return;
    setMode("edit");
    setVal(lastEntry.formula || String(lastEntry.score));
  };

  const exitEditMode = () => {
    setMode("append");
    setVal("");
  };

  const handleSubmit = (formula, score) => {
    onSave({
      mode,
      scoreId: mode === "edit" ? lastEntry?.id : null,
      score,
      formula,
    });
  };

  const handleDelete = () => {
    if (!lastEntry) return;
    onDelete(lastEntry.id);
  };

  const lastFormulaDisplay =
    lastEntry && lastEntry.formula && lastEntry.formula !== String(lastEntry.score)
      ? `${lastEntry.formula} = ${lastEntry.score}`
      : lastEntry
        ? String(lastEntry.score)
        : null;

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div
            className={styles.avatar}
            style={{ backgroundColor: player.color ?? "#888" }}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.name}>{player.name}</div>
          {mode === "edit" && (
            <button className={styles.modeUndo} onClick={exitEditMode}>
              Cancel edit
            </button>
          )}
        </div>

        {lastEntry && (
          <div className={styles.lastEntryWrap}>
            <div className={styles.lastEntryLabel}>
              {mode === "edit" ? "Editing last entry" : "Last entry"}
            </div>
            <button
              type="button"
              className={`${styles.lastEntryChip} ${mode === "edit" ? styles.lastEntryChipActive : ""}`}
              onClick={mode === "append" ? enterEditMode : undefined}
            >
              <span className={styles.lastEntryValue}>{lastFormulaDisplay}</span>
              {mode === "edit" ? (
                <span
                  className={styles.lastEntryDelete}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  Delete
                </span>
              ) : (
                <span className={styles.lastEntryEditHint}>Tap to edit</span>
              )}
            </button>
          </div>
        )}

        <MathKeypad
          value={val}
          onChange={setVal}
          onSubmit={handleSubmit}
          onCancel={onDismiss}
        />
      </div>
    </div>
  );
}
