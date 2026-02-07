import { io } from "socket.io-client";
import logger from "./logger.js";

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  connect(serverUrl) {
    // Auto-detect server URL based on current page URL
    if (!serverUrl) {
      const hostname = window.location.hostname;
      const port = "8001"; // Always use port 8001 for server
      serverUrl = `http://${hostname}:${port}`;
    }

    if (this.socket?.connected) {
      logger.log("🔌 Socket already connected");
      return Promise.resolve();
    }

    logger.log(`🔌 Connecting to server: ${serverUrl}`);

    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        this.connected = true;
        logger.log(`🔌 Connected to server: ${this.socket.id}`);
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        console.error("🔌 Connection error:", error);
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        this.connected = false;
        logger.log(`🔌 Disconnected: ${reason}`);
      });

      this.socket.on("reconnect", (attemptNumber) => {
        this.connected = true;
        logger.log(`🔌 Reconnected after ${attemptNumber} attempts`);
      });

      this.socket.on("reconnect_error", (error) => {
        console.error("🔌 Reconnection error:", error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      logger.log("🔌 Disconnecting from server");
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  // Generic event listeners
  on(event, callback) {
    if (!this.socket) {
      logger.warn(`🔌 Socket not connected. Cannot listen for event: ${event}`);
      return;
    }

    // Remove existing listener if it exists
    this.off(event);

    // Add new listener
    this.socket.on(event, callback);
    this.listeners.set(event, callback);
    logger.log(`🔌 Listening for event: ${event}`);
  }

  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
      logger.log(`🔌 Stopped listening for event: ${event}`);
    }
  }

  emit(event, data) {
    if (!this.socket?.connected) {
      logger.warn(`🔌 Socket not connected. Cannot emit event: ${event}`);
      return Promise.reject(new Error("Socket not connected"));
    }

    logger.log(`🔌 Emitting event: ${event}`, data);
    return new Promise((resolve, reject) => {
      // Add timeout to handle cases where server doesn't respond
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout for event: ${event}`));
      }, 10000); // 10 second timeout

      this.socket.emit(event, data, (response) => {
        clearTimeout(timeout);

        // Always resolve with the response object
        // Let callers check response.success for application-level errors
        logger.log(`🔌 Server response for ${event}:`, response);
        resolve(response);
      });
    });
  }

  // Room management methods
  async createRoom(playerName = "Host") {
    return this.emit("create-room", { playerName });
  }

  async joinRoom(roomCode, playerName = "Guest") {
    return this.emit("join-room", { roomCode, playerName });
  }

  async checkRoom(roomCode) {
    return this.emit("check-room", { roomCode });
  }

  // Connection status
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  getSocketId() {
    return this.socket?.id;
  }

  // Event handlers for common events
  onRoomCreated(callback) {
    this.on("room-created", callback);
  }

  onRoomJoined(callback) {
    this.on("room-joined", callback);
  }

  onRoomInfo(callback) {
    this.on("room-info", callback);
  }

  onGameStarted(callback) {
    this.on("game-started", callback);
  }

  onPlayerJoined(callback) {
    this.on("player-joined", callback);
  }

  onPlayerLeft(callback) {
    this.on("player-left", callback);
  }

  onError(callback) {
    this.on("error", callback);
  }

  onConnectionStatus(callback) {
    if (!this.socket) return;

    // Remove existing connection status listeners first
    const events = ["connect", "disconnect", "reconnect"];
    events.forEach((event) => {
      const existingCallback = this.listeners.get(`_status_${event}`);
      if (existingCallback) {
        this.socket.off(event, existingCallback);
        this.listeners.delete(`_status_${event}`);
      }
    });

    // Add new listeners and track them
    const connectHandler = () => callback({ connected: true });
    const disconnectHandler = () => callback({ connected: false });
    const reconnectHandler = () => callback({ connected: true, reconnected: true });

    this.socket.on("connect", connectHandler);
    this.socket.on("disconnect", disconnectHandler);
    this.socket.on("reconnect", reconnectHandler);

    this.listeners.set("_status_connect", connectHandler);
    this.listeners.set("_status_disconnect", disconnectHandler);
    this.listeners.set("_status_reconnect", reconnectHandler);
  }
}

// Create a singleton instance
const socketClient = new SocketClient();

export default socketClient;
