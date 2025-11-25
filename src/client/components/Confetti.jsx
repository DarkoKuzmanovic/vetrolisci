import React, { useEffect, useState } from "react";
import "./Confetti.css";

// Card-themed colors for visual coherence with the game
const CONFETTI_COLORS = [
  "var(--color-card-blue, #3b82f6)",
  "var(--color-card-green, #10b981)",
  "var(--color-card-red, #ef4444)",
  "var(--color-card-yellow, #f59e0b)",
  "var(--color-primary, #6366f1)",
  "var(--color-success, #10b981)",
  "#fcd34d", // Gold accent
  "#a78bfa", // Purple accent
];

const Confetti = ({ cardId, onComplete, particleCount = 8 }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    // Generate confetti pieces with varied positions
    const newPieces = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80, // Keep within 10-90% of container
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));

    setPieces(newPieces);

    // Clean up after animation (matches CSS animation duration)
    const timer = setTimeout(() => {
      if (onComplete) onComplete(cardId);
    }, 1800);

    return () => clearTimeout(timer);
  }, [cardId, onComplete, particleCount]);

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
