import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import styles from "./Leaderboard.module.css";

export default function Leaderboard({ players, totals, rounds, scoresByRound, activeRound, onSelectPlayer }) {
  const roundCount = rounds.length || 1;

  const prevRanks = useMemo(() => {
    if (!scoresByRound) return {};

    // 1. Calculate previous totals excluding the active round
    const prevTotals = {};
    players.forEach(p => prevTotals[p.id] = 0);

    rounds.forEach(round => {
      // Ignore the currently active/open round so we are getting the "previous" state
      if (activeRound && round.id === activeRound.id) return;
      
      const roundScores = scoresByRound[round.id] || {};
      for (const [playerId, cell] of Object.entries(roundScores)) {
        if (cell && cell.score !== undefined) {
          prevTotals[playerId] = (prevTotals[playerId] || 0) + cell.score;
        }
      }
    });

    // 2. Sort players based on these previous totals
    const prevRanked = [...players].sort((a, b) => {
      const diff = (prevTotals[b.id] || 0) - (prevTotals[a.id] || 0);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

    // 3. Map players to their previous rank index
    const ranksMap = {};
    prevRanked.forEach((p, i) => {
      ranksMap[p.id] = i;
    });
    return ranksMap;
  }, [players, rounds, scoresByRound, activeRound]);

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
