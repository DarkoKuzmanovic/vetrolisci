# Codex Full Review Plan

> Date: 2026-02-07
> Scope: full review backlog for bugs, code duplication, optimization opportunities, and easy wins.

## Goals

1. Remove game-flow blockers first.
2. Stabilize multiplayer and reconnection behavior.
3. Reduce duplicate logic and dead code.
4. Improve runtime performance and developer productivity.
5. Add product-level game improvements after technical debt is under control.

## Sprint Overview

| Sprint | Focus                        | Primary Outcome                                     |
| ------ | ---------------------------- | --------------------------------------------------- |
| 1      | Critical game flow bugs      | Round progression and scoring flow are reliable     |
| 2      | Multiplayer resilience       | Rooms recover cleanly from disconnects and failures |
| 3      | Duplicates and dead paths    | Lower maintenance cost and less event drift         |
| 4      | Performance and optimization | Smoother UI and cheaper state updates               |
| 5      | Easy wins and DX             | Faster iteration with cleaner logs/scripts/tests    |

---

## Sprint 1: Critical Game Flow Bugs

### [x] `Bug` 1.1 Scoring continue path does not advance round state correctly

- Files: `src/server/main.js:362`, `src/server/vetrolisci-server.js:359`
- Problem: `continue-from-scoring` mutates `phase` directly, but does not call `advanceFromScoring()`. Round/deck/grid transition logic exists but is bypassed.
- **Verified**: `continue-from-scoring` handler sets `game.phase = "draft"` without incrementing `currentRound`, clearing grids, reshuffling deck, resetting turn counts, or calling `startNewTurn()`. The `advanceFromScoring()` method exists and does all of this correctly but is never called.
- Done when:

1. `main.js` calls `vetrolisciServer.advanceFromScoring(game)`.
2. Round 1 and 2 continue transitions start a fresh draft for the next round.
3. Round 3 transitions to `finished` with consistent state.

### [x] `Bug` 1.2 Event mismatch after scoring transition

- Files: `src/server/main.js:385`, `src/App.jsx:73`, `src/client/components/GameBoard.jsx:145`
- Problem: server emits `vetrolisci-game-updated`; client listens for `vetrolisci-game-state`.
- **Verified**: Server emits `vetrolisci-game-updated` in `continue-from-scoring`. App.jsx listens for `vetrolisci-game-state`. GameBoard.jsx listens for neither. All three names differ — no client code receives the post-scoring state update.
- Done when:

1. One canonical event name is used.
2. Client subscribes to that event in the active game view.

### [x] `Bug` 1.3 Incorrect round metadata in `vetrolisci-round-complete`

- Files: `src/server/main.js:267`, `src/server/main.js:269`, `src/server/main.js:311`, `src/server/main.js:313`
- Problem: `roundNumber` uses `currentRound - 1` and `nextRound` uses `currentRound`, which is wrong with current scoring flow.
- **Verified**: `endRound()` does not increment `currentRound`, so at emit time for round 1: `roundNumber = 0` (should be 1), `nextRound = 1` (should be 2). Correct values: `roundNumber: currentRound`, `nextRound: currentRound + 1`.
- Done when:

1. Round complete modal shows correct completed round.
2. Next round preview is accurate (`currentRound + 1` unless complete).

### [x] `Bug` 1.4 Final game event path is inconsistent

- Files: `src/server/main.js:264`, `src/server/main.js:272`, `src/server/main.js:385`, `src/client/components/GameBoard.jsx:200`
- Problem: final-round path emits `round-complete`, then `game-updated`; `vetrolisci-game-complete` may never fire.
- **Verified**: `endRound()` sets phase to `"scoring"`, never `"finished"`, so the `else if (gameState.phase === "finished")` guard in both pick/placement handlers never passes. `vetrolisci-game-complete` is unreachable through normal flow. The only path to `"finished"` is via `continue-from-scoring`, which emits `vetrolisci-game-updated` instead.
- Done when:

1. One clear finalization sequence exists.
2. Client endgame UI and sounds always trigger.

### [x] `Bug` 1.5 Win/loss audio compares missing fields

- Files: `src/client/components/GameBoard.jsx:203`
- Problem: uses `players[*].totalScore`, but player objects store `scores[]`, not `totalScore`.
- **Verified**: `handleGameComplete` reads `data.gameState.players[playerIndex].totalScore` which is `undefined`. Player objects only have `scores: [0, 0, 0]`. Comparison becomes `undefined > undefined → false`, always playing "lose" sound. Additionally, this handler may never fire due to Bug 1.4.
- Done when:

1. Audio compares derived totals from `scores` or server-provided final scores.

---

## Sprint 2: Multiplayer Resilience

### [x] `Bug` 2.1 Room stuck in `playing` after disconnect

- Files: `src/server/main.js:395`
- Problem: if one player leaves, room may remain non-joinable.
- **Verified**: Disconnect handler removes the player from the room array but never resets `room.status` from `"playing"`. The `join-room` handler rejects any room where `status !== "waiting"`, so the room is permanently stuck.
- Done when:

