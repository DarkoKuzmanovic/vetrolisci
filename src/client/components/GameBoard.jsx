import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Utility imports
import logger from "../../shared/utils/logger.js";

// Component imports
import GameGrid from "./GameGrid.jsx";
import CardChoiceModal from "./CardChoiceModal.jsx";
import PlacementChoiceModal from "./PlacementChoiceModal.jsx";
import TurnScoreModal from "./TurnScoreModal.jsx";
import ScoreboardModal from "./ScoreboardModal.jsx";
import DraftPhase from "./DraftPhase.jsx";
import Button from "../../shared/components/Button.jsx";

// Service imports
import { PlacementScenario, getPickableCards } from "../../core/placement.js";
import socketClient from "../../shared/utils/socket-client.js";
import audioService from "../services/audio.js";
import "./GameBoard.css";

const GameBoard = ({ roomCode, playerIndex, onBackToMenu, onGameStateUpdate }) => {
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
  const pendingTimeoutsRef = useRef(new Set());
  const renderCountRef = useRef(0);
  const cardPickStartRef = useRef(new Map());

  // ==================== HELPER FUNCTIONS ====================

  const updateGameState = (newGameState) => {
    setGameState(newGameState);
    onGameStateUpdate?.(newGameState);
  };

  const scheduleTimeout = useCallback((fn, delayMs) => {
    const timeoutId = setTimeout(() => {
      pendingTimeoutsRef.current.delete(timeoutId);
      fn();
    }, delayMs);

    pendingTimeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

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

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      pendingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      pendingTimeoutsRef.current.clear();
    };
  }, []);

  // Dev-only checkpoint to track rerender frequency while tuning UI performance
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    renderCountRef.current += 1;
    logger.debug("[perf] GameBoard render", {
      count: renderCountRef.current,
      phase: gameState?.phase ?? null,
      round: gameState?.currentRound ?? null,
    });
  });

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
      logger.log(`🎯 Turn: Player ${gameState.currentPickingPlayer.index} (${gameState.currentPickingPlayer?.name})`);
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
      logger.log("🎯 Card placed:", data);
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
              logger.log("🎉 Card validated, triggering confetti:", data.cardId);
              setConfettiCards((prev) => new Set([...prev, data.cardId]));
              break;
            }
          }
        }

        // Clear animations after delays
        scheduleTimeout(() => {
          setNewlyPlacedCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.cardId);
            return newSet;
          });
        }, 500);

        scheduleTimeout(() => {
          setGlowingCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.cardId);
            return newSet;
          });
        }, 3000);

        if (import.meta.env.DEV && cardPickStartRef.current.has(data.cardId)) {
          const startedAt = cardPickStartRef.current.get(data.cardId);
          cardPickStartRef.current.delete(data.cardId);
          logger.debug("[perf] Card pick latency", {
            cardId: data.cardId,
            latencyMs: Number((performance.now() - startedAt).toFixed(2)),
          });
        }
      }
    };

    const handleRoundComplete = (data) => {
      logger.log("🏆 Round complete:", data);
      audioService.playSound("validate");
      updateGameState(data.gameState);
    };

    const handleGameComplete = (data) => {
      logger.log("🎉 Game complete:", data);

      const getTotalScore = (index) => {
        const playerTotals = data?.gameState?.finalScores?.find((score) => score.playerIndex === index)?.totalScore;
        if (typeof playerTotals === "number") {
          return playerTotals;
        }

        const player = data?.gameState?.players?.[index];
        if (!player || !Array.isArray(player.scores)) {
          return 0;
        }

        return player.scores.reduce((sum, score) => sum + score, 0);
      };

      // Play appropriate sound based on win/loss
      const currentPlayerScore = getTotalScore(playerIndex);
      const opponentScore = getTotalScore(playerIndex === 0 ? 1 : 0);
      audioService.playSound(currentPlayerScore > opponentScore ? "win" : "lose");
      updateGameState(data.gameState);
    };

    const handleGameState = (nextGameState) => {
      updateGameState(nextGameState);
    };

    const handleRoomStatusUpdated = (data) => {
      if (data?.reason === "player_disconnected") {
        setError("Opponent disconnected. Waiting for a new player.");
      }
    };

    // Register event listeners
    socketClient.on("vetrolisci-card-placed", handleCardPlaced);
    socketClient.on("vetrolisci-round-complete", handleRoundComplete);
    socketClient.on("vetrolisci-game-complete", handleGameComplete);
    socketClient.on("vetrolisci-game-state", handleGameState);
    socketClient.on("room-status-updated", handleRoomStatusUpdated);

    // Cleanup
    return () => {
      socketClient.off("vetrolisci-card-placed", handleCardPlaced);
      socketClient.off("vetrolisci-round-complete", handleRoundComplete);
      socketClient.off("vetrolisci-game-complete", handleGameComplete);
      socketClient.off("vetrolisci-game-state", handleGameState);
      socketClient.off("room-status-updated", handleRoomStatusUpdated);
    };
  }, [roomCode, playerIndex, scheduleTimeout]);

  // ==================== EVENT HANDLERS ====================

  const handleCardPick = async (cardId) => {
    if (!gameState?.draftState) {
      logger.log("⚠️ No game state or draft state available");
      return;
    }

    // Validate player's turn
    const currentPickingPlayer = gameState.currentPickingPlayer;
    if (!currentPickingPlayer || currentPickingPlayer.index !== playerIndex) {
      logger.log("⚠️ Not your turn to pick - current player:", currentPickingPlayer?.index, "you are:", playerIndex);
      setError("Not your turn to pick!");
      scheduleTimeout(() => setError(""), 3000);
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
      scheduleTimeout(() => setError(""), 3000);
      return;
    }

    // Prevent double-clicking
    if (animatingCards.has(cardId)) {
      logger.log("⚠️ Card pick already in progress");
      return;
    }

    try {
      setAnimatingCards((prev) => new Set([...prev, cardId]));
      if (import.meta.env.DEV) {
        cardPickStartRef.current.set(cardId, performance.now());
      }

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
      if (import.meta.env.DEV && cardPickStartRef.current.has(cardId)) {
        cardPickStartRef.current.delete(cardId);
      }
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

  const handleTurnScoreContinue = async () => {
    setShowTurnScore(false);
    try {
      const response = await socketClient.emit("continue-from-scoring", { roomCode });
      if (!response?.success) {
        setError(response?.error || "Failed to continue");
        setShowTurnScore(true);
        return;
      }

      if (response.waitingForOtherPlayer) {
        setError("Waiting for opponent...");
        scheduleTimeout(() => setError(""), 2000);
      }
    } catch (err) {
      setError("Failed to continue");
      setShowTurnScore(true);
    }
  };

  // ==================== DERIVED STATE (must stay before returns) ====================
  const currentPlayer = gameState?.players?.[playerIndex];
  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const opponent = gameState?.players?.[opponentIndex];
  const currentRound = gameState?.currentRound || 1;
  const isMyTurn = gameState?.currentPickingPlayer?.index === playerIndex || gameState?.currentPlayer === playerIndex;

  const roundIndicators = useMemo(
    () =>
      [1, 2, 3].map((round) => ({
        round,
        state: round === currentRound ? "current" : round < currentRound ? "completed" : "upcoming",
      })),
    [currentRound],
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
              <span className="pill-label">{isMyTurn ? "Your turn" : "Waiting..."}</span>
            </div>
          </div>

          <div className="status-right">
            <div className="round-chip-group">
              {roundIndicators.map(({ round, state }) => (
                <div key={round} className={`round-chip ${state}`} title={`Round ${round}`}>
                  <span>{round}</span>
                </div>
              ))}
            </div>

            <div className="header-controls">
              <button
                className={`header-control ${soundEnabled ? "active" : ""}`}
                onClick={toggleSound}
                title={soundEnabled ? "Sound on" : "Sound off"}
              >
                <img src="/icons/sound.png" alt="" />
              </button>
              <button
                className={`header-control ${musicEnabled ? "active" : ""}`}
                onClick={toggleMusic}
                title={musicEnabled ? "Music on" : "Music off"}
              >
                <img src="/icons/music.png" alt="" />
              </button>
              <button className="header-control" onClick={() => setShowScoreboard(true)} title="Scoreboard">
                🏆
              </button>
              <button className="header-control danger" onClick={onBackToMenu} title="Leave game">
                ✕
              </button>
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
                <h3>You</h3>
                {isMyTurn && <span className="turn-badge">Your turn</span>}
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
                <h3>Opponent</h3>
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
