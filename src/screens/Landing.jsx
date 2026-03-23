import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useIdentity } from "../hooks/useIdentity";
import { useSession } from "../hooks/useSession";
import styles from "./Landing.module.css";

export default function Landing() {
  const navigate = useNavigate();
  const { deviceId, name, setName } = useIdentity();
  const { create, join, loading, error } = useSession();

  const [codeChars, setCodeChars] = useState(["", "", "", ""]);
  const codeRefs = [useRef(), useRef(), useRef(), useRef()];

  // ---- Start a new game ----
  const handleStart = async () => {
    if (!name.trim()) return;
    const sess = await create({ playerName: name, deviceId });
    if (sess) navigate(`/${sess.code}`);
  };

  // ---- Join via code ----
  const handleJoin = async () => {
    const code = codeChars.join("");
    if (code.length < 4 || !name.trim()) return;
    const sess = await join({ code, playerName: name, deviceId });
    if (sess) navigate(`/${sess.code}`);
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
        <h1 className={styles.title}>Tally</h1>
        <p className={styles.subtitle}>game night scoreboard</p>
      </div>

      <div className={styles.form}>
        <input
          type="text"
          className={styles.nameInput}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
        />

        <button
          className={styles.primaryBtn}
          onClick={handleStart}
          disabled={loading || !name.trim()}
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
            disabled={loading || !codeComplete || !name.trim()}
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
