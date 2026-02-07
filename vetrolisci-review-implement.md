# Vetrolisci — Implementation Plan

> Based on code review by GPT-5.2-Codex (validated) + independent audit by Claude Opus 4.6
> Date: 2026-02-07
> **Status:** Sprint 1 ✅ | Sprint 2 ✅ | Sprint 3 ✅ | Sprint 4 ✅

---

## Overview

Issues are grouped into 4 sprints ordered by severity and dependency. Each sprint should be completed and tested before starting the next. Estimated effort is per-item.

---

## Sprint 1: Critical Game Flow Fixes

> **Goal:** Make the game playable end-to-end without stalling.
> **Files touched:** `vetrolisci-server.js`, `main.js`, `GameBoard.jsx`, `TurnScoreModal.jsx`

### 1.1 Scoring phase is skipped — game never pauses for score display

- **Severity:** HIGH (game-blocking)
- **Effort:** Medium
- **Files:** [src/server/vetrolisci-server.js](src/server/vetrolisci-server.js#L340-L380)
- **Problem:** `endRound()` sets `game.phase = 'scoring'` but then _immediately_ transitions to `'draft'` (or `'finished'`) in the same call. By the time the client receives state, the phase is never `'scoring'`, so `TurnScoreModal` never opens and the `continue-from-scoring` event can never fire.
- **Fix:** Split `endRound()` into two steps:
  1. **Step A (endRound):** Set `phase = 'scoring'`, calculate scores, store `roundScores` on the game object. Do **not** advance to next round.
  2. **Step B (advanceFromScoring):** Called by `continue-from-scoring` handler — increment round, reset grids, deal new cards, set `phase = 'draft'`.

### 1.2 `gameComplete` flag returns `false` after final round

- **Severity:** HIGH
- **Effort:** Small
- **Files:** [src/server/vetrolisci-server.js](src/server/vetrolisci-server.js#L378)
- **Problem:** `endRound()` returns `{ gameComplete: game.currentRound > 3 }` but `currentRound` is 3 (never incremented on the last round), so the flag is always `false`.
- **Fix:** Change to `game.currentRound >= 3` or derive from `game.phase === 'finished'`.

### 1.3 `vetrolisci-game-updated` event is emitted but never consumed

- **Severity:** HIGH
- **Effort:** Small
- **Files:** [src/server/main.js](src/server/main.js#L381-L387), [src/client/components/GameBoard.jsx](src/client/components/GameBoard.jsx)
- **Problem:** After `continue-from-scoring`, the server emits `vetrolisci-game-updated` — but the client only listens for `vetrolisci-game-state` (App.jsx) and game-specific events (GameBoard.jsx). The update is lost.
- **Fix:** Either rename the server emission to `vetrolisci-game-state`, or add a listener in `GameBoard.jsx` for `vetrolisci-game-updated`. Prefer renaming for consistency.

### 1.4 `roundScores` never reaches the client

- **Severity:** HIGH
- **Effort:** Small
- **Files:** [src/server/vetrolisci-server.js](src/server/vetrolisci-server.js#L421-L436), [src/client/components/TurnScoreModal.jsx](src/client/components/TurnScoreModal.jsx#L7)
- **Problem:** `getGameState()` never includes `roundScores`. `TurnScoreModal` checks `gameState.roundScores` and returns `null` when missing.
- **Fix:** Store `roundScores` on the game object during `endRound()` and include it in `getGameState()` return value.

### 1.5 Score breakdown shows `colorBonus` instead of `colorZone`

- **Severity:** MEDIUM
- **Effort:** Small
- **Files:** [src/client/components/TurnScoreModal.jsx](src/client/components/TurnScoreModal.jsx#L43), [src/client/components/TurnScoreModal.jsx](src/client/components/TurnScoreModal.jsx#L68)
- **Problem:** The modal reads `playerScore.breakdown.colorBonus` but the scoring engine exposes `colorZone`. Displays zero.
- **Fix:** Change `colorBonus` → `colorZone` in both player sections.

### 1.6 Error state hijacks the entire UI

- **Severity:** MEDIUM
- **Effort:** Small
- **Files:** [src/client/components/GameBoard.jsx](src/client/components/GameBoard.jsx#L399-L412), [src/client/components/GameBoard.jsx](src/client/components/GameBoard.jsx#L470-L485)
- **Problem:** Two error handling paths exist:
  1. An early return (line ~399) that replaces the entire game board with an error screen.
  2. An `AnimatePresence` dismissible banner in the main render (line ~470) — this is _dead code_ because the early return fires first.
     Transient errors like "not your turn" set `error`, triggering the full-screen error for 3 seconds.
- **Fix:** Remove the early-return error screen. The dismissible banner already exists and handles transient errors correctly. Add a separate `fatalError` state for truly unrecoverable failures (connection lost, game not found).

---

## Sprint 2: Server Resilience & Room Lifecycle

> **Goal:** Prevent stuck rooms, memory leaks, and disconnection dead-ends.
> **Files touched:** `main.js`, `vetrolisci-server.js`, `socket-client.js`

### 2.1 Expired room cleanup leaks game state

- **Severity:** MEDIUM
- **Effort:** Small
- **Files:** [src/server/main.js](src/server/main.js#L45-L55)
- **Problem:** `cleanupExpiredRooms()` deletes room entries from the `rooms` Map but never removes corresponding game objects from `vetrolisciServer.games`.
- **Fix:** Call `vetrolisciServer.removeGame(roomCode)` alongside `rooms.delete(roomCode)`.

### 2.2 Disconnects leave rooms in `playing` status

- **Severity:** MEDIUM
- **Effort:** Medium
- **Files:** [src/server/main.js](src/server/main.js#L396-L420)
- **Problem:** When a player disconnects mid-game, the room stays in `playing` status. The remaining player can't recover, and no new player can join.
- **Fix:** When a room drops below 2 players during `playing` status, either:
  - (Simple) Reset room to `waiting` and remove the game, or
  - (Better) Keep the game and allow reconnection within a timeout window.
    Start with the simple approach.

### 2.3 `continue-from-scoring` needs both players' acknowledgment

- **Severity:** MEDIUM
- **Effort:** Medium
- **Files:** [src/server/main.js](src/server/main.js#L370-L390)
- **Problem:** Currently either player emitting `continue-from-scoring` advances the game. One player could skip the scoring screen before the other has seen it.
- **Fix:** Track which players have acknowledged scoring. Only advance when both have confirmed.

### 2.4 CORS origins are hardcoded

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/server/main.js](src/server/main.js#L5-L10)
- **Problem:** `origin: ["http://localhost:5173", "http://192.168.0.105:5173"]` — breaks on any other host/port.
- **Fix:** Read from `process.env.CORS_ORIGINS` or default to `*` in development.

### 2.5 `onConnectionStatus` stacks listeners without cleanup

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/shared/utils/socket-client.js](src/shared/utils/socket-client.js#L143-L150)
- **Problem:** `onConnectionStatus()` calls `this.socket.on()` directly (bypassing the singleton tracking), so listeners accumulate on repeated calls and are never removed.
- **Fix:** Track these listeners and provide a cleanup method, or use the existing `on()` wrapper.

---

## Sprint 3: Code Cleanup & Deduplication

> **Goal:** Reduce maintenance surface and eliminate divergence risk.
> **Files touched:** Multiple client components, core modules

### 3.1 Duplicate score helper functions

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/client/components/ScoreBoard.jsx](src/client/components/ScoreBoard.jsx#L6-L16), [src/client/components/ScoreboardModal.jsx](src/client/components/ScoreboardModal.jsx#L9-L17)
- **Problem:** `getCurrentScore()` and `getTotalScore()` are copy-pasted across two components.
- **Fix:** Extract into `src/client/utils/scoreUtils.js` and import from both.

### 3.2 Duplicate Escape-key handling in modals

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/client/components/CardChoiceModal.jsx](src/client/components/CardChoiceModal.jsx#L9-L20), [src/client/components/PlacementChoiceModal.jsx](src/client/components/PlacementChoiceModal.jsx#L15-L26)
- **Problem:** Same `useEffect` with `keydown` listener for Escape is duplicated.
- **Fix:** Either create a `useEscapeKey(isOpen, onClose)` hook, or integrate the behavior into the shared `Modal` component (which already receives `onClose`).

### 3.3 CSS class collisions for restriction overlays

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/client/components/GameBoard.css](src/client/components/GameBoard.css), [src/client/components/DraftPhase.css](src/client/components/DraftPhase.css)
- **Problem:** `.card-restriction-overlay` and `.restriction-icon` are defined in multiple CSS files with different rules. CSS load order determines which wins.
- **Fix:** Consolidate into one shared file (e.g., `Card.css`) or namespace per component (`.draft-phase .card-restriction-overlay`).

### 3.4 Remove unused `initialGameState` prop

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/App.jsx](src/App.jsx#L363-L367), [src/client/components/GameBoard.jsx](src/client/components/GameBoard.jsx#L22)
- **Problem:** `initialGameState` is passed from App.jsx to GameBoard but never used inside GameBoard. Could seed state to avoid the loading flash.
- **Fix:** Either remove the prop entirely, or use it to initialize `gameState` (skip the initial fetch if provided).

### 3.5 Remove dead code in core modules

- **Severity:** LOW
- **Effort:** Small
- **Files:** Multiple core files
- **Problem:** Several exported functions are never imported anywhere:
  - `scoring.js`: `floodFillPureColorZone()`, `floodFillColorZone()`, `colorsMatch()` — all obsoleted by `floodFillResolvedColorZone()`.
  - `placement.js`: `canValidateCard()`, `validateCard()` — superseded by `validation.js`.
  - `validation.js`: `checkRoundEndConditions()`, `applySpecialCardEffects()` — never imported.
  - `draft.js`: `startPickPhase()` — never called (draft starts in PICK directly).
  - `cards.js`: `dealRoundCards()` — superseded by `dealTurnCards()`.
- **Fix:** Remove unused functions. Keep exports only for code that's actively imported.

### 3.6 Card.jsx duplicated MotionDiv pattern

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/client/components/Card.jsx](src/client/components/Card.jsx)
- **Problem:** The same conditional MotionDiv + motionProps pattern is repeated 3 times (for back, empty, and front renders).
- **Fix:** Extract the wrapper logic into a small helper or compute `MotionDiv` and `motionProps` once at the top of the render.

---

## Sprint 4: Polish & Developer Experience

> **Goal:** Improve DX, fix minor UX issues, and tighten robustness.
> **Files touched:** Various

### 4.1 Gate debug `console.log` statements behind a flag

- **Severity:** LOW
- **Effort:** Small
- **Files:** GameBoard.jsx, vetrolisci-server.js, main.js, socket-client.js
- **Problem:** Dozens of `console.log` calls with emoji prefixes (`🎯`, `🔌`, etc.) clutter the console in production.
- **Fix:** Create a simple `logger` utility that respects `import.meta.env.DEV` (client) or `process.env.NODE_ENV` (server).

### 4.2 Fix `isInitialRender.current` mutation in render

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/client/components/DraftPhase.jsx](src/client/components/DraftPhase.jsx#L94-L96)
- **Problem:** `isInitialRender.current` is mutated during render, which is unconventional and could cause issues with React strict mode's double-render.
- **Fix:** Move the mutation into a `useEffect`.

### 4.3 AudioService creates Audio objects at import time

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/client/services/audio.js](src/client/services/audio.js)
- **Problem:** The singleton constructor creates `new Audio(...)` immediately when the module is imported. This fails in SSR/Node contexts and preloads assets that may never be needed.
- **Fix:** Lazy-initialize audio objects on first `playSound()` or `startBackgroundMusic()` call.

### 4.4 Player names are hardcoded as "Host" / "Guest"

- **Severity:** LOW
- **Effort:** Medium
- **Files:** [src/App.jsx](src/App.jsx#L155), [src/App.jsx](src/App.jsx#L199)
- **Problem:** `playerName` is always `"Host"` or `"Guest"`. No UI to enter a name.
- **Fix:** Add input fields on the menu/join screens, or generate fun random names. Store in state and pass to socket events.

### 4.5 ScoreboardModal reimplements Modal overlay/animation

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/client/components/ScoreboardModal.jsx](src/client/components/ScoreboardModal.jsx)
- **Problem:** ScoreboardModal builds its own overlay + animation from scratch instead of using the shared `Modal` component. This creates a parallel implementation that can drift.
- **Fix:** Refactor ScoreboardModal to use the shared `Modal` wrapper, same pattern as CardChoiceModal and PlacementChoiceModal.

### 4.6 `emit()` rejects on `response.error` but server sends `{ success: false, error }`

- **Severity:** LOW
- **Effort:** Small
- **Files:** [src/shared/utils/socket-client.js](src/shared/utils/socket-client.js#L101-L115)
- **Problem:** `emit()` checks for `response?.error` and rejects, but the server returns `{ success: false, error: message }`. This means the Promise rejects even for expected validation errors (like "not your turn"), forcing callers to use try/catch instead of checking `response.success`. Some callers already check `response.success` and would never see errors.
- **Fix:** Only reject on transport-level failures. Let callers handle `{ success: false }` via the response object.

---

## Sprint Summary

| Sprint                    | Items   | Priority | Est. Effort |
| ------------------------- | ------- | -------- | ----------- |
| **1 — Game Flow**         | 6 items | HIGH     | ~4 hours    |
| **2 — Server Resilience** | 5 items | MEDIUM   | ~3 hours    |
| **3 — Code Cleanup**      | 6 items | LOW      | ~2 hours    |
| **4 — Polish & DX**       | 6 items | LOW      | ~3 hours    |

**Recommended order:** Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4

Sprint 1 is prerequisite for a working game loop. Sprint 2 prevents production issues. Sprints 3 and 4 are independent and can be done in any order or parallelized.
