import styles from "./Leaderboard.module.css";

const MEDAL_COLORS = ["#FAEEDA", "#F1EFE8", "#FAECE7"]; // gold, silver, bronze bg
const MEDAL_TEXT = ["#854F0B", "#5F5E5A", "#993C1D"];

export default function Leaderboard({ players, totals, rounds }) {
  const roundCount = rounds.length || 1;

  return (
    <div className={styles.list}>
      {players.map((player, i) => {
        const total = totals[player.id] ?? 0;
        const avg = Math.round(total / roundCount);
        const isTop3 = i < 3 && total > 0;

        return (
          <div
            key={player.id}
            className={styles.row}
            style={
              isTop3
                ? { background: MEDAL_COLORS[i] }
                : undefined
            }
          >
            <div
              className={styles.rank}
              style={isTop3 ? { color: MEDAL_TEXT[i] } : undefined}
            >
              {i === 0 && total > 0 ? (
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="10" r="8" fill="#EF9F27" opacity="0.7" />
                  <circle cx="12" cy="10" r="5" fill={MEDAL_COLORS[0]} />
                  <text
                    x="12"
                    y="13"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="500"
                    fill="#854F0B"
                  >
                    1
                  </text>
                </svg>
              ) : (
                i + 1
              )}
            </div>

            <div
              className={styles.avatar}
              style={{ backgroundColor: player.color ?? "#888" }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>

            <div className={styles.info}>
              <div
                className={styles.name}
                style={isTop3 ? { color: MEDAL_TEXT[i] } : undefined}
              >
                {player.name}
              </div>
              <div
                className={styles.avg}
                style={isTop3 ? { color: MEDAL_TEXT[i], opacity: 0.7 } : undefined}
              >
                avg {avg} per round
              </div>
            </div>

            <div
              className={styles.total}
              style={isTop3 ? { color: MEDAL_TEXT[i] } : undefined}
            >
              {total}
            </div>
          </div>
        );
      })}
    </div>
  );
}
