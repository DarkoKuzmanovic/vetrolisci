import React from "react";
import { motion } from "framer-motion";
import Modal from "../../shared/components/Modal.jsx";
import { getCurrentScore, getTotalScore } from "../utils/scoreUtils.js";
import "./ScoreboardModal.css";

const ScoreboardModal = ({ isOpen, gameState, playerIndex, onClose }) => {
  if (!gameState) return null;

  const currentPlayer = gameState.players[playerIndex];
  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const opponent = gameState.players[opponentIndex];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Scoreboard - Round ${gameState.currentRound}/3`}
      className="scoreboard-modal"
    >
      <div className="scores-container">
        <div className="player-score-section">
          <h3>{currentPlayer.name} (You)</h3>
          <div className="score-display">
            <div className="round-scores">
              {currentPlayer.scores.map((score, roundIndex) => (
                <div key={roundIndex} className="round-score-item completed">
                  <strong>
                    Round {roundIndex + 1}: {score} points
                  </strong>
                </div>
              ))}
              <div className="round-score-item current">
                <strong>
                  Round {gameState.currentRound}: {getCurrentScore(currentPlayer, gameState.currentRound).total} points
                </strong>
              </div>
            </div>
            <div className="total-score">
              <strong>Total Score: {getTotalScore(currentPlayer, gameState.currentRound)} points</strong>
            </div>
          </div>
        </div>

        <div className="player-score-section">
          <h3>{opponent.name}</h3>
          <div className="score-display">
            <div className="round-scores">
              {opponent.scores.map((score, roundIndex) => (
                <div key={roundIndex} className="round-score-item completed">
                  <strong>
                    Round {roundIndex + 1}: {score} points
                  </strong>
                </div>
              ))}
              <div className="round-score-item current">
                <strong>
                  Round {gameState.currentRound}: {getCurrentScore(opponent, gameState.currentRound).total} points
                </strong>
              </div>
            </div>
            <div className="total-score">
              <strong>Total Score: {getTotalScore(opponent, gameState.currentRound)} points</strong>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="modal-actions"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.2, duration: 0.2 },
        }}
      >
        <motion.button
          className="close-button-large"
          onClick={onClose}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          Close
        </motion.button>
      </motion.div>
    </Modal>
  );
};

export default ScoreboardModal;
