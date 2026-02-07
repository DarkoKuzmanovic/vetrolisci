import { calculatePlayerScore } from "../../core/scoring.js";

/**
 * Calculate the current round score for a player
 * @param {Object} player - Player object with grid
 * @param {number} currentRound - Current round number (1-based)
 * @returns {Object} Score object with total and breakdown
 */
export const getCurrentScore = (player, currentRound) => {
  if (!player.grid) return { total: 0 };
  return calculatePlayerScore(player.grid, currentRound - 1); // use 0-based round index
};

/**
 * Calculate the total score across all rounds for a player
 * @param {Object} player - Player object with scores array and grid
 * @param {number} currentRound - Current round number (1-based)
 * @returns {number} Total score including completed rounds and current round
 */
export const getTotalScore = (player, currentRound) => {
  const completedRounds = player.scores.reduce((sum, score) => sum + score, 0);
  return completedRounds + getCurrentScore(player, currentRound).total;
};
