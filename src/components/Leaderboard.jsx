import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import styles from "./Leaderboard.module.css";

export default function Leaderboard({ players, totals, rounds }) {
  const roundCount = rounds.length || 1;
  const [trends, setTrends] = useState({});
  const prevRanksRef = useRef({});

  // Use players mapped array string as dependency to detect hard re-orders
  const playersSignature = players.map(p => p.id).join(',');

  useEffect(() => {
    setTrends((prev) => {
      const next = { ...prev };
      players.forEach((p, i) => {
        const prevRank = prevRanksRef.current[p.id];
        if (prevRank !== undefined) {
          if (i < prevRank) next[p.id] = "up";
          else if (i > prevRank) next[p.id] = "down";
        }
      });
      return next;
    });

    const currentRanks = {};
    players.forEach((p, i) => {
      currentRanks[p.id] = i;
    });
    prevRanksRef.current = currentRanks;
  }, [players, playersSignature]);


  return (
    <div className={styles.list}>
      <AnimatePresence>
        {players.map((player, i) => {
          const total = totals[player.id] ?? 0;
          const avg = Math.round(total / roundCount);

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              key={player.id}
              className={styles.row}
            >
              <div className={styles.rank}>
                <span className={styles.rankNumber}>{i + 1}</span>
                {trends[player.id] === "up" && <span className={styles.trendUp}>▲</span>}
                {trends[player.id] === "down" && <span className={styles.trendDown}>▼</span>}
              </div>

              <div
                className={styles.avatar}
                style={{ backgroundColor: player.color ?? "#888" }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>

              <div className={styles.info}>
                <div className={styles.name}>{player.name}</div>
                <div className={styles.avg}>avg {avg} per round</div>
              </div>

              <div className={styles.total}>{total}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
