import React, { useState, useEffect, useCallback, useRef } from "react";
import socketClient from "./shared/utils/socket-client.js";
import Modal from "./shared/components/Modal.jsx";
import Button from "./shared/components/Button.jsx";
import LoadingSpinner from "./shared/components/LoadingSpinner.jsx";
import ToastStack from "./shared/components/Toast.jsx";
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
  const [reconnecting, setReconnecting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const lastConnectionState = useRef(false);
  const initialConnectionCheck = useRef(true);

  const pushToast = useCallback((message, type = "info", subtext = "") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, subtext }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const attachSocketListeners = useCallback(() => {
    socketClient.onConnectionStatus(({ connected, reconnected }) => {
      setConnected(connected);
      if (reconnected) {
        console.log("🔌 Reconnected to server");
        pushToast("Reconnected to server", "success", "You can continue your match.");
      }
    });

    socketClient.onError((error) => {
      setError(error.message || "An error occurred");
      setShowErrorModal(true);
      pushToast("Connection issue", "error", error.message || "Check your network and retry.");
    });

    socketClient.onPlayerJoined((data) => {
      console.log("👤 Player joined:", data);
    });

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

    socketClient.on("vetrolisci-game-state", (data) => {
      setGameData((prev) => (prev ? { ...prev, gameState: data } : prev));
    });
  }, [pushToast]);

  const initializeSocketConnection = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        await socketClient.connect();
        setConnected(true);
        attachSocketListeners();
      } catch (err) {
        console.error("Failed to connect to server:", err);
        setError("Failed to connect to server. Please check your connection.");
        setShowErrorModal(true);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [attachSocketListeners]
  );

  useEffect(() => {
    initializeSocketConnection({ showLoader: true });

    return () => {
      socketClient.disconnect();
    };
  }, [initializeSocketConnection]);

  useEffect(() => {
    if (initialConnectionCheck.current) {
      initialConnectionCheck.current = false;
      lastConnectionState.current = connected;
      return;
    }

    if (connected && !lastConnectionState.current) {
      pushToast("Reconnected to server", "success", "You can continue your match.");
    }

    lastConnectionState.current = connected;
  }, [connected, pushToast]);

  const handleReconnect = async () => {
    if (reconnecting) return;
    if (socketClient.isConnected()) {
      setConnected(true);
      return;
    }
    setReconnecting(true);
    await initializeSocketConnection();
    if (socketClient.isConnected()) {
      pushToast("Reconnected", "success");
    }
    setReconnecting(false);
  };

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
    pushToast("Room code copied", "success", "Share it with your opponent.");
  };

  if (loading && currentView === "menu") {
    return (
      <div className="app">
        <LoadingSpinner size="large" text="Connecting to server..." />
      </div>
    );
  }

  const playersInRoom = currentRoom?.room?.players?.length || 1;
  const roomCodeReady = roomCode.length === 6;
  const joinDisabled = !connected || !roomCodeReady || loading;

  const renderConnectionPill = (size = "default") =>
    !connected ? (
      <div className={`connection-pill offline ${size === "compact" ? "connection-pill--compact" : ""}`}>
        <div className="connection-pill__status">
          <span className="status-dot"></span>
          <div>
            <p>Disconnected from server</p>
            <small>Check your connection or retry.</small>
          </div>
        </div>
        <Button variant="secondary" size="small" onClick={handleReconnect} loading={reconnecting}>
          Retry
        </Button>
      </div>
    ) : null;

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
            <div className="menu-kicker">Real-time duel</div>
            <div className="menu-title">
              <h1>🎴 Vetrolisci</h1>
              <p>Draft fast, place smart, outscore your rival.</p>
            </div>

            <p className="menu-helper">Host spins up a private room and shares a 6-character code.</p>

            <div className="menu-buttons">
              <div className="menu-button-block">
                <Button variant="success" size="large" onClick={handleCreateVetrolisciRoom} disabled={!connected}>
                  Host a Game
                </Button>
                <p className="menu-button-hint">Create a private room and get a shareable code.</p>
              </div>

              <div className="menu-button-block">
                <Button variant="primary" size="large" onClick={handleJoinGame} disabled={!connected}>
                  Join Game
                </Button>
                <p className="menu-button-hint">Jump into a room with a 6-character code.</p>
              </div>
            </div>

            {renderConnectionPill()}
          </div>
        )}

        {currentView === "join" && (
          <div className="join-game">
            <div className="join-game-title">
              <h2>Join Game</h2>
              <p>Enter your room code to join friends</p>
            </div>
            <div className="join-form">
              <label className="field-label" htmlFor="room-code-input">
                Room code
              </label>
              <input
                type="text"
                placeholder="ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="room-code-input"
                id="room-code-input"
                aria-describedby="room-code-helper"
                disabled={loading}
              />
              <p className="field-helper" id="room-code-helper">
                6 characters, letters or numbers. We&apos;ll auto-capitalize for you.
              </p>
              <Button
                variant="primary"
                size="large"
                onClick={handleJoinRoom}
                disabled={joinDisabled}
                title={
                  !connected ? "Reconnect to enable joining" : !roomCodeReady ? "Room code must be 6 characters" : ""
                }
                loading={loading}
              >
                Join Game
              </Button>
              <p className="field-helper subtle">
                {!connected
                  ? "Reconnect to enable joining."
                  : !roomCodeReady
                  ? "Enter all 6 characters to continue."
                  : "Ready to join when you are."}
              </p>
            </div>
            {renderConnectionPill("compact")}
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
          </div>
        )}

        {currentView === "waiting" && (
          <div className="waiting-room">
            <div className="eyebrow">Room ready</div>
            <div className="waiting-room-title">
              <h2>Room Created!</h2>
              <p>Share your room code and wait for friends to join.</p>
            </div>

            {renderConnectionPill()}

            <div className="room-code-share">
              <div className="room-code-header">
                <div>
                  <p className="room-code-label">Room code</p>
                  <h3>Share this with your opponent</h3>
                </div>
                <div className={`players-chip ${playersInRoom > 1 ? "filled" : "waiting"}`}>
                  <span className="chip-dot" />
                  {playersInRoom}/2 ready
                </div>
              </div>
              <div className="room-code-display">
                <span className="room-code-text">{roomCode || "------"}</span>
                <div className="room-code-actions">
                  <Button variant="secondary" size="small" onClick={copyRoomCode}>
                    Copy code
                  </Button>
                  <p className="room-code-hint">Clipboard ready to share</p>
                </div>
              </div>
              <p className="room-code-subtext">Send the code to your rival. We start as soon as both players join.</p>
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
                    <div className="player-chips">
                      <div className="player-chip filled">You</div>
                      <div className={`player-chip ${playersInRoom > 1 ? "filled" : "pending"}`}>
                        {playersInRoom > 1 ? "Opponent joined" : "Waiting for opponent"}
                      </div>
                    </div>
                    <span className="players-count">{playersInRoom}/2</span>
                  </div>
                  <p className="players-helper">
                    We&apos;ll start automatically once both players are in the room.
                  </p>
                </div>
              </div>
            </div>

            <LoadingSpinner size="small" text="Waiting for another player to join..." />

            <Button variant="outline" onClick={handleBack}>
              Leave room and return to menu
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
        <p className="error-message">{error || "Something went wrong. Please retry or return to the menu."}</p>
        <div className="modal-actions">
          <Button onClick={() => setShowErrorModal(false)}>Try Again</Button>
        </div>
      </Modal>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
