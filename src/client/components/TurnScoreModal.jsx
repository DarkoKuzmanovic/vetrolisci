import React from "react";
import Modal from "../../shared/components/Modal.jsx";
import Button from "../../shared/components/Button.jsx";
import "./TurnScoreModal.css";

const TurnScoreModal = ({ isOpen, gameState, playerIndex, onContinue }) => {
  if (!isOpen || !gameState || !gameState.roundScores) return null;

  const currentPlayer = gameState.players[playerIndex];
  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const opponent = gameState.players[opponentIndex];

  const playerScore = gameState.roundScores.find((score) => score.playerIndex === playerIndex);
  const opponentScore = gameState.roundScores.find((score) => score.playerIndex === opponentIndex);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onContinue}
      title={`Turn Complete - Round ${gameState.currentRound}`}
      showCloseButton={false}
    >
      <div className="turn-score-modal">
        <div className="turn-scores-container">
          <div className="turn-player-section">
            <h4>{currentPlayer.name} (You)</h4>
            <div className="turn-score-display">
              <div className="turn-round-score">
                <strong>This Turn: {playerScore?.score || 0} points</strong>
              </div>
              {playerScore?.breakdown && (
                <div className="turn-breakdown">
                  <div className="turn-breakdown-item">
                    <span className="breakdown-label">Validated Cards</span>
                    <span className="breakdown-value">{playerScore.breakdown.validatedNumbers || 0}</span>
                  </div>
                  <div className="turn-breakdown-item">
                    <span className="breakdown-label">Symbol Points</span>
                    <span className="breakdown-value">{playerScore.breakdown.symbols || 0}</span>
                  </div>
                  <div className="turn-breakdown-item">
                    <span className="breakdown-label">Color Bonus</span>
                    <span className="breakdown-value">{playerScore.breakdown.colorBonus || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="turn-player-section">
            <h4>{opponent.name}</h4>
            <div className="turn-score-display">
              <div className="turn-round-score">
                <strong>This Turn: {opponentScore?.score || 0} points</strong>
              </div>
              {opponentScore?.breakdown && (
                <div className="turn-breakdown">
                  <div className="turn-breakdown-item">
                    <span className="breakdown-label">Validated Cards</span>
                    <span className="breakdown-value">{opponentScore.breakdown.validatedNumbers || 0}</span>
                  </div>
                  <div className="turn-breakdown-item">
                    <span className="breakdown-label">Symbol Points</span>
                    <span className="breakdown-value">{opponentScore.breakdown.symbols || 0}</span>
                  </div>
                  <div className="turn-breakdown-item">
                    <span className="breakdown-label">Color Bonus</span>
                    <span className="breakdown-value">{opponentScore.breakdown.colorBonus || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="turn-modal-actions">
          <Button variant="success" size="large" onClick={onContinue}>
            Continue to Next Turn
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TurnScoreModal;
