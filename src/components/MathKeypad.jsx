import { useEffect } from "react";
import { evaluateMath } from "../lib/math";
import styles from "./MathKeypad.module.css";

const KEYS = [
  ["7", "8", "9", "/"],
  ["4", "5", "6", "*"],
  ["1", "2", "3", "-"],
  ["0", "(", ")", "+"],
];

const DISPLAY_MAP = { "/": "÷", "*": "×" };

export default function MathKeypad({ value, onChange, onSubmit, onCancel }) {
  const preview = evaluateMath(value || "0");

  const handleKey = (key) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
    } else if (key === "✓") {
      const text = value.trim() === "" ? "0" : value;
      const num = evaluateMath(text);
      if (num !== null) {
        onSubmit(text, num);
      }
    } else if ("0123456789".includes(key) && value === "0") {
      onChange(key);
    } else {
      onChange(value + key);
    }
  };

  // Desktop keyboard support
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleKey("✓");
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel?.();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleKey("⌫");
      } else if (/^[0-9+\-*\/()]$/.test(e.key)) {
        e.preventDefault();
        handleKey(e.key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className={styles.keypad}>
      <div className={styles.display}>
        <div className={styles.formula}>{value || "0"}</div>
        {value && preview !== null && (
          <div className={styles.preview}>= {preview}</div>
        )}
      </div>
      <div className={styles.grid}>
        {KEYS.flat().map((key, i) => (
          <button
            key={`${key}-${i}`}
            type="button"
            className={`${styles.key} ${
              "+-*/".includes(key) ? styles.keyOp :
              key === "(" || key === ")" ? styles.keyParen : ""
            }`}
            onClick={() => handleKey(key)}
          >
            {DISPLAY_MAP[key] || key}
          </button>
        ))}
      </div>
      <div className={styles.bottomRow}>
        <button
          type="button"
          className={`${styles.key} ${styles.keyDel} ${styles.keyWide}`}
          onClick={() => handleKey("⌫")}
        >
          ⌫
        </button>
        <button
          type="button"
          className={`${styles.key} ${styles.keySubmit} ${styles.keyWide}`}
          onClick={() => handleKey("✓")}
        >
          ✓
        </button>
      </div>
      {onCancel && (
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}
