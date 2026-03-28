import styles from "./Leaderboard.module.css";

export default function Leaderboard({ players, totals, rounds }) {
  const roundCount = rounds.length || 1;

  return (
    <div className={styles.list}>
      {players.map((player, i) => {
        const total = totals[player.id] ?? 0;
        const avg = Math.round(total / roundCount);

        return (
          <div key={player.id} className={styles.row}>
            <div className={styles.rank}>{i + 1}</div>

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
          </div>
        );
      })}
    </div>
  );
}
