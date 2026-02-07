# Code Review: `vetrolisci`

> **Review date:** 2026-02-07
> **Reviewer:** GPT-5.2-Codex
> **Lines reviewed:** ~1200
> **Language/Framework:** JavaScript (React, Node.js, Socket.IO)

---

## Summary

The core gameplay logic is solid and well-structured, but the scoring-phase synchronization has critical gaps that can stall games. A few medium-priority server state issues and client error-handling choices reduce resilience and maintainability.

---

## 🔴 CRITICAL

None found.

---

## 🟠 HIGH Priority

### 1. Scoring phase update event is emitted but never consumed

**Lines:** 381-387 (src/server/main.js), 66-74 (src/App.jsx)
**Why it matters:** After scoring, the server emits `vetrolisci-game-updated`, but the client only listens for `vetrolisci-game-state`. This leaves clients stuck with stale state after `continue-from-scoring`, blocking progression into the next draft/round.

**Current code:**

```js
// src/server/main.js
const gameState = vetrolisciServer.getGameState(roomCode);
io.to(roomCode).emit("vetrolisci-game-updated", gameState);
```

```js
// src/App.jsx
socketClient.on("vetrolisci-game-state", (data) => {
  setGameData((prev) => (prev ? { ...prev, gameState: data } : prev));
});
```

**Suggested fix:**

```js
// Option A: listen for the server event in GameBoard (preferred)
socketClient.on("vetrolisci-game-updated", (data) => {
  updateGameState(data);
});

// Option B: change server event name to match the client listener
io.to(roomCode).emit("vetrolisci-game-state", gameState);
```

---

### 2. Turn scoring modal cannot render because `roundScores` never reaches the client state

**Lines:** 7-14 (src/client/components/TurnScoreModal.jsx), 421-436 (src/server/vetrolisci-server.js)
**Why it matters:** `TurnScoreModal` returns `null` when `gameState.roundScores` is missing, so players never see the scoring modal or the continue button, which can block the game loop.

**Current code:**

```jsx
// src/client/components/TurnScoreModal.jsx
if (!isOpen || !gameState || !gameState.roundScores) return null;
const playerScore = gameState.roundScores.find((score) => score.playerIndex === playerIndex);
```

```js
// src/server/vetrolisci-server.js
return {
  id: game.id,
  gameType: game.gameType,
  players: game.players,
  currentRound: game.currentRound,
  phase: game.phase,
  turn: game.turn,
  draftState: game.draftState,
  currentPickingPlayer: this.getCurrentPickingPlayer(roomCode),
  status: game.status,
};
```

**Suggested fix:**

```js
// Store and return round scores on the server
game.roundScores = roundScores;

return {
  ...,
  roundScores: game.roundScores
};
```

```jsx
// Or, capture roundScores from the round-complete event and pass it to TurnScoreModal
setGameState((prev) => ({ ...prev, roundScores: data.roundScores }));
```

---

## 🟡 MEDIUM Priority

### 1. Score breakdown field mismatch hides color zone points

**Lines:** 43, 68 (src/client/components/TurnScoreModal.jsx), 6-30 (src/core/scoring.js)
**Why it matters:** The modal reads `colorBonus`, but the scoring engine exposes `colorZone`. This causes incorrect or zero color points in the UI.

**Current code:**

```jsx
<span className="breakdown-value">{playerScore.breakdown.colorBonus || 0}</span>
```

```js
// src/core/scoring.js
const score = {
  validatedNumbers: 0,
  symbols: 0,
  colorZone: 0,
  breakdown: { ... }
};
```

**Suggested fix:**

```jsx
<span className="breakdown-value">{playerScore.breakdown.colorZone || 0}</span>
```

---

### 2. `gameComplete` flag is computed incorrectly after round 3

**Lines:** 352-366 (src/server/vetrolisci-server.js)
**Why it matters:** The flag returns `false` when the last round finishes (`currentRound === 3`), which can mislead UI about the next round and cause inconsistent state messaging.

**Current code:**

```js
return { roundScores, gameComplete: game.currentRound > 3 };
```

**Suggested fix:**

```js
return { roundScores, gameComplete: game.currentRound >= 3 };
// or: game.phase === 'finished'
```

---

