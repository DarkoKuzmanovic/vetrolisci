import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import vetrolisciServer from './vetrolisci-server.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://192.168.0.105:5173"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8001;

// Room management
const rooms = new Map();
const players = new Map(); // socketId -> playerInfo

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    connectedPlayers: players.size
  });
});

// Generate room code (6-character alphanumeric)
function generateRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
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
      console.log(`🧹 Cleaning up expired room: ${roomCode}`);
      rooms.delete(roomCode);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredRooms, 5 * 60 * 1000);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Health check for socket connection
  socket.emit('connected', { 
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Create room
  socket.on('create-room', (data, callback) => {
    try {
      const { playerName = 'Host' } = data || {};
      const roomCode = generateRoomCode();
      
      const hostPlayer = {
        id: socket.id,
        name: playerName,
        joinedAt: Date.now()
      };
      
      const room = {
        code: roomCode,
        gameType: 'vetrolisci',
        host: socket.id,
        players: [hostPlayer], // Add host as first player
        status: 'waiting', // 'waiting', 'playing', 'finished'
        createdAt: Date.now()
      };
      
      rooms.set(roomCode, room);
      players.set(socket.id, { roomCode: room.code, ...hostPlayer });
      socket.join(room.code); // Join the socket room
      
      console.log(`🎮 Room created: ${roomCode} (${room.gameType}) by ${playerName}`);
      
      callback({
        success: true,
        roomCode,
        gameType: room.gameType,
        room: {
          code: room.code,
          gameType: room.gameType,
          playerIndex: 0, // Host is always player 0
          players: room.players
        }
      });
    } catch (error) {
      console.error('❌ Error creating room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Check room info
  socket.on('check-room', (data, callback) => {
    try {
      const { roomCode } = data || {};
      if (!roomCode) {
        callback({ success: false, error: 'Room code is required' });
        return;
      }
      const room = rooms.get(roomCode.toUpperCase());
      
      if (!room) {
        callback({ 
          success: false, 
          error: 'Room not found or expired' 
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
          maxPlayers: 2
        }
      });
    } catch (error) {
      console.error('❌ Error checking room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Join room
  socket.on('join-room', (data, callback) => {
    try {
      const { roomCode, playerName = 'Anonymous' } = data || {};
      if (!roomCode) {
        callback({ success: false, error: 'Room code is required' });
        return;
      }
      const room = rooms.get(roomCode.toUpperCase());
      
      if (!room) {
        callback({ 
          success: false, 
          error: 'Room not found or expired' 
        });
        return;
      }
      
      if (room.status !== 'waiting') {
        callback({ 
          success: false, 
          error: 'Game already in progress' 
        });
        return;
      }
      
      if (room.players.length >= 2) {
        callback({ 
          success: false, 
          error: 'Room is full' 
        });
        return;
      }
      
      const player = {
        id: socket.id,
        name: playerName,
        joinedAt: Date.now()
      };
      
      room.players.push(player);
      players.set(socket.id, { roomCode: room.code, ...player });
      socket.join(room.code);
      
      console.log(`👤 Player ${playerName} joined room ${room.code}`);
      
      // Notify other players in the room
      socket.to(room.code).emit('player-joined', {
        player,
        playerCount: room.players.length
      });
      
      callback({
        success: true,
        room: {
          code: room.code,
          gameType: room.gameType,
          playerIndex: room.players.length - 1,
          players: room.players
        }
      });
      
      // Start game if room is full
      if (room.players.length === 2) {
        room.status = 'playing';
        
        // Create the actual game based on game type
        let gameState = null;
        try {
          gameState = vetrolisciServer.createGame(room.code, room.players);
          console.log(`🎮 Vetrolisci game created for room ${room.code}`);
        } catch (error) {
          console.error(`❌ Error creating Vetrolisci game: ${error.message}`);
        }
        
        io.to(room.code).emit('game-started', {
          room,
          gameState,
          message: 'Game started! Let the fun begin!'
        });
        console.log(`🚀 Game started in room ${room.code} (${room.gameType})`);
      }
      
    } catch (error) {
      console.error('❌ Error joining room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Vetrolisci game event handlers
  socket.on('vetrolisci-pick-card', async (data, callback) => {
    try {
      const { roomCode, cardId, placementChoice } = data;
      console.log(`🎯 Vetrolisci pick card: ${socket.id} in room ${roomCode} picks card ${cardId}`);
      
      const result = vetrolisciServer.handleCardPick(roomCode, socket.id, cardId, placementChoice);
      
      if (result.needsChoice) {
        // Player needs to make a placement choice
        callback({
          success: true,
          needsChoice: true,
          choiceType: result.choiceType,
          selectedCard: result.selectedCard
        });
      } else {
        // Card placed successfully, broadcast to all players in room
        const gameState = vetrolisciServer.getGameState(roomCode);
        
        io.to(roomCode).emit('vetrolisci-card-placed', {
          gameState,
          playerId: socket.id,
          cardId,
          placementResult: result.placementResult
        });
        
        // Check if round/game is complete using the result data
        if (result.roundComplete && result.roundScores) {
          // Round complete - use data from the vetrolisci server
          io.to(roomCode).emit('vetrolisci-round-complete', {
            roundNumber: gameState.currentRound - 1, // Round that just completed
            roundScores: result.roundScores,
            nextRound: result.gameComplete ? null : gameState.currentRound,
            gameState
          });
        } else if (gameState.phase === 'finished') {
          // Game complete
          io.to(roomCode).emit('vetrolisci-game-complete', {
            gameState
          });
        }
        
        callback({
          success: true,
          cardPlaced: true,
          gameState
        });
      }
    } catch (error) {
      console.error(`❌ Vetrolisci pick card error: ${error.message}`);
      callback({ success: false, error: error.message });
    }
  });

  socket.on('vetrolisci-placement-choice', async (data, callback) => {
    try {
      const { roomCode, cardId, choice } = data;
      console.log(`🎯 Vetrolisci placement choice: ${socket.id} in room ${roomCode}`);
      
      const result = vetrolisciServer.handlePlacementChoice(roomCode, socket.id, cardId, choice);
      const gameState = vetrolisciServer.getGameState(roomCode);
      
      // Broadcast to all players in room
      io.to(roomCode).emit('vetrolisci-card-placed', {
        gameState,
        playerId: socket.id,
        cardId,
        placementResult: result.placementResult
      });
      
      // Check if round/game is complete using the result data
      if (result.roundComplete && result.roundScores) {
        // Round complete - use data from the vetrolisci server
        io.to(roomCode).emit('vetrolisci-round-complete', {
          roundNumber: gameState.currentRound - 1, // Round that just completed
          roundScores: result.roundScores,
          nextRound: result.gameComplete ? null : gameState.currentRound,
          gameState
        });
      } else if (gameState.phase === 'finished') {
        // Game complete
        io.to(roomCode).emit('vetrolisci-game-complete', {
          gameState
        });
      }
      
      callback({
        success: true,
        gameState
      });
    } catch (error) {
      console.error(`❌ Vetrolisci placement choice error: ${error.message}`);
      callback({ success: false, error: error.message });
    }
  });

  socket.on('vetrolisci-get-state', (data, callback) => {
    try {
      const { roomCode } = data;
      const room = rooms.get(roomCode?.toUpperCase());

      if (!room) {
        callback({ success: false, error: 'Room not found or expired' });
        return;
      }

      let gameState = vetrolisciServer.getGameState(room.code);

      // If a room exists but a game wasn't initialized, create it now to recover.
      if (!gameState && room.players.length >= 2) {
        console.warn(`⚠️ Missing game state for room ${room.code}, reinitializing Vetrolisci game`);
        gameState = vetrolisciServer.createGame(room.code, room.players);
        room.status = 'playing';
      }
      
      callback({
        success: true,
        gameState
      });
    } catch (error) {
      console.error(`❌ Vetrolisci get state error: ${error.message}`);
      callback({ success: false, error: error.message });
    }
  });

  socket.on('continue-from-scoring', (data) => {
    try {
      const { roomCode } = data;
      console.log(`🎯 Continue from scoring for room ${roomCode}`);
      
      const game = vetrolisciServer.getGame(roomCode);
      if (!game) {
        console.error(`❌ Game not found: ${roomCode}`);
        return;
      }
      
      // Transition from scoring phase to next turn/round
      if (game.phase === 'scoring') {
        if (game.currentRound >= 3) {
          // Game should be finished
          game.phase = 'finished';
        } else {
          // Continue to next turn of current round or start new round
          game.phase = 'draft';
        }
        
        // Emit updated game state to all players in the room
        const gameState = vetrolisciServer.getGameState(roomCode);
        io.to(roomCode).emit('vetrolisci-game-updated', gameState);
        
        console.log(`🎯 Transitioned from scoring to ${game.phase} phase`);
       }
     } catch (error) {
       console.error(`❌ Continue from scoring error: ${error.message}`);
     }
   });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const room = rooms.get(playerInfo.roomCode);
      if (room) {
        // Remove player from room
        room.players = room.players.filter(p => p.id !== socket.id);
        
        // Notify other players
        socket.to(playerInfo.roomCode).emit('player-left', {
          playerId: socket.id,
          playerName: playerInfo.name,
          remainingPlayers: room.players.length
        });
        
        // Clean up empty rooms or mark as abandoned
        if (room.players.length === 0) {
          console.log(`🧹 Removing empty room: ${room.code}`);
          rooms.delete(room.code);
        }
      }
      
      players.delete(socket.id);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Vetrolisci server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`🌐 Server accessible at:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.0.105:${PORT}`);
});
