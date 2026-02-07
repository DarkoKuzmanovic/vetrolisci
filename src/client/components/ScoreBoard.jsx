import React, { memo } from "react";
import { getCurrentScore, getTotalScore } from "../utils/scoreUtils.js";
import "./ScoreBoard.css";

const ScoreBoard = memo(({ players, currentRound, onClose }) => {
  return (
    <div className="scoreboard-container">
      <div className="scoreboard-header">
        <h3>Scoreboard</h3>
        {onClose && (
          <button className="scoreboard-close" onClick={onClose} title="Close scoreboard">
            ✕
          </button>
        )}
      </div>
      <div className="scores-container">
        {players.map((player, index) => (
          <div key={index} className="player-score">
            <h4>{player.name}</h4>
            <div className="score-breakdown">
              <div className="round-scores">
                {player.scores.map((score, roundIndex) => (
                  <div key={roundIndex} className="round-score-item">
                    <strong>
                      Round {roundIndex + 1}: {score}
                    </strong>
                  </div>
                ))}
                <div className="round-score-item current">
                  <strong>
                    Round {currentRound}: {getCurrentScore(player, currentRound).total}
                  </strong>
                </div>
              </div>
              <div className="total-score">
                <strong>Total: {getTotalScore(player, currentRound)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ScoreBoard;
