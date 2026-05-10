import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import styles from "./Leaderboard.module.css";

export default function Leaderboard({ players, totals, scoresByPlayer, maxEntries, onSelectPlayer }) {
  const roundCount = Math.max(maxEntries ?? 0, 1);

  // Trend arrows compare current rank to rank-if-we-excluded-each-player's-last-entry.
  // This is the per-player-stream analog of "before the current round."
  const prevRanks = useMemo(() => {
    if (!scoresByPlayer) return {};

    const prevTotals = {};
    players.forEach((p) => {
      const stream = scoresByPlayer[p.id] ?? [];
      const withoutLast = stream.slice(0, -1);
      prevTotals[p.id] = withoutLast.reduce((sum, s) => sum + s.score, 0);
    });

    const prevRanked = [...players].sort((a, b) => {
      const diff = (prevTotals[b.id] || 0) - (prevTotals[a.id] || 0);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

    const ranksMap = {};
    prevRanked.forEach((p, i) => {
      ranksMap[p.id] = i;
    });
    return ranksMap;
  }, [players, scoresByPlayer]);

  const getTrend = (playerId, currentRank) => {
    const prevRank = prevRanks[playerId];
    if (prevRank === undefined) return null;
    if (currentRank < prevRank) return "up";
    if (currentRank > prevRank) return "down";
    return null;
  };

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
              onClick={() => onSelectPlayer && onSelectPlayer(player)}
            >
              <div className={styles.rank}>
                <span className={styles.rankNumber}>{i + 1}</span>
                {getTrend(player.id, i) === "up" && <span className={styles.trendUp}>▲</span>}
                {getTrend(player.id, i) === "down" && <span className={styles.trendDown}>▼</span>}
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
