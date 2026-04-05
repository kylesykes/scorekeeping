import { useState } from "react";
import MathKeypad from "./MathKeypad";
import styles from "./QuickScoreModal.module.css";

export default function QuickScoreModal({ player, initialFormula, onSave, onDismiss }) {
  const [val, setVal] = useState(initialFormula || "");

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
        </div>

        <MathKeypad
          value={val}
          onChange={setVal}
          onSubmit={onSave}
          onCancel={onDismiss}
        />
      </div>
    </div>
  );
}
