import React, { useState, useEffect } from "react";
import socketClient from "./shared/utils/socket-client.js";
import Modal from "./shared/components/Modal.jsx";
import Button from "./shared/components/Button.jsx";
import LoadingSpinner from "./shared/components/LoadingSpinner.jsx";
import VetrolisciGameBoard from "./client/components/GameBoard.jsx";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState("menu"); // 'menu', 'join', 'waiting', 'game'
  const [roomCode, setRoomCode] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [gameData, setGameData] = useState(null);

  // Connect to server on app load
  useEffect(() => {
    const connect = async () => {
      try {
        setLoading(true);
        await socketClient.connect();
        setConnected(true);

        socketClient.onConnectionStatus(({ connected, reconnected }) => {
          setConnected(connected);
          if (reconnected) {
            console.log("🔌 Reconnected to server");
          }
        });

        socketClient.onError((error) => {
          setError(error.message || "An error occurred");
          setShowErrorModal(true);
        });

        socketClient.onPlayerJoined((data) => {
          console.log("👤 Player joined:", data);
        });

        // Listen for game start
        socketClient.on("game-started", (data) => {
          console.log("🚀 Game started for room:", data.room.code);

          let playerIndex = 0;
          if (data.room && data.room.players) {
            const myPlayer = data.room.players.find((p) => p.id === socketClient.getSocketId());
            if (myPlayer) {
              playerIndex = data.room.players.indexOf(myPlayer);
            }
          }

          console.log(`🎯 Joined as Player ${playerIndex} (${data.room.players[playerIndex]?.name})`);

          setGameData({
            roomCode: data.room.code,
            playerIndex,
            gameState: data.gameState,
          });
          setCurrentView("game");
        });

        // Keep game header in sync
        socketClient.on("vetrolisci-game-state", (data) => {
          setGameData((prev) => (prev ? { ...prev, gameState: data } : prev));
        });
      } catch (err) {
        console.error("Failed to connect to server:", err);
        setError("Failed to connect to server. Please check your connection.");
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    connect();

    return () => {
      socketClient.disconnect();
    };
  }, []);

  const handleJoinGame = () => {
    setCurrentView("join");
  };

  const handleBack = () => {
    setCurrentView("menu");
    setRoomCode("");
    setError("");
    setCurrentRoom(null);
    setGameData(null);
  };

  const handleCreateVetrolisciRoom = async () => {
    if (!connected) {
      setError("Not connected to server");
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      const response = await socketClient.emit("create-room", {
        playerName: "Host",
      });

      if (response.success) {
        setCurrentRoom(response);
        setRoomCode(response.roomCode);
        setCurrentView("waiting");
        console.log("🎮 Room created:", response.roomCode);
      } else {
        setError(response.error || "Failed to create room");
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Failed to create room. Please try again.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    console.log("🎯 JOIN ATTEMPT: Starting join process for room:", roomCode);

    if (!connected) {
      console.log("🎯 JOIN ATTEMPT: Not connected to server");
      setError("Not connected to server");
      setShowErrorModal(true);
      return;
    }

    if (roomCode.length !== 6) {
      console.log("🎯 JOIN ATTEMPT: Invalid room code length:", roomCode.length);
      setError("Please enter a valid 6-character room code");
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      console.log("🎯 JOIN ATTEMPT: Checking if room exists:", roomCode);

      const checkResponse = await socketClient.checkRoom(roomCode);
      console.log("🎯 JOIN ATTEMPT: Check room response:", checkResponse);

      if (!checkResponse.success) {
        console.log("🎯 JOIN ATTEMPT: Room check failed:", checkResponse.error);
        setError(checkResponse.error || "Room not found");
        setShowErrorModal(true);
        setLoading(false);
        return;
      }

      console.log("🎯 JOIN ATTEMPT: Room exists, attempting to join...");
      const joinResponse = await socketClient.joinRoom(roomCode, "Guest");
      console.log("🎯 JOIN ATTEMPT: Join response:", joinResponse);

      if (joinResponse.success) {
        setCurrentRoom(joinResponse);
        setCurrentView("waiting");
        console.log("👤 Successfully joined room:", roomCode);
      } else {
        console.log("🎯 JOIN ATTEMPT: Join failed:", joinResponse.error);
        setError(joinResponse.error || "Failed to join room");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.log("🎯 JOIN ATTEMPT: Exception:", err);
      setError("Failed to join room. Please try again.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    console.log("📋 Room code copied to clipboard");
  };

  if (loading && currentView === "menu") {
    return (
      <div className="app">
        <LoadingSpinner size="large" text="Connecting to server..." />
      </div>
    );
  }

  const playersInRoom = currentRoom?.room?.players?.length || 1;

  return (
    <div className="app">
      {currentView === "game" && gameData && (
        <header className="app-header">
          <div className="header-left">
            <h1>🎴 Vetrolisci</h1>
            <p>Room: {gameData.roomCode}</p>
          </div>

          <div className="header-center">
            {gameData.gameState?.draftState?.revealedCards && (
              <div
                className={`turn-indicator ${
                  gameData.gameState.currentPickingPlayer?.index === gameData.playerIndex ? "my-turn" : "waiting"
                }`}
              >
                {gameData.gameState.currentPickingPlayer?.index === gameData.playerIndex ? (
                  <span className="my-turn-text">🎯 Your turn to pick!</span>
                ) : (
                  <span className="waiting-text">
                    ⏳ Waiting for {gameData.gameState.currentPickingPlayer?.name || "Unknown"}
                    <span className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="header-right">
            {gameData.gameState && (
              <div className="game-progress">
                <div className="round-indicators">
                  {[1, 2, 3].map((round) => (
                    <div
                      key={round}
                      className={`round-indicator ${round === gameData.gameState.currentRound ? "current" : ""} ${
                        round < gameData.gameState.currentRound ? "completed" : ""
                      }`}
                    >
                      {round}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!connected && <div className="connection-status offline">⚠️ Disconnected from server</div>}
          </div>
        </header>
      )}

      <main className="app-main">
        {currentView === "menu" && (
          <div className="menu">
            <div className="menu-title">
              <h1>🎴 Vetrolisci</h1>
              <p>Fast-paced two player card duel</p>
            </div>

            <div className="menu-buttons">
              <Button variant="success" size="large" onClick={handleCreateVetrolisciRoom} disabled={!connected}>
                Host a Game
              </Button>

              <Button variant="primary" size="large" onClick={handleJoinGame} disabled={!connected}>
                Join Game
              </Button>
            </div>

            {!connected && <div className="menu-connection-status">⚠️ Disconnected from server</div>}
          </div>
        )}

        {currentView === "join" && (
          <div className="join-game">
            <div className="join-game-title">
              <h2>Join Game</h2>
              <p>Enter your room code to join friends</p>
            </div>
            <div className="join-form">
              <input
                type="text"
                placeholder="Enter room code..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="room-code-input"
                disabled={loading}
              />
              <Button
                variant="primary"
                size="large"
                onClick={handleJoinRoom}
                disabled={roomCode.length !== 6 || !connected}
                loading={loading}
              >
                Join Game
              </Button>
            </div>
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
          </div>
        )}

        {currentView === "waiting" && (
          <div className="waiting-room">
            <div className="waiting-room-title">
              <h2>Room Created!</h2>
              <p>Share your room code and wait for friends to join</p>
            </div>

            <div className="room-code-share">
              <h3>Room Code</h3>
              <div className="room-code-display">
                <span className="room-code-text">{roomCode}</span>
                <Button variant="outline" size="small" onClick={copyRoomCode}>
                  📋
                </Button>
              </div>
            </div>

            <div className="room-info">
              <div className="room-info-section game-section">
                <div className="game-info">
                  <span className="game-icon">🎴</span>
                  <div className="game-details">
                    <span className="game-label">Playing</span>
                    <span className="game-name">Vetrolisci</span>
                  </div>
                </div>
              </div>
              <div className="room-info-section players-section">
                <div className="players-info">
                  <span className="players-label">Players</span>
                  <div className="players-progress">
                    <div className="player-slots">
                      <div className="player-slot filled">
                        <span className="player-icon">👤</span>
                      </div>
                      <div className={`player-slot ${playersInRoom > 1 ? "filled" : "empty"}`}>
                        <span className="player-icon">{playersInRoom > 1 ? "👤" : "⏳"}</span>
                      </div>
                    </div>
                    <span className="players-count">{playersInRoom}/2</span>
                  </div>
                </div>
              </div>
            </div>

            <LoadingSpinner text="Waiting for another player to join..." />

            <Button variant="outline" onClick={handleBack}>
              Leave Room
            </Button>
          </div>
        )}

        {currentView === "game" && gameData && (
          <VetrolisciGameBoard
            roomCode={gameData.roomCode}
            playerIndex={gameData.playerIndex}
            onBackToMenu={handleBack}
            showHeader={false}
            initialGameState={gameData.gameState}
            onGameStateUpdate={(gameState) => {
              setGameData((prev) => ({ ...prev, gameState }));
            }}
          />
        )}
      </main>

      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title="Error">
        <p className="error-message">{error}</p>
        <div className="modal-actions">
          <Button onClick={() => setShowErrorModal(false)}>OK</Button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
