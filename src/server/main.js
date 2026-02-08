import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";
import vetrolisciServer from "./vetrolisci-server.js";
import logger from "./logger.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 8001;
const RECONNECT_GRACE_PERIOD_MS = Number.parseInt(process.env.VETROLISCI_RECONNECT_GRACE_MS || "60000", 10);

// Room management
const rooms = new Map();
const players = new Map(); // socketId -> playerInfo
const reconnectGraceTimers = new Map(); // `${roomCode}:${token}` -> timeoutId

function sanitizePlayerForClient(player) {
  return {
    id: player.id,
    name: player.name,
    joinedAt: player.joinedAt,
    disconnectedAt: player.disconnectedAt || null,
  };
}

function buildRoomResponse(room, playerIndex) {
  return {
    code: room.code,
    gameType: room.gameType,
    playerIndex,
    players: room.players.map(sanitizePlayerForClient),
  };
}

function getReconnectTimerKey(roomCode, reconnectToken) {
  return `${roomCode}:${reconnectToken}`;
}

function clearReconnectGraceTimer(roomCode, reconnectToken) {
  const timerKey = getReconnectTimerKey(roomCode, reconnectToken);
  const timeoutId = reconnectGraceTimers.get(timerKey);
  if (!timeoutId) return;

  clearTimeout(timeoutId);
  reconnectGraceTimers.delete(timerKey);
}

function clearRoomReconnectGraceTimers(roomCode) {
  const keyPrefix = `${roomCode}:`;
  reconnectGraceTimers.forEach((timeoutId, timerKey) => {
    if (!timerKey.startsWith(keyPrefix)) return;
    clearTimeout(timeoutId);
    reconnectGraceTimers.delete(timerKey);
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    connectedPlayers: players.size,
  });
});

// Generate room code (4-character alphanumeric)
function generateRoomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code)); // Ensure uniqueness
  return code;
}