1. Rooms with <2 players move to recoverable state (`waiting` or reconnect window).
2. Remaining player gets clear status event.

### [x] `Bug` 2.2 Scoring acknowledgments are created but not used

- Files: `src/server/vetrolisci-server.js:346`, `src/server/main.js:362`
- Problem: `scoringAcknowledgments` is never checked before advancing.
- **Verified**: `endRound()` creates `game.scoringAcknowledgments = new Set()` but `continue-from-scoring` never adds to it or checks it. The first player to click continue advances the game for both players.
- Done when:

1. Both players must acknowledge scoring before transition, or explicit timeout policy exists.

### [x] `Bug` 2.3 Game creation failure leaves room in broken state

- Files: `src/server/main.js:216`
- Problem: game creation errors are logged, but room can still move forward with null state.
- **Verified**: `room.status` is set to `"playing"` before the try/catch around `createGame()`. If `createGame` throws, `game-started` fires with `gameState: null` and the room is stuck in `"playing"` with no game.
- Done when:

1. Failure path rolls room back safely and notifies clients.

### [x] `Optimization` 2.4 Reconnect flow may create extra socket instances

- Files: `src/shared/utils/socket-client.js:11`
- Problem: `connect()` can re-initialize without explicitly cleaning an existing disconnected socket object.
- **Verified**: Guard is `if (this.socket?.connected)` — if the socket exists but is disconnected, a new `io()` instance is created without calling `disconnect()` on the old one. The old socket retains reconnection listeners and may attempt parallel reconnects.
- Done when:

1. Reconnect path is idempotent and has a single active socket instance.

---

## Sprint 3: Duplicates and Dead Paths

### [x] `Duplicate` 3.1 Round completion broadcast logic is duplicated

- Files: `src/server/main.js:264`, `src/server/main.js:308`
- Problem: near-identical round/game emission blocks in two handlers.
- **Verified**: `vetrolisci-pick-card` and `vetrolisci-placement-choice` handlers contain identical round-complete/game-complete broadcast blocks (same conditions, same emit calls, same payload shapes).
- Done when:

1. Shared helper handles post-placement broadcasting.

### [x] `Duplicate` 3.2 Two scoring modals overlap in purpose

- Files: `src/client/components/RoundCompleteModal.jsx:1`, `src/client/components/TurnScoreModal.jsx:1`, `src/client/components/GameBoard.jsx:673`
- Problem: both represent end-of-round scoring flow.
- **Verified**: `RoundCompleteModal` opens on `vetrolisci-round-complete` event; `TurnScoreModal` opens when `gameState.phase === "scoring"`. Both conditions are true simultaneously at round end, causing two overlapping modals. Only `TurnScoreModal` emits `continue-from-scoring` to advance state.
- Done when:

1. One modal pattern remains for scoring continuation.
2. Removed modal has no remaining imports/CSS.

### [x] `Duplicate` 3.3 Unused scoreboard component imported but not rendered

- Files: `src/client/components/GameBoard.jsx:13`, `src/client/components/ScoreBoard.jsx:1`
- Problem: dead import/component pair increases maintenance surface.
- **Verified**: `ScoreBoard` is imported in GameBoard.jsx but never rendered. `ScoreboardModal` (which IS rendered) does not use `ScoreBoard` either — it has its own inline scoring UI. `ScoreBoard` and its CSS are fully dead code.
- Done when:

1. Either integrate `ScoreBoard` or remove it fully.

### [x] `Duplicate` 3.4 Dead event listener for unused server event

- Files: `src/App.jsx:73`
- Problem: `vetrolisci-game-state` listener has no matching server emit.
- **Verified**: No server code emits `vetrolisci-game-state`. The server emits `vetrolisci-game-updated` (different name). This listener never fires.
- Done when:

1. Listener is removed or server emits it by contract.

### [x] `Easy Win` 3.5 Remove unused props/imports

- Files: `src/client/components/GameBoard.jsx:9`, `src/client/components/GameBoard.jsx:25`
- Problem: `Card` import and `showHeader` prop are unused.
- **Verified**: `Card` is imported but never rendered in GameBoard (cards render through `DraftPhase` and `GameGrid`). `showHeader` is destructured with a default but never referenced in the component body or JSX.
- Done when:

1. Build has no unused UI symbols in this file.

---

## Sprint 4: Performance and Optimization

### [x] `Optimization` 4.1 Memoize draft pickability calculations

- Files: `src/client/components/DraftPhase.jsx:28`
- Problem: `getPickableCards()` recalculates on each render.
- **Verified**: Called directly in the component body without `useMemo`. Runs on every render even when grid and revealed cards haven't changed.
- Done when:

1. Computation is wrapped with `useMemo` keyed on grid + revealed cards.

