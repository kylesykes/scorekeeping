import { useState, useRef, useEffect } from "react";
import { evaluateMath } from "../lib/math";
import styles from "./QuickScoreModal.module.css";

export default function QuickScoreModal({ player, initialFormula, onSave, onDismiss }) {
  const [val, setVal] = useState(initialFormula || "");
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus the input when modal opens.
    if (inputRef.current) {
      inputRef.current.focus();
      // Move cursor to the end
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value !== "" && value !== "-" && !/^[0-9+\-*\/().\s]*$/.test(value)) return;
    setVal(value);
  };

  const handleSave = () => {
    const text = val.trim() === "" ? "0" : val;
    const num = evaluateMath(text);
    if (num === null) {
      onDismiss(); // just ignore if invalid math
      return;
    }
    onSave(text, num);
  };

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
          <div className={styles.name}>{player.name}'s Score</div>
        </div>

        <div className={styles.body}>
          <input
            ref={inputRef}
            className={styles.input}
            value={val}
            onChange={handleChange}
            placeholder="e.g. 10 + 5"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") onDismiss();
            }}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onDismiss}>
            Cancel
          </button>
          <button className={styles.btnSave} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
