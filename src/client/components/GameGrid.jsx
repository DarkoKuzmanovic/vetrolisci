import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "./Card.jsx";
import Confetti from "./Confetti.jsx";
import { staggerContainer, staggerItem } from "../../shared/styles/animations.js";
import "./GameGrid.css";

const GameGrid = ({
  grid,
  isOpponent = false,
  newlyPlacedCards = new Set(),
  glowingCards = new Set(),
  confettiCards = new Set(),
  onConfettiComplete,
}) => {
  return (
    <motion.div
      className={`game-grid ${isOpponent ? "opponent" : ""}`}
      role="grid"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {grid.map((card, index) => (
        <motion.div
          key={index}
          className={`grid-space ${card ? "filled" : "empty"}`}
          role="gridcell"
          aria-label={card ? `Card ${card.value}` : `Empty space ${index + 1}`}
          variants={staggerItem}
          layout
        >
          {!card && <div className="space-number">{index + 1}</div>}
          <AnimatePresence mode="wait">
            {card && (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8, rotateY: isOpponent ? 0 : -30 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotateY: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  },
                }}
                className="card-wrapper"
              >
                <Card
                  card={card}
                  isPlaced={true}
                  showBack={!card.faceUp}
                  className={`${newlyPlacedCards.has(card.id) ? "card-fade-in" : ""} ${
                    glowingCards.has(card.id) ? "card-glow" : ""
                  }`}
                />
                {confettiCards.has(card.id) && <Confetti cardId={card.id} onComplete={onConfettiComplete} />}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default GameGrid;
