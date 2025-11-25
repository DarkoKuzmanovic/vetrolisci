import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Component imports
import GameGrid from "./GameGrid.jsx";
import Card from "./Card.jsx";
import CardChoiceModal from "./CardChoiceModal.jsx";
import PlacementChoiceModal from "./PlacementChoiceModal.jsx";
import RoundCompleteModal from "./RoundCompleteModal.jsx";
import ScoreBoard from "./ScoreBoard.jsx";
import TurnScoreModal from "./TurnScoreModal.jsx";
import ScoreboardModal from "./ScoreboardModal.jsx";
import DraftPhase from "./DraftPhase.jsx";
import Button from "../../shared/components/Button.jsx";

// Service imports
import { PlacementScenario, getPickableCards } from "../../core/placement.js";
import socketClient from "../../shared/utils/socket-client.js";
import audioService from "../services/audio.js";
import "./GameBoard.css";

const GameBoard = ({ roomCode, playerIndex, onBackToMenu, showHeader = true, onGameStateUpdate }) => {
  // ==================== STATE MANAGEMENT ====================

  // Core game state
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showCardChoice, setShowCardChoice] = useState(false);
  const [cardChoiceData, setCardChoiceData] = useState(null);
  const [showPlacementChoice, setShowPlacementChoice] = useState(false);
  const [placementChoiceData, setPlacementChoiceData] = useState(null);
  const [showRoundComplete, setShowRoundComplete] = useState(false);
  const [roundCompleteData, setRoundCompleteData] = useState(null);
  const [showTurnScore, setShowTurnScore] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);

  // Animation states
  const [animatingCards, setAnimatingCards] = useState(new Set());
  const [newlyPlacedCards, setNewlyPlacedCards] = useState(new Set());
  const [glowingCards, setGlowingCards] = useState(new Set());
  const [confettiCards, setConfettiCards] = useState(new Set());

  // Audio states
  const [soundEnabled, setSoundEnabled] = useState(audioService.isSoundEffectsEnabled());
  const [musicEnabled, setMusicEnabled] = useState(audioService.isMusicEnabled());

  // ==================== HELPER FUNCTIONS ====================

  const updateGameState = (newGameState) => {
    setGameState(newGameState);
    onGameStateUpdate?.(newGameState);
  };

  const toggleSound = () => {
    const newState = audioService.toggleSoundEffects();
    setSoundEnabled(newState);
  };

  const toggleMusic = () => {
    const newState = audioService.toggleMusic();
    setMusicEnabled(newState);
  };

  const handleConfettiComplete = (cardId) => {
    setConfettiCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
  };

  // ==================== EFFECTS ====================

  // Start background music when component mounts
  useEffect(() => {
    audioService.startBackgroundMusic();
    return () => audioService.stopBackgroundMusic();
  }, []);

  // Update page title based on game state
  useEffect(() => {
    if (!gameState) return;

    if (gameState.phase === "finished") {
      document.title = "Game Complete - Vetrolisci";
    } else if (gameState.phase === "draft") {
      const isMyTurn = gameState.currentPickingPlayer?.index === playerIndex;
      document.title = isMyTurn
        ? `Your Turn - Round ${gameState.currentRound} - Vetrolisci`
        : `Round ${gameState.currentRound} - Vetrolisci`;
    } else {
      document.title = `Round ${gameState.currentRound} - Vetrolisci`;
    }

    return () => {
      document.title = "The Gaming Nook";
    };
  }, [gameState?.phase, gameState?.currentRound, gameState?.currentPickingPlayer?.index, playerIndex]);

  // Handle scoring phase transitions
  useEffect(() => {
    if (gameState?.phase === "scoring" && !showTurnScore) {
      setShowTurnScore(true);
    }
  }, [gameState?.phase, showTurnScore]);

  // Log turn changes for debugging
  useEffect(() => {
    if (gameState?.currentPickingPlayer?.index !== undefined) {
      console.log(`🎯 Turn: Player ${gameState.currentPickingPlayer.index} (${gameState.currentPickingPlayer?.name})`);
    }
  }, [gameState?.currentPickingPlayer?.index, gameState?.currentPickingPlayer?.name]);

  // Load initial game state
  useEffect(() => {
    const loadGameState = async () => {
      try {
        setLoading(true);
        const response = await socketClient.emit("vetrolisci-get-state", { roomCode });

        if (response.success) {
          updateGameState(response.gameState);
        } else {
          setError(response.error || "Failed to load game state");
        }
      } catch (err) {
        setError("Failed to connect to game");
      } finally {
        setLoading(false);
      }
    };

    if (roomCode) {
      loadGameState();
    }
  }, [roomCode]);

  // Socket event listeners
  useEffect(() => {
    if (!roomCode) return;

    const handleCardPlaced = (data) => {
      console.log("🎯 Card placed:", data);
      updateGameState(data.gameState);

      // Trigger animations
      if (data.cardId) {
        setNewlyPlacedCards((prev) => new Set([...prev, data.cardId]));
        setGlowingCards((prev) => new Set([...prev, data.cardId]));

        // Check if card was validated for confetti
        if (data.gameState?.players) {
          for (const player of data.gameState.players) {
            const validatedCard = player.grid.find((card) => card && card.id === data.cardId && card.validated);
            if (validatedCard) {
              console.log("🎉 Card validated, triggering confetti:", data.cardId);
              setConfettiCards((prev) => new Set([...prev, data.cardId]));
              break;
            }
          }
        }

        // Clear animations after delays
        setTimeout(() => {
          setNewlyPlacedCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.cardId);
            return newSet;
          });
        }, 500);

        setTimeout(() => {
          setGlowingCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.cardId);
            return newSet;
          });
        }, 3000);
      }
    };

    const handleRoundComplete = (data) => {
      console.log("🏆 Round complete:", data);
      audioService.playSound("validate");
      setRoundCompleteData({
        roundNumber: data.roundNumber,
        roundScores: data.roundScores,
        nextRound: data.nextRound,
        gameState: data.gameState,
      });
      setShowRoundComplete(true);
    };

    const handleGameComplete = (data) => {
      console.log("🎉 Game complete:", data);
      // Play appropriate sound based on win/loss
      const currentPlayerScore = data.gameState.players[playerIndex].totalScore;
      const opponentScore = data.gameState.players[playerIndex === 0 ? 1 : 0].totalScore;
      audioService.playSound(currentPlayerScore > opponentScore ? "win" : "lose");
      updateGameState(data.gameState);
    };

    // Register event listeners
    socketClient.on("vetrolisci-card-placed", handleCardPlaced);
    socketClient.on("vetrolisci-round-complete", handleRoundComplete);
    socketClient.on("vetrolisci-game-complete", handleGameComplete);

    // Cleanup
    return () => {
      socketClient.off("vetrolisci-card-placed", handleCardPlaced);
      socketClient.off("vetrolisci-round-complete", handleRoundComplete);
      socketClient.off("vetrolisci-game-complete", handleGameComplete);
    };
  }, [roomCode, playerIndex]);

  // ==================== EVENT HANDLERS ====================

  const handleCardPick = async (cardId) => {
    if (!gameState?.draftState) {
      console.log("⚠️ No game state or draft state available");
      return;
    }

    // Validate player's turn
    const currentPickingPlayer = gameState.currentPickingPlayer;
    if (!currentPickingPlayer || currentPickingPlayer.index !== playerIndex) {
      console.log("⚠️ Not your turn to pick - current player:", currentPickingPlayer?.index, "you are:", playerIndex);
      setError("Not your turn to pick!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Validate card can be picked
    const pickableCards = getPickableCards(gameState.players[playerIndex].grid, gameState.draftState.revealedCards);
    const cardData = pickableCards.find((card) => card.id === cardId);
    if (!cardData?.pickable.canPick) {
      const message =
        cardData?.pickable.reason === "all_cards_validated"
          ? "All cards would violate validation rule - can place face-down"
          : "You already have a validated card with this number";
      setError(message);
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Prevent double-clicking
    if (animatingCards.has(cardId)) {
      console.log("⚠️ Card pick already in progress");
      return;
    }

    try {
      setAnimatingCards((prev) => new Set([...prev, cardId]));

      const response = await socketClient.emit("vetrolisci-pick-card", {
        roomCode,
        cardId,
      });

      if (response.success) {
        audioService.playSound("playCard");

        if (response.needsChoice) {
          // Handle placement choice scenarios
          if (response.choiceType === PlacementScenario.DUPLICATE_NUMBER) {
            const selectedCard = response.selectedCard;
            const existingCard = gameState.players[playerIndex].grid[selectedCard.value - 1];

            setCardChoiceData({
              cardId,
              selectedCard,
              existingCard,
            });
            setShowCardChoice(true);
          } else if (response.choiceType === PlacementScenario.ALREADY_VALIDATED) {
            const availablePositions = gameState.players[playerIndex].grid
              .map((card, index) => (card === null ? index : null))
              .filter((index) => index !== null);

            setPlacementChoiceData({
              cardId,
              selectedCard: response.selectedCard,
              availablePositions,
            });
            setShowPlacementChoice(true);
          }
        } else {
          // Card was placed automatically
          audioService.playSound("placeCards");
          updateGameState(response.gameState);
        }
      } else {
        console.error("Failed to pick card:", response.error);
        setError(response.error);
      }
    } catch (err) {
      console.error("Error picking card:", err);
      setError("Failed to pick card");
    } finally {
      setAnimatingCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
  };

  const handleCardChoice = async (choice) => {
    if (!cardChoiceData) return;

    try {
      const response = await socketClient.emit("vetrolisci-placement-choice", {
        roomCode,
        cardId: cardChoiceData.cardId,
        choice,
      });

      if (response.success) {
        audioService.playSound("placeCards");
        updateGameState(response.gameState);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError("Failed to make choice");
    }

    setShowCardChoice(false);
    setCardChoiceData(null);
  };

  const handlePlacementChoice = async (position) => {
    if (!placementChoiceData) return;

    try {
      const response = await socketClient.emit("vetrolisci-placement-choice", {
        roomCode,
        cardId: placementChoiceData.cardId,
        choice: { position },
      });

      if (response.success) {
        audioService.playSound("placeCards");
        updateGameState(response.gameState);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError("Failed to place card");
    }

    setShowPlacementChoice(false);
    setPlacementChoiceData(null);
  };

  const handleRoundContinue = () => {
    setShowRoundComplete(false);

    // Update game state with new round data
    if (roundCompleteData?.gameState) {
      setGameState(roundCompleteData.gameState);
    }

    setRoundCompleteData(null);
  };

  const handleTurnScoreContinue = () => {
    setShowTurnScore(false);
    socketClient.emit("continue-from-scoring", { roomCode });
  };

  // ==================== DERIVED STATE (must stay before returns) ====================
  const currentPlayer = gameState?.players?.[playerIndex];
  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const opponent = gameState?.players?.[opponentIndex];
  const currentRound = gameState?.currentRound || 1;
  const isMyTurn = gameState?.currentPickingPlayer?.index === playerIndex || gameState?.currentPlayer === playerIndex;

  const turnLabel = isMyTurn
    ? "Your turn to pick"
    : `Waiting for ${gameState?.currentPickingPlayer?.name || "opponent"}`;

  const turnSubtext = gameState?.draftState?.phase === "complete" ? "Placement phase" : "Draft phase";

  const roundIndicators = useMemo(
    () =>
      [1, 2, 3].map((round) => ({
        round,
        state: round === currentRound ? "current" : round < currentRound ? "completed" : "upcoming",
      })),
    [currentRound]
  );

  // ==================== RENDER STATES ====================

  if (loading) {
    return (
      <div className="game-board loading">
        <h2>Loading Vetrolisci...</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-board error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onBackToMenu}>Back to Menu</button>
      </div>
    );
  }

  if (!gameState || !currentPlayer || !opponent) {
    return (
      <div className="game-board error">
        <h2>Game Not Found</h2>
        <button onClick={onBackToMenu}>Back to Menu</button>
      </div>
    );
  }

  if (gameState.phase === "finished") {
    // Calculate final scores
    const playerScores = gameState.players.map((player, index) => {
      const totalScore = player.scores.reduce((sum, score) => sum + score, 0);
      return {
        playerIndex: index,
        playerName: player.name,
        totalScore,
        isYou: index === playerIndex,
      };
    });

    // Determine winner
    const maxScore = Math.max(...playerScores.map((p) => p.totalScore));
    const winners = playerScores.filter((p) => p.totalScore === maxScore);
    const isTied = winners.length > 1;
    const youWon = winners.some((w) => w.isYou);
    const currentPlayer = playerScores.find((p) => p.isYou);
    const opponent = playerScores.find((p) => !p.isYou);

    // Determine result message
    let resultClass = "loser";
    let resultText = "Better luck next time!";
    if (isTied) {
      resultClass = "tied";
      resultText = "It's a tie!";
    } else if (youWon) {
      resultClass = "winner";
      resultText = "🏆 You Win!";
    }

    return (
      <div className="game-board">
        <div className="game-complete">
          <div className="trophy">🎉</div>
          <h1>Game Complete!</h1>
          <div className={`result-message ${resultClass}`}>{resultText}</div>
          <div className="final-scores">
            <div className={`final-score-card ${currentPlayer.totalScore >= opponent.totalScore ? "is-winner" : ""}`}>
              <div className="player-name">You</div>
              <div className="player-final-score">{currentPlayer.totalScore}</div>
            </div>
            <div className={`final-score-card ${opponent.totalScore >= currentPlayer.totalScore ? "is-winner" : ""}`}>
              <div className="player-name">{opponent.playerName}</div>
              <div className="player-final-score">{opponent.totalScore}</div>
            </div>
          </div>
          <Button variant="primary" size="large" onClick={onBackToMenu}>
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================

  return (
    <>
      <div className="game-board">
        {/* Error Display - Dismissible Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-banner"
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: -50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -50, x: "-50%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <span className="error-banner-content">{error}</span>
              <button className="error-banner-dismiss" onClick={() => setError("")} aria-label="Dismiss error">
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Game Status Card */}
        <motion.div
          className="game-status-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="status-left">
            <div className="title-row">
              <span className="game-icon">🎴</span>
              <div className="title-copy">
                <h2>Vetrolisci</h2>
                <div className="room-chip">Room {roomCode}</div>
              </div>
            </div>
          </div>

          <div className="status-center">
            <div className={`turn-pill ${isMyTurn ? "my-turn" : "waiting"}`}>
              <span className="pill-icon">{isMyTurn ? "🎯" : "⏳"}</span>
              <div className="pill-copy">
                <strong>{turnLabel}</strong>
                <small>{turnSubtext}</small>
              </div>
            </div>
          </div>

          <div className="status-right">
            <div className="round-chip-group">
              {roundIndicators.map(({ round, state }) => (
                <div key={round} className={`round-chip ${state}`}>
                  <span>{round}</span>
                </div>
              ))}
            </div>

            <div className="header-controls">
              <button
                className={`header-control ${soundEnabled ? "active" : ""}`}
                onClick={toggleSound}
                title={soundEnabled ? "Disable sound effects" : "Enable sound effects"}
              >
                <img src="/icons/sound.png" alt="Sound Effects" />
                <span>SFX</span>
              </button>
              <button
                className={`header-control ${musicEnabled ? "active" : ""}`}
                onClick={toggleMusic}
                title={musicEnabled ? "Disable music" : "Enable music"}
              >
                <img src="/icons/music.png" alt="Music" />
                <span>Music</span>
              </button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowScoreboard(true)}
                className="header-control-btn"
              >
                Scoreboard
              </Button>
              <Button variant="outline" size="small" onClick={onBackToMenu} className="header-control-btn danger">
                Leave
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Game Content Container */}
        <motion.div
          className="game-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Draft Phase */}
          <AnimatePresence mode="wait">
            {gameState.draftState?.revealedCards && (
              <motion.div
                key="draft-phase"
                initial={{ opacity: 0, y: -10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                  transition: { duration: 0.2, ease: "easeIn" },
                }}
              >
                <DraftPhase
                  gameState={gameState}
                  playerIndex={playerIndex}
                  onCardPick={handleCardPick}
                  error={error}
                  animatingCards={animatingCards}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Grids */}
          <motion.div
            className="game-grids"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.6,
                delay: 0.2,
                ease: "easeOut",
              },
            }}
          >
            <motion.div
              className="player-grid-section"
              initial={{ opacity: 0, x: -30 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: {
                  duration: 0.5,
                  delay: 0.3,
                  ease: "easeOut",
                },
              }}
            >
              <div className="grid-header">
                <div>
                  <p className="grid-eyebrow">{isMyTurn ? "Your turn" : "Your grid"}</p>
                  <h3>Your board</h3>
                </div>
                <span className="grid-subtext">Place cards by their number</span>
              </div>
              <GameGrid
                grid={currentPlayer.grid}
                newlyPlacedCards={newlyPlacedCards}
                glowingCards={glowingCards}
                confettiCards={confettiCards}
                onConfettiComplete={handleConfettiComplete}
              />
            </motion.div>

            <motion.div
              className="opponent-grid-section"
              initial={{ opacity: 0, x: 30 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: {
                  duration: 0.5,
                  delay: 0.4,
                  ease: "easeOut",
                },
              }}
            >
              <div className="grid-header">
                <div>
                  <p className="grid-eyebrow">Opponent</p>
                  <h3>Rival board</h3>
                </div>
                <span className="grid-subtext muted">See their placements in real time</span>
              </div>
              <GameGrid
                grid={opponent.grid}
                isOpponent={true}
                newlyPlacedCards={newlyPlacedCards}
                glowingCards={glowingCards}
                confettiCards={confettiCards}
                onConfettiComplete={handleConfettiComplete}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Modals - Rendered outside game container for proper overlay positioning */}
      <CardChoiceModal
        isOpen={showCardChoice}
        existingCard={cardChoiceData?.existingCard}
        newCard={cardChoiceData?.selectedCard}
        onChoose={handleCardChoice}
        onCancel={() => setShowCardChoice(false)}
      />

      <PlacementChoiceModal
        isOpen={showPlacementChoice}
        card={placementChoiceData?.selectedCard}
        availablePositions={placementChoiceData?.availablePositions || []}
        onChoose={handlePlacementChoice}
        onCancel={() => setShowPlacementChoice(false)}
      />

      <RoundCompleteModal
        isOpen={showRoundComplete}
        roundNumber={roundCompleteData?.roundNumber}
        roundScores={roundCompleteData?.roundScores}
        nextRound={roundCompleteData?.nextRound}
        onContinue={handleRoundContinue}
      />

      <TurnScoreModal
        isOpen={showTurnScore}
        gameState={gameState}
        playerIndex={playerIndex}
        onContinue={handleTurnScoreContinue}
      />

      <ScoreboardModal
        isOpen={showScoreboard}
        gameState={gameState}
        playerIndex={playerIndex}
        onClose={() => setShowScoreboard(false)}
      />
    </>
  );
};

export default GameBoard;
