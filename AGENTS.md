# Vetrolisci

Multiplayer Vetrolisci (Pixies) card duel built with React, Vite, Express, and Socket.IO.

## Commands

- `npm run dev` - Start server and client concurrently
- `npm run server` - Start the Express + Socket.IO server
- `npm run client` - Start the Vite dev server
- `npm run build` - Build the client for production
- `npm run preview` - Preview the production build

## Architecture

- `src/client` - React UI for the game
- `src/core` - Shared game logic
- `src/server` - Express + Socket.IO server and game coordination
- `src/shared` - Shared UI components, styles, and socket client

## Conventions

- React components colocate CSS in the same folder
- Shared logic lives in `src/core`

## Lessons Learned

### 2026-02-07: Initial agent setup

**Problem:** Missing project context file for agent guidance.
**Root cause:** `AGENTS.md` did not exist in the repo root.
**Solution:** Added a minimal `AGENTS.md` with commands and architecture.
**Prevention:** Keep `AGENTS.md` updated as architecture or commands change.

### 2026-02-07: Scoring phase never visible in multiplayer game

**Problem:** TurnScoreModal never opens, `continue-from-scoring` handler never fires, and games get stuck after round completion.
**Root cause:** `endRound()` in vetrolisci-server.js transitioned from `phase = 'scoring'` to `phase = 'draft'` (or `'finished'`) in the same function call, so clients never saw `phase === 'scoring'`.
**Solution:** Split round lifecycle into two steps: (1) `endRound()` sets `phase = 'scoring'` and stops, (2) new `advanceFromScoring()` method (called by `continue-from-scoring` handler) increments round and starts next draft. Also included `roundScores` in `getGameState()` return and fixed `gameComplete` flag logic (`>= 3` not `> 3`).
**Prevention:** When designing phase-based state machines, ensure each phase is observable at the client layer before automatic transitions. Consider explicit acknowledgment/continue actions for important milestones like scoring.

### 2026-02-07: Server resilience improvements

**Problem:** Multiple server-side issues: expired rooms leaked game state, disconnects left rooms in unrecoverable state, CORS origins were hardcoded, and socket listeners stacked without cleanup.
**Root cause:** Missing cleanup logic in various server lifecycle hooks.
**Solution:**

- Added `removeGame()` calls in room cleanup to prevent memory leaks
- Reset room to `waiting` status and remove game when player count drops below 2 during `playing`
- Added both-player acknowledgment requirement for scoring phase advancement (prevents one player skipping before other sees score)
- Changed CORS to read from `CORS_ORIGINS` env var or default to `*` in development
- Fixed `onConnectionStatus()` to properly track and remove old listeners before adding new ones
  **Prevention:** Always pair resource creation with cleanup. For multiplayer coordination, track which players have completed critical actions before advancing state.

### 2026-02-07: Code quality and polish improvements (Sprint 4)

**Problem:** Multiple DX and polish issues: console.log statements cluttering production, render-phase mutations, eager audio initialization failing in SSR, hardcoded player names, duplicate modal implementations, and confusing error handling.
**Root cause:** Technical debt from rapid development without consistent patterns.
**Solution:**

- Created logger utilities for client/server that respect dev mode (logger.log only outputs in development)
- Fixed `isInitialRender` mutation in DraftPhase.jsx by moving to useEffect
- Made AudioService lazy-initialize on first use instead of at import time
- Added player name input fields in menu/join views with fallback to "Host"/"Guest"
- Refactored ScoreboardModal to use shared Modal component (removed 100+ lines of duplicate code)
- Fixed `emit()` to only reject on transport failures, always resolve with response object (callers check `response.success`)
  **Prevention:** Use logger utilities instead of raw console.log, avoid mutations during render phase, lazy-load resources, extract shared UI patterns early, distinguish transport-level vs application-level errors in API design.
