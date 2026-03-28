import { useState, useRef, useEffect } from "react";
import styles from "./ShareModal.module.css";

export default function AddPlayerModal({ onAdd, onDismiss }) {
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
    inputRef.current?.focus();
  };

  const handleAddAndClose = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    onDismiss();
  };

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.label}>Add a player</p>
        <form onSubmit={handleAddAndClose} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name"
            maxLength={24}
            style={{
              padding: "0.75rem",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "1px solid var(--color-border, rgba(255, 255, 255, 0.15))",
              background: "var(--color-bg, #111)",
              color: "var(--color-text, #fff)",
              outline: "none",
            }}
          />
          <div className={styles.actions}>
            <button type="button" className={styles.actionBtn} onClick={handleAdd} disabled={!name.trim()}>
              Add Another
            </button>
            <button type="submit" className={styles.actionBtn} onClick={handleAddAndClose} disabled={!name.trim()}>
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