### 3. Transient errors trigger the full error screen

**Lines:** 399-412 (src/client/components/GameBoard.jsx)
**Why it matters:** Minor pick/turn errors set `error`, which immediately switches the UI to the fatal error screen. This hides the board and feels like a crash, even though the app can recover.

**Current code:**

```jsx
if (error) {
  return (
    <div className="game-board error">
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={onBackToMenu}>Back to Menu</button>
    </div>
  );
}
```

**Suggested fix:**

```jsx
// Split fatal errors from transient errors
const [fatalError, setFatalError] = useState("" );
const [bannerError, setBannerError] = useState("" );

if (fatalError) { ... }
// bannerError drives the dismissible banner only
```

---

### 4. Room recovery is blocked after a disconnect

**Lines:** 396-420 (src/server/main.js)
**Why it matters:** When a player disconnects, the room stays in `playing` status, so rejoining is rejected. This leaves the remaining player stranded and prevents recovery.

**Suggested fix:**

```js
// If a room drops below 2 players, mark it as waiting and pause/cleanup the game
if (room.players.length < 2) {
  room.status = "waiting";
  vetrolisciServer.removeGame(room.code); // or keep and allow reconnection tokens
}
```

---

### 5. Expired rooms are cleaned up but games are not

**Lines:** 45-55 (src/server/main.js)
**Why it matters:** `cleanupExpiredRooms` removes room entries but leaves corresponding games in memory. Over time, this can leak memory in a long-running server.

**Suggested fix:**

```js
if (now - room.createdAt > THIRTY_MINUTES) {
  rooms.delete(roomCode);
  vetrolisciServer.removeGame(roomCode);
}
```

---

## 🔵 LOW Priority

### 1. Duplicate score aggregation logic in two UI components

**Lines:** 6-16 (src/client/components/ScoreBoard.jsx), 9-17 (src/client/components/ScoreboardModal.jsx)
**Why it matters:** The same `getCurrentScore` and `getTotalScore` logic exists twice, increasing maintenance cost and the risk of divergence.

**Suggested fix:** Extract a shared `scoreUtils.js` helper in `src/client` or `src/shared`.

---

### 2. Duplicate Escape-key handling in modals

**Lines:** 9-20 (src/client/components/CardChoiceModal.jsx), 15-26 (src/client/components/PlacementChoiceModal.jsx)
**Why it matters:** The duplicated event wiring can drift and creates unnecessary boilerplate.

**Suggested fix:** Add a small `useEscapeKey` hook or move the behavior into the shared `Modal` component.

---

### 3. CSS class collisions for restriction overlays

**Lines:** 412-427 (src/client/components/GameBoard.css), 219-234 (src/client/components/DraftPhase.css)
**Why it matters:** Global class names (`.card-restriction-overlay`, `.restriction-icon`) are defined in multiple files with different styling, leading to unpredictable visuals depending on CSS load order.

**Suggested fix:** Namespace styles per component or consolidate into a single shared rule.

---

### 4. Unused prop in `GameBoard`

**Lines:** 363-367 (src/App.jsx)
**Why it matters:** `initialGameState` is passed but ignored, which is confusing and hides potential optimization.

**Suggested fix:** Remove the prop or use it to seed `GameBoard` state.

---

## 💡 Nits (Optional)

- **Line 96 (src/client/components/DraftPhase.jsx):** Nit: mutating `isInitialRender.current` inside render is workable but unconventional; consider moving to `useEffect`.
- **Line 113 (src/client/components/GameBoard.jsx):** Nit: `console.log` debug statements are frequent; consider gating with a debug flag.

---

## ✅ What's Done Well

- ✅ Clear separation of concerns between server, core game logic, and UI.
- ✅ Placement and validation rules are centralized in `src/core`, which reduces UI coupling.
- ✅ Thoughtful UX touches (animations, tooltips, sound toggles) add polish without complicating the core logic.

---

## Recommendations

1. **Fix scoring-phase synchronization** — align event names and include round scores in the client state so the game can always progress.
2. **Harden room lifecycle** — support disconnect recovery or clearly reset games when a player leaves.
3. **Consolidate UI utilities** — extract shared scoring helpers and modal keyboard handling to reduce duplication.
