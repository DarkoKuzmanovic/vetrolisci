import React, { useState, useEffect, useCallback, useRef } from "react";
import socketClient from "./shared/utils/socket-client.js";
import logger from "./shared/utils/logger.js";
import Button from "./shared/components/Button.jsx";
import LoadingSpinner from "./shared/components/LoadingSpinner.jsx";
import ToastStack from "./shared/components/Toast.jsx";
import VetrolisciGameBoard from "./client/components/GameBoard.jsx";
import "./App.css";

const RECONNECT_TOKEN_STORAGE_KEY = "vetrolisci_reconnect_token";

function getOrCreateReconnectToken() {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existingToken = window.localStorage.getItem(RECONNECT_TOKEN_STORAGE_KEY);
  if (existingToken) {
    return existingToken;
  }

  const newToken = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(RECONNECT_TOKEN_STORAGE_KEY, newToken);
  return newToken;
}

function App() {
  const [currentView, setCurrentView] = useState("menu"); // 'menu', 'join', 'waiting', 'game'
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [inputError, setInputError] = useState(false); // For shake animation
  const [gameData, setGameData] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [reconnectToken] = useState(() => getOrCreateReconnectToken());
  const lastConnectionState = useRef(false);
  const initialConnectionCheck = useRef(true);
  const reconnectAttemptInFlight = useRef(false);

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

  const attemptAutoRejoin = useCallback(async () => {
    if (reconnectAttemptInFlight.current) return;
    if (!(currentView === "waiting" || currentView === "game")) return;

    const activeRoomCode = gameData?.roomCode || currentRoom?.room?.code || roomCode;
    if (!activeRoomCode) return;

    reconnectAttemptInFlight.current = true;
    try {
      const fallbackName = playerName.trim() || "Player";
      const response = await socketClient.joinRoom(activeRoomCode, fallbackName, reconnectToken);

      if (!response?.success) {
        pushToast(response?.error || "Could not rejoin room", "error");
        return;
      }

      if (response.rejoined && response.gameState) {
        setCurrentRoom(response);
        setRoomCode(response.room.code);
        setGameData({
          roomCode: response.room.code,
          playerIndex: response.room.playerIndex,
          gameState: response.gameState,
        });
        setCurrentView("game");
        pushToast("Rejoined game", "success");
      }
    } catch (error) {
      logger.error("Auto rejoin failed:", error);
      pushToast("Auto rejoin failed", "error");
    } finally {
      reconnectAttemptInFlight.current = false;
    }
  }, [currentView, gameData?.roomCode, currentRoom?.room?.code, roomCode, playerName, reconnectToken, pushToast]);

  const attachSocketListeners = useCallback(() => {
    socketClient.onConnectionStatus(({ connected, reconnected }) => {
      setConnected(connected);
      if (reconnected) {
        logger.log("🔌 Reconnected to server");
        pushToast("Reconnected", "success");
        attemptAutoRejoin();
      }
    });

    socketClient.onError((error) => {
      pushToast("Connection error", "error");
    });

    socketClient.onPlayerJoined((data) => {
      logger.log("👤 Player joined:", data);
    });

    socketClient.on("game-started", (data) => {
      logger.log("🚀 Game started for room:", data.room.code);

      let playerIndex = 0;
      if (data.room && data.room.players) {
        const myPlayer = data.room.players.find((p) => p.id === socketClient.getSocketId());
        if (myPlayer) {
          playerIndex = data.room.players.indexOf(myPlayer);
        }
      }

      logger.log(`🎯 Joined as Player ${playerIndex} (${data.room.players[playerIndex]?.name})`);

      setGameData({
        roomCode: data.room.code,
        playerIndex,
        gameState: data.gameState,
      });
      setCurrentView("game");
    });

    socketClient.on("game-start-error", (data) => {
      pushToast(data?.error || "Failed to start game", "error");
      setCurrentView("menu");
      setCurrentRoom(null);
      setGameData(null);
    });
  }, [pushToast, attemptAutoRejoin]);

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
        logger.error("Failed to connect to server:", err);
        pushToast("Connection failed", "error");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [attachSocketListeners],
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
      pushToast("Reconnected", "success");
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
      await attemptAutoRejoin();
    }
    setReconnecting(false);
  };

  const handleJoinGame = () => {
    setCurrentView("join");
  };

  const handleBack = () => {
    setCurrentView("menu");
    setRoomCode("");
    setInputError(false);
    setCurrentRoom(null);
    setGameData(null);
  };

  const handleCreateVetrolisciRoom = async () => {
    if (!connected) {
      pushToast("Not connected", "error");
      return;
    }

    const finalPlayerName = playerName.trim() || "Host";

    try {
      setLoading(true);
      const response = await socketClient.createRoom(finalPlayerName, reconnectToken);

      if (response.success) {
        setCurrentRoom(response);
        setRoomCode(response.roomCode);
        setCurrentView("waiting");
        logger.log("🎮 Room created:", response.roomCode);
      } else {
        pushToast(response.error || "Room creation failed", "error");
      }
    } catch (err) {
      pushToast("Room creation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerInputError = () => {
    setInputError(true);
    setTimeout(() => setInputError(false), 500);
  };

  const handleJoinRoom = async () => {
    logger.log("🎯 JOIN ATTEMPT: Starting join process for room:", roomCode);

    if (!connected) {
      pushToast("Not connected", "error");
      return;
    }

    if (roomCode.length !== 4) {
      triggerInputError();
      pushToast("Enter 4 characters", "error");
      return;
    }

    try {
      setLoading(true);
      logger.log("🎯 JOIN ATTEMPT: Checking if room exists:", roomCode);

      const checkResponse = await socketClient.checkRoom(roomCode);
      logger.log("🎯 JOIN ATTEMPT: Check room response:", checkResponse);

      if (!checkResponse.success) {
        triggerInputError();
        pushToast(checkResponse.error || "Room not found", "error");
        setLoading(false);
        return;
      }

      logger.log("🎯 JOIN ATTEMPT: Room exists, attempting to join...");
      const finalPlayerName = playerName.trim() || "Guest";
      const joinResponse = await socketClient.joinRoom(roomCode, finalPlayerName, reconnectToken);
      logger.log("🎯 JOIN ATTEMPT: Join response:", joinResponse);

      if (joinResponse.success) {
        setCurrentRoom(joinResponse);
        setRoomCode(joinResponse.room.code);

        if (joinResponse.rejoined && joinResponse.gameState) {
          setGameData({
            roomCode: joinResponse.room.code,
            playerIndex: joinResponse.room.playerIndex,
            gameState: joinResponse.gameState,
          });
          setCurrentView("game");
          pushToast("Rejoined game", "success");
        } else {
          setCurrentView("waiting");
        }

        logger.log("👤 Successfully joined room:", joinResponse.room.code);
      } else {
        triggerInputError();
        pushToast(joinResponse.error || "Join failed", "error");
      }
    } catch (err) {
      logger.error("🎯 JOIN ATTEMPT: Exception:", err);
      pushToast("Join failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    logger.log("📋 Room code copied to clipboard");
    pushToast("Copied!", "success");
  };

  if (loading && currentView === "menu") {
    return (
      <div className="app">
        <LoadingSpinner size="large" text="Connecting to server..." />
      </div>
    );
  }

  const playersInRoom = currentRoom?.room?.players?.length || 1;
  const roomCodeReady = roomCode.length === 4;
  const joinDisabled = !connected || !roomCodeReady || loading;

  const renderConnectionDot = () =>
    !connected ? (
      <button
        className="connection-dot offline"
        onClick={handleReconnect}
        title="Disconnected - Click to retry"
        disabled={reconnecting}
      >
        {reconnecting ? <span className="dot-spinner" /> : <span className="dot" />}
      </button>
    ) : null;

  return (
    <div className="app">
      <main className="app-main">
        {currentView === "menu" && (
          <div className="menu">
            <div className="menu-kicker">Real-time duel</div>
            <div className="menu-title">
              <h1>🎴 Vetrolisci</h1>
              <p>Draft fast, place smart, outscore your rival.</p>
            </div>

            <div className="menu-form">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="player-name-input"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="menu-buttons">
              <Button
                variant="success"
                size="large"
                icon={<img src="/icons/host-game.svg" alt="host" style={{ width: "20px", height: "20px" }} />}
                onClick={handleCreateVetrolisciRoom}
                disabled={!connected}
                tooltip="Create a private room"
              >
                Host Game
              </Button>

              <Button
                variant="primary"
                size="large"
                icon={<img src="/icons/join-game.svg" alt="join" style={{ width: "20px", height: "20px" }} />}
                onClick={handleJoinGame}
                disabled={!connected}
                tooltip="Join with a room code"
              >
                Join Game
              </Button>
            </div>

            {renderConnectionDot()}
          </div>
        )}

        {currentView === "join" && (
          <div className="join-game">
            <h2 className="join-game-title">Join Game</h2>
            <div className="join-form">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="player-name-input"
                disabled={loading}
                autoComplete="off"
              />
              <div className="input-with-counter">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  className={`room-code-input ${roomCodeReady ? "valid" : ""} ${inputError ? "error shake" : ""}`}
                  id="room-code-input"
                  disabled={loading}
                  autoComplete="off"
                />
                <span className={`char-counter ${roomCodeReady ? "complete" : ""}`}>{roomCode.length}/4</span>
              </div>
              <Button
                variant="primary"
                size="large"
                icon={<img src="/icons/join-game.svg" alt="join" style={{ width: "20px", height: "20px" }} />}
                onClick={handleJoinRoom}
                disabled={joinDisabled}
                loading={loading}
              >
                Join
              </Button>
            </div>
            {renderConnectionDot()}
            <Button variant="outline" size="small" onClick={handleBack}>
              ← Back
            </Button>
          </div>
        )}

        {currentView === "waiting" && (
          <div className="waiting-room">
            {renderConnectionDot()}

            <div className="room-code-card">
              <div className="room-code-display">
                <span className="room-code-text">{roomCode || "------"}</span>
                <Button
                  variant="secondary"
                  size="small"
                  icon={<img src="/icons/copy.svg" alt="copy" style={{ width: "16px", height: "16px" }} />}
                  onClick={copyRoomCode}
                >
                  Copy
                </Button>
              </div>
              <div className={`players-status ${playersInRoom > 1 ? "ready" : ""}`}>
                <div className="player-dots">
                  <span className="player-dot filled" title="You" />
                  <span className={`player-dot ${playersInRoom > 1 ? "filled" : "pending"}`} title="Opponent" />
                </div>
                <span className="players-count">{playersInRoom}/2</span>
              </div>
            </div>

            {playersInRoom < 2 && <LoadingSpinner size="small" />}

            <Button variant="outline" size="small" onClick={handleBack}>
              Leave
            </Button>
          </div>
        )}

        {currentView === "game" && gameData && (
          <VetrolisciGameBoard
            roomCode={gameData.roomCode}
            playerIndex={gameData.playerIndex}
            onBackToMenu={handleBack}
            onGameStateUpdate={(gameState) => {
              setGameData((prev) => ({ ...prev, gameState }));
            }}
          />
        )}
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
