// Colors for player avatars, assigned in join order.
// Chosen for good contrast on white text and between each other.
const PLAYER_COLORS = [
  "#7F77DD", // purple
  "#1D9E75", // teal
  "#D85A30", // coral
  "#D4537E", // pink
  "#378ADD", // blue
  "#639922", // green
  "#BA7517", // amber
  "#993556", // deep pink
  "#534AB7", // deep purple
  "#0F6E56", // deep teal
];

/**
 * Pick a color for a player based on their index in the session.
 * Wraps around if more than 10 players (unlikely for board games).
 */
export function getPlayerColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export default PLAYER_COLORS;