### [x] `Optimization` 4.2 Avoid JSON deep clone in scoring path

- Files: `src/core/scoring.js:93`
- Problem: `JSON.parse(JSON.stringify(...))` is brittle and slower than targeted cloning.
- **Verified**: Used in `calculateColorZoneBonus` to deep-copy the 3x3 `grid2D`. The structure is fixed-size (3x3 array of card objects), easily replaced with explicit shallow copies via `map` and spread.
- Done when:

1. Replacement uses explicit shallow copies for the fixed 3x3 structure.

### [x] `Optimization` 4.3 Consolidate timeout cleanup in game board

- Files: `src/client/components/GameBoard.jsx:170`, `src/client/components/GameBoard.jsx:178`, `src/client/components/GameBoard.jsx:235`
- Problem: multiple timeouts are created without centralized cleanup bookkeeping.
- **Verified**: At least 4 `setTimeout` calls exist in event handlers (`setError` clear at 3s, `newlyPlacedCards` clear at 500ms, `glowingCards` clear at 3s, plus error clear in `handleCardPick`). None are tracked in refs or cleared on unmount.
- Done when:

1. Timeouts are tracked and cleared on unmount.

### [x] `Optimization` 4.4 Add baseline profiling checkpoints

- Files: `src/client/components/GameBoard.jsx`, `src/client/components/DraftPhase.jsx`
- **Verified**: No profiling instrumentation exists currently.
- Done when:

1. Before/after metrics exist for card pick latency and render count in dev profiling.

---

## Sprint 5: Easy Wins and Developer Experience

### [x] `Easy Win` 5.1 Replace direct `console.log` calls with logger wrapper

- Files: `src/App.jsx:39`, `src/App.jsx:49`, `src/client/services/audio.js:44`
- **Verified**: App.jsx has ~8 `console.log` calls. audio.js has 2 `console.log` calls in `.catch()` handlers. A `logger` module exists at `src/shared/utils/logger.js` and is already used in GameBoard.jsx and socket-client.js.
- Done when:

1. Non-error logs flow through `logger` consistently.

### [x] `Easy Win` 5.2 Remove hardcoded local network output

- Files: `src/server/main.js:429`
- Problem: hardcoded IP is environment-specific noise.
- **Verified**: `logger.log('   - Network: http://192.168.0.105:${PORT}')` is hardcoded at server startup.
- Done when:

1. Startup logs only use runtime-resolved host/port.

### [x] `Easy Win` 5.3 Add static checks and quick test command

- Files: `package.json`
- **Verified**: `scripts` block has `dev`, `server`, `client`, `build`, `preview` — no `lint`, `test`, or `typecheck` commands. No eslint config or test framework in dependencies.
- Done when:

1. Scripts include at least `lint` and a minimal test or smoke-check command.
2. CI/local pre-merge command is documented.

### [x] `Easy Win` 5.4 Capture a short regression checklist

- Files: `codex-fullreview.md`
- Done when:

1. Manual checks exist for create room, join room, pick flow, scoring continue, final game, reconnect.

---

## Game Improvement Suggestions

1. Add a real reconnect/rejoin UX with grace period.
   Reason: multiplayer sessions should survive brief network drops without forcing a full restart.

2. Add turn timer with optional “casual mode” (no timer) and “ranked mode” (strict timer).
   Reason: reduces stalling and creates distinct play styles.

3. Add post-round insight panel.
   Reason: show which validated cards, symbol points, and color-zone decisions changed the outcome to make strategy learnable.

4. Add bot opponent tiers (`easy`, `medium`, `hard`) for solo practice.
   Reason: improves retention and shortens queue dependency.

5. Add rematch flow in same room.
   Reason: keeps players engaged by removing menu friction after game end.

6. Add lightweight match history (last 10 games).
   Reason: gives players progress visibility and supports balance tuning.

7. Add in-game rule hints for edge cases (duplicate number, already validated).
   Reason: reduces confusion in first sessions and lowers invalid pick attempts.

8. Add accessibility pass for keyboard navigation and reduced-motion defaults.
   Reason: improves usability and broadens the player base.

---

## Review Execution Notes

1. Run sprints in order.
2. Merge only after each sprint passes its done criteria.
3. Keep sprint PRs small to reduce regression risk.

## Regression Checklist

1. Create room as host; verify waiting room appears and room code can be copied.
2. Join room from a second client; verify game starts and both players receive initial game state.
3. Complete at least one full draft turn; verify valid/invalid card pick behavior and placement choices.
4. Finish a round; verify scoring modal appears once, both players can acknowledge, and game advances only after both click continue.
5. Finish round 3; verify `vetrolisci-game-complete` flow, final screen, and win/lose audio selection.
6. Disconnect one player mid-game; verify remaining player sees disconnect status and room becomes recoverable.
7. Reconnect client repeatedly; verify no duplicate socket behavior and game events remain single-delivery.

## Pre-merge Command

1. `npm run premerge`