// Clean up expired rooms (older than 30 minutes)
function cleanupExpiredRooms() {
  const now = Date.now();
  const THIRTY_MINUTES = 30 * 60 * 1000;

  for (const [roomCode, room] of rooms.entries()) {
    if (now - room.createdAt > THIRTY_MINUTES) {
      logger.log(`🧹 Cleaning up expired room: ${roomCode}`);
      rooms.delete(roomCode);
      clearRoomReconnectGraceTimers(roomCode);
      // Also remove the game state to prevent memory leaks
      vetrolisciServer.removeGame(roomCode);
    }
  }
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  logger.log(`🔌 Client connected: ${socket.id}`);

  // Health check for socket connection
  socket.emit("connected", {
    socketId: socket.id,
    timestamp: new Date().toISOString(),
  });

  const emitRoundProgressEvents = (roomCode, result, gameState) => {
    if (result.roundComplete && result.roundScores) {
      io.to(roomCode).emit("vetrolisci-round-complete", {
        roundNumber: gameState.currentRound,
        roundScores: result.roundScores,
        nextRound: result.gameComplete ? null : gameState.currentRound + 1,
        gameState,
      });
      return;
    }

    if (gameState.phase === "finished") {
      io.to(roomCode).emit("vetrolisci-game-complete", {
        gameState,
      });
    }
  };

  const isRoomPausedForReconnect = (room) => room.players.some((player) => player.disconnectedAt);

  // Create room
  socket.on("create-room", (data, callback) => {
    try {
      const { playerName = "Host", reconnectToken } = data || {};
      const roomCode = generateRoomCode();

      const hostPlayer = {
        id: socket.id,
        name: playerName,
        joinedAt: Date.now(),
        reconnectToken: reconnectToken || randomUUID(),
        disconnectedAt: null,
      };

      const room = {
        code: roomCode,
        gameType: "vetrolisci",
        host: socket.id,
        players: [hostPlayer], // Add host as first player
        status: "waiting", // 'waiting', 'playing', 'finished'
        createdAt: Date.now(),
      };

      rooms.set(roomCode, room);
      players.set(socket.id, { roomCode: room.code, ...hostPlayer });
      socket.join(room.code); // Join the socket room

      logger.log(`🎮 Room created: ${roomCode} (${room.gameType}) by ${playerName}`);

      callback({
        success: true,
        roomCode,
        gameType: room.gameType,
        room: buildRoomResponse(room, 0), // Host is always player 0
      });
    } catch (error) {
      console.error("❌ Error creating room:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Check room info
  socket.on("check-room", (data, callback) => {
    try {
      const { roomCode } = data || {};
      if (!roomCode) {
        callback({ success: false, error: "Room code is required" });
        return;
      }
      const room = rooms.get(roomCode.toUpperCase());

      if (!room) {
        callback({
          success: false,
          error: "Room not found or expired",
        });
        return;
      }

      callback({
        success: true,
        room: {
          code: room.code,
          gameType: room.gameType,
          status: room.status,
          playerCount: room.players.length,
          maxPlayers: 2,
        },
      });
    } catch (error) {
      console.error("❌ Error checking room:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Join room
  socket.on("join-room", (data, callback) => {
    try {
      const { roomCode, playerName = "Anonymous", reconnectToken } = data || {};
      if (!roomCode) {
        callback({ success: false, error: "Room code is required" });
        return;
      }
      const normalizedRoomCode = roomCode.toUpperCase();
      const room = rooms.get(normalizedRoomCode);
      const sessionReconnectToken = reconnectToken || randomUUID();

      if (!room) {
        callback({
          success: false,
          error: "Room not found or expired",
        });
        return;
      }

      const reconnectingPlayerIndex = room.players.findIndex(
        (player) => player.reconnectToken === sessionReconnectToken && player.disconnectedAt,
      );

      // Reclaim a disconnected seat if the reconnect token matches.
      if (reconnectingPlayerIndex !== -1) {
        const reconnectingPlayer = room.players[reconnectingPlayerIndex];
        reconnectingPlayer.id = socket.id;
        reconnectingPlayer.disconnectedAt = null;
        if (!reconnectingPlayer.name) {
          reconnectingPlayer.name = playerName;
        }
        players.set(socket.id, { roomCode: room.code, ...reconnectingPlayer });
        socket.join(room.code);
        clearReconnectGraceTimer(room.code, reconnectingPlayer.reconnectToken);

        const game = vetrolisciServer.getGame(room.code);
        if (game) {
          const gamePlayer = game.players.find((player) => player.reconnectToken === reconnectingPlayer.reconnectToken);
          if (gamePlayer) {
            gamePlayer.id = socket.id;
          }
        }

        if (room.players.length === 2 && room.players.every((player) => !player.disconnectedAt)) {
          room.status = "playing";
        }

        const gameState = vetrolisciServer.getGameState(room.code);
        io.to(room.code).emit("player-rejoined", {
          playerName: reconnectingPlayer.name,
          playerIndex: reconnectingPlayerIndex,
        });
        io.to(room.code).emit("vetrolisci-game-state", gameState);

        callback({
          success: true,
          rejoined: true,
          room: buildRoomResponse(room, reconnectingPlayerIndex),
          gameState,
        });
        return;
      }

      if (room.status !== "waiting") {
        callback({
          success: false,
          error: "Game already in progress",
        });
        return;
      }

      if (room.players.length >= 2) {
        callback({
          success: false,
          error: "Room is full",
        });
        return;
      }

      const player = {
        id: socket.id,
        name: playerName,
        joinedAt: Date.now(),
        reconnectToken: sessionReconnectToken,
        disconnectedAt: null,
      };

      room.players.push(player);
      players.set(socket.id, { roomCode: room.code, ...player });
      socket.join(room.code);

      logger.log(`👤 Player ${playerName} joined room ${room.code}`);

      // Notify other players in the room
      socket.to(room.code).emit("player-joined", {
        player: sanitizePlayerForClient(player),
        playerCount: room.players.length,
      });

      callback({
        success: true,
        room: buildRoomResponse(room, room.players.length - 1),
      });

      // Start game if room is full
      if (room.players.length === 2) {
        // Create the actual game based on game type
        let gameState = null;
        try {
          gameState = vetrolisciServer.createGame(room.code, room.players);
          room.status = "playing";
          logger.log(`🎮 Vetrolisci game created for room ${room.code}`);

          io.to(room.code).emit("game-started", {
            room: {
              ...room,
              players: room.players.map(sanitizePlayerForClient),
            },
            gameState,
            message: "Game started! Let the fun begin!",
          });
          logger.log(`🚀 Game started in room ${room.code} (${room.gameType})`);
        } catch (error) {
          console.error(`❌ Error creating Vetrolisci game: ${error.message}`);
          room.status = "waiting";
          vetrolisciServer.removeGame(room.code);
          io.to(room.code).emit("game-start-error", {
            error: "Failed to start game. Please try creating a new room.",
          });
        }
      }
    } catch (error) {
      console.error("❌ Error joining room:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Vetrolisci game event handlers
  socket.on("vetrolisci-pick-card", async (data, callback) => {
    try {
      const { roomCode, cardId, placementChoice } = data;
      logger.log(`🎯 Vetrolisci pick card: ${socket.id} in room ${roomCode} picks card ${cardId}`);

      const room = rooms.get(roomCode?.toUpperCase());
      if (!room) {
        callback({ success: false, error: "Room not found or expired" });
        return;
      }
      if (isRoomPausedForReconnect(room)) {
        callback({ success: false, error: "Game is paused while waiting for player reconnection" });
        return;
      }

      const result = vetrolisciServer.handleCardPick(roomCode, socket.id, cardId, placementChoice);

      if (result.needsChoice) {
        // Player needs to make a placement choice
        callback({
          success: true,
          needsChoice: true,
          choiceType: result.choiceType,
          selectedCard: result.selectedCard,
        });
      } else {
        // Card placed successfully, broadcast to all players in room
        const gameState = vetrolisciServer.getGameState(roomCode);

        io.to(roomCode).emit("vetrolisci-card-placed", {
          gameState,
          playerId: socket.id,
          cardId,
          placementResult: result.placementResult,
        });

        emitRoundProgressEvents(roomCode, result, gameState);

        callback({
          success: true,
          cardPlaced: true,
          gameState,
        });
      }
    } catch (error) {
      console.error(`❌ Vetrolisci pick card error: ${error.message}`);
      callback({ success: false, error: error.message });
    }
  });

  socket.on("vetrolisci-placement-choice", async (data, callback) => {
    try {
      const { roomCode, cardId, choice } = data;
      logger.log(`🎯 Vetrolisci placement choice: ${socket.id} in room ${roomCode}`);

      const room = rooms.get(roomCode?.toUpperCase());
      if (!room) {
        callback({ success: false, error: "Room not found or expired" });
        return;
      }
      if (isRoomPausedForReconnect(room)) {
        callback({ success: false, error: "Game is paused while waiting for player reconnection" });
        return;
      }

      const result = vetrolisciServer.handlePlacementChoice(roomCode, socket.id, cardId, choice);
      const gameState = vetrolisciServer.getGameState(roomCode);

      // Broadcast to all players in room
      io.to(roomCode).emit("vetrolisci-card-placed", {
        gameState,
        playerId: socket.id,
        cardId,
        placementResult: result.placementResult,
      });

      emitRoundProgressEvents(roomCode, result, gameState);

      callback({
        success: true,
        gameState,
      });
    } catch (error) {
      console.error(`❌ Vetrolisci placement choice error: ${error.message}`);
      callback({ success: false, error: error.message });
    }
  });

  socket.on("vetrolisci-get-state", (data, callback) => {
    try {
      const { roomCode } = data;
      const room = rooms.get(roomCode?.toUpperCase());

      if (!room) {
        callback({ success: false, error: "Room not found or expired" });
        return;
      }

      let gameState = vetrolisciServer.getGameState(room.code);

      // If a room exists but a game wasn't initialized, create it now to recover.
      if (!gameState && room.players.length >= 2) {
        logger.warn(`⚠️ Missing game state for room ${room.code}, reinitializing Vetrolisci game`);
        gameState = vetrolisciServer.createGame(room.code, room.players);
        room.status = "playing";
      }

      callback({
        success: true,
        gameState,
      });
    } catch (error) {
      console.error(`❌ Vetrolisci get state error: ${error.message}`);
      callback({ success: false, error: error.message });
    }
  });

  socket.on("continue-from-scoring", (data, callback = () => {}) => {
    try {
      const { roomCode } = data;
      logger.log(`🎯 Continue from scoring for room ${roomCode}`);

      const room = rooms.get(roomCode?.toUpperCase());
      if (!room) {
        callback({ success: false, error: "Room not found or expired" });
        return;
      }
      if (isRoomPausedForReconnect(room)) {
        callback({ success: false, error: "Game is paused while waiting for player reconnection" });
        return;
      }

      const game = vetrolisciServer.getGame(roomCode);
      if (!game) {
        console.error(`❌ Game not found: ${roomCode}`);
        callback({ success: false, error: "Game not found" });
        return;
      }

      if (game.phase !== "scoring") {
        callback({ success: false, error: "Game is not in scoring phase" });
        return;
      }

      const currentPlayerInGame = game.players.some((player) => player.id === socket.id);
      if (!currentPlayerInGame) {
        callback({ success: false, error: "Player is not part of this game" });
        return;
      }

      if (!(game.scoringAcknowledgments instanceof Set)) {
        game.scoringAcknowledgments = new Set();
      }

      game.scoringAcknowledgments.add(socket.id);
      const requiredAcknowledgments = game.players.length;

      if (game.scoringAcknowledgments.size < requiredAcknowledgments) {
        io.to(roomCode).emit("vetrolisci-scoring-progress", {
          acknowledged: game.scoringAcknowledgments.size,
          required: requiredAcknowledgments,
        });
        callback({
          success: true,
          waitingForOtherPlayer: true,
          acknowledged: game.scoringAcknowledgments.size,
          required: requiredAcknowledgments,
        });
        return;
      }

      const advanceResult = vetrolisciServer.advanceFromScoring(game);
      const gameState = vetrolisciServer.getGameState(roomCode);

      io.to(roomCode).emit("vetrolisci-game-state", gameState);

      if (advanceResult.gameComplete) {
        io.to(roomCode).emit("vetrolisci-game-complete", {
          gameState,
        });
      }

      logger.log(`🎯 Transitioned from scoring to ${game.phase} phase`);
      callback({
        success: true,
        waitingForOtherPlayer: false,
        gameComplete: advanceResult.gameComplete,
      });
    } catch (error) {
      console.error(`❌ Continue from scoring error: ${error.message}`);
      callback({ success: false, error: error.message });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    logger.log(`🔌 Client disconnected: ${socket.id}`);

    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const room = rooms.get(playerInfo.roomCode);
      if (room) {
        const disconnectedPlayerIndex = room.players.findIndex(
          (player) => player.reconnectToken === playerInfo.reconnectToken,
        );

        if (disconnectedPlayerIndex !== -1) {
          // Always give a grace period so transient disconnects (HMR, reload,
          // flaky network) don't nuke the room.
          const disconnectedPlayer = room.players[disconnectedPlayerIndex];
          disconnectedPlayer.id = null;
          disconnectedPlayer.disconnectedAt = Date.now();

          // Use a shorter grace period for "waiting" rooms (15s vs full 60s)
          const gracePeriod = room.status === "playing" ? RECONNECT_GRACE_PERIOD_MS : 15_000;

          socket.to(playerInfo.roomCode).emit("player-disconnected", {
            playerName: disconnectedPlayer.name,
            playerIndex: disconnectedPlayerIndex,
            gracePeriodMs: gracePeriod,
            reconnectBy: disconnectedPlayer.disconnectedAt + gracePeriod,
          });

          clearReconnectGraceTimer(room.code, disconnectedPlayer.reconnectToken);
          const timerKey = getReconnectTimerKey(room.code, disconnectedPlayer.reconnectToken);
          const graceTimer = setTimeout(() => {
            const activeRoom = rooms.get(room.code);
            if (!activeRoom) return;

            const timedOutPlayerIndex = activeRoom.players.findIndex(
              (player) => player.reconnectToken === disconnectedPlayer.reconnectToken && player.disconnectedAt,
            );

            if (timedOutPlayerIndex === -1) return;

            const [timedOutPlayer] = activeRoom.players.splice(timedOutPlayerIndex, 1);
            reconnectGraceTimers.delete(timerKey);

            io.to(activeRoom.code).emit("rejoin-grace-expired", {
              playerName: timedOutPlayer.name,
            });
            io.to(activeRoom.code).emit("player-left", {
              playerId: null,
              playerName: timedOutPlayer.name,
              remainingPlayers: activeRoom.players.length,
            });

            if (activeRoom.players.length === 0) {
              logger.log(`🧹 Removing empty room after reconnect grace timeout: ${activeRoom.code}`);
              rooms.delete(activeRoom.code);
              clearRoomReconnectGraceTimers(activeRoom.code);
              vetrolisciServer.removeGame(activeRoom.code);
              return;
            }

            if (activeRoom.status === "playing") {
              activeRoom.status = "waiting";
              vetrolisciServer.removeGame(activeRoom.code);
            }
            io.to(activeRoom.code).emit("room-status-updated", {
              status: activeRoom.status,
              reason: "reconnect_timeout",
              remainingPlayers: activeRoom.players.length,
            });
          }, gracePeriod);

          reconnectGraceTimers.set(timerKey, graceTimer);
        } else {
          room.players = room.players.filter((player) => player.reconnectToken !== playerInfo.reconnectToken);

          socket.to(playerInfo.roomCode).emit("player-left", {
            playerId: socket.id,
            playerName: playerInfo.name,
            remainingPlayers: room.players.length,
          });

          if (room.players.length === 0) {
            logger.log(`🧹 Removing empty room: ${room.code}`);
            rooms.delete(room.code);
            clearRoomReconnectGraceTimers(room.code);
            vetrolisciServer.removeGame(room.code);
          }
        }
      }

      players.delete(socket.id);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  logger.log(`🚀 Vetrolisci server running on port ${PORT}`);
  logger.log(`📡 Socket.IO ready for connections`);
  logger.log(`🌐 Server endpoint: http://localhost:${PORT}`);
});
