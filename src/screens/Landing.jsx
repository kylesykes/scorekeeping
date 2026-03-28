import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import styles from "./Landing.module.css";

export default function Landing() {
  const navigate = useNavigate();
  const { create, join, loading, error } = useSession();

  const [codeChars, setCodeChars] = useState(["", "", "", ""]);
  const codeRefs = [useRef(), useRef(), useRef(), useRef()];

  // ---- Start a new game ----
  const handleStart = async () => {
    const sess = await create();
    if (sess) navigate(`/${sess.code}/game?new=1`);
  };

  // ---- Join via code ----
  const handleJoin = async () => {
    const code = codeChars.join("");
    if (code.length < 4) return;
    const sess = await join({ code });
    if (sess) navigate(`/${code.toUpperCase()}/game`);
  };

  // ---- Code input handling ----
  const handleCodeInput = (index, value) => {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const next = [...codeChars];
    next[index] = char;
    setCodeChars(next);
    if (char && index < 3) {
      codeRefs[index + 1].current?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !codeChars[index] && index > 0) {
      codeRefs[index - 1].current?.focus();
    }
    if (e.key === "Enter") handleJoin();
  };

  const codeComplete = codeChars.every((c) => c.length === 1);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>NerdScore</h1>
        <p className={styles.subtitle}>game night scoreboard</p>
      </div>

      <div className={styles.form}>
        <button
          className={styles.primaryBtn}
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? "Creating…" : "Start a game"}
        </button>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <div className={styles.joinRow}>
          <div className={styles.codeInputs}>
            {codeChars.map((char, i) => (
              <input
                key={i}
                ref={codeRefs[i]}
                type="text"
                className={styles.codeChar}
                value={char}
                onChange={(e) => handleCodeInput(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                maxLength={2}
                inputMode="text"
                autoCapitalize="characters"
              />
            ))}
          </div>
          <button
            className={styles.joinBtn}
            onClick={handleJoin}
            disabled={loading || !codeComplete}
          >
            Join
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.footer}>No account needed. Scores sync live.</p>
    </div>
  );
}
