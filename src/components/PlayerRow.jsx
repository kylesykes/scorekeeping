import styles from "./PlayerRow.module.css";

export default function PlayerRow({ player, deviceId }) {
  const isYou = player.device_id && player.device_id === deviceId;
  const isManual = !player.device_id;

  return (
    <div className={`${styles.row} ${isManual ? styles.manual : ""}`}>
      <div
        className={styles.avatar}
        style={{ backgroundColor: player.color ?? "#888" }}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
      <span className={styles.name}>
        {player.name}
        {isYou && <span className={styles.youBadge}> (you)</span>}
      </span>
      {player.is_host && <span className={styles.badge}>host</span>}
      {isManual && (
        <span className={styles.manualLabel}>added manually</span>
      )}
      {!isManual && !player.is_host && (
        <span className={styles.onlineDot} />
      )}
    </div>
  );
}
