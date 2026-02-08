# Plan: Rematch Flow in Same Room

**Created:** 2026-02-08  
**Status:** Ready for Implementation

## Objective

Implement suggestion 5 from `codex-fullreview.md`:

> Add rematch flow in same room.  
> Reason: keeps players engaged by removing menu friction after game end.

Players should be able to start a new match with the same opponent and room code from the game-complete screen, without returning to the menu.

## Current State

- Game completion is driven by server state `phase === "finished"` and emitted to clients via `vetrolisci-game-complete` and `vetrolisci-game-state`.
- `GameBoard` already renders a final screen when `gameState.phase === "finished"`, but only offers `Back to Menu`.
- Room lifecycle currently supports `waiting` and `playing`; rematch intent is not tracked.
- No server event exists for rematch voting/consensus.

Relevant files:

- `src/server/main.js`
- `src/server/vetrolisci-server.js`
- `src/client/components/GameBoard.jsx`
- `src/shared/utils/socket-client.js`

## Approaches Considered

1. Host-only restart
- Flow: host clicks rematch and server immediately starts a new game.
- Pros: simplest implementation.
- Cons: can force the other player into a new game unexpectedly.

2. Two-player confirmation (recommended)
- Flow: each player clicks rematch; server starts when both have confirmed.
- Pros: fair, explicit consent, easy to message in UI.
- Cons: adds minimal rematch progress state.

3. Auto-rematch countdown with cancel
- Flow: automatic countdown starts at game end; either player can cancel.
- Pros: fastest transition when both want to continue.
- Cons: higher complexity, cancellation edge cases, more UX states.

Recommendation: use option 2 now, keep option 3 as a later enhancement.

## Proposed Design

### Server-Side Data and Events

Add per-room rematch tracking:

- `room.rematchVotes: Set<string>` keyed by player `reconnectToken` (not socket id).
- `room.rematchRequestedAt: number | null` (optional, for timeout/analytics).

New Socket.IO events:

- Client -> Server: `vetrolisci-request-rematch`
- Server -> Clients: `vetrolisci-rematch-progress`
- Server -> Clients: `vetrolisci-rematch-started`
- Server -> Clients: `vetrolisci-rematch-error` (only when needed)

Event contract:

1. Player emits `vetrolisci-request-rematch` with `{ roomCode }`.
2. Server validates:
- room exists
- game exists and `phase === "finished"`
- requester belongs to room
- no disconnected player seats
3. Server records vote by reconnect token (idempotent).
4. Server broadcasts progress:
- `accepted`
- `required`
- `acceptedPlayerIndexes` (optional)
5. When `accepted === required`, server:
- clears prior game state
- creates new game with existing room players
- resets rematch tracking
- emits `vetrolisci-rematch-started` with new `gameState`
- emits `vetrolisci-game-state` for canonical state sync

### Client-Side UX

In `GameBoard` final screen:

- Keep `Back to Menu`.
- Add `Rematch` primary button.
- After click, disable button and show waiting text:
  - `Waiting for opponent... (1/2)`
- When server sends progress update, render `accepted/required`.
- On `vetrolisci-rematch-started`, clear rematch UI state and render new draft round.

Client state additions in `GameBoard`:

- `rematchRequested` (boolean)
- `rematchProgress` (`{ accepted, required } | null`)
- `rematchError` (string)

No `App.jsx` route/view change is required because the user remains in `currentView === "game"` and `GameBoard` can transition from finished state once new `gameState` is received.

## Implementation Phases

### Phase 1: Server Rematch API

Files:

- `src/server/main.js`

Tasks:

1. Add room rematch fields when room is created.
2. Add helper(s) to reset rematch state.
3. Implement `vetrolisci-request-rematch` handler with validation and idempotent voting.
4. Broadcast `vetrolisci-rematch-progress`.
5. Start new game when both votes are present and emit `vetrolisci-rematch-started` + `vetrolisci-game-state`.
6. Clear rematch state on disconnect/leave and on new game start.

Acceptance:

- Both players can independently request rematch.
- One vote does not start game.
- Two votes start exactly one new game.

### Phase 2: Client Rematch UI + Event Wiring

Files:

- `src/client/components/GameBoard.jsx`
- `src/client/components/GameBoard.css` (if status styles are needed)

Tasks:

1. Add rematch button and waiting/progress text in finished screen.
2. Emit `vetrolisci-request-rematch`.
3. Subscribe to `vetrolisci-rematch-progress`, `vetrolisci-rematch-started`, and `vetrolisci-rematch-error`.
4. Reset rematch local state when a new game starts.

Acceptance:

- Requesting player sees pending/waiting state.
- Opponent sees progress after first vote.
- Both clients transition back to active game when rematch starts.

### Phase 3: Hardening and Edge Cases

Files:

- `src/server/main.js`
- `src/client/components/GameBoard.jsx`

Tasks:

1. Reject rematch requests if game is not finished.
2. Handle duplicate clicks as no-op on server.
3. If player disconnects during rematch voting, clear vote and broadcast updated progress/error.
4. Handle game creation failure and keep clients on finished screen with actionable error.

Acceptance:

- No stuck room state after failed rematch attempt.
- No duplicate game initialization from repeated requests.

## Testing Plan

Manual checks:

1. Finish a game; click rematch from one player only; verify both see waiting/progress and no restart occurs.
2. Click rematch from second player; verify both enter a fresh round 1 draft in same room.
3. Spam-click rematch button; verify server starts one game only.
4. Disconnect one player after first vote; verify rematch cannot start until reconnect.
5. After rematch starts, verify scoring/game-complete loop still works for the next match.
6. Verify `Back to Menu` still exits cleanly without breaking reconnect token behavior.

Regression checks:

- Re-run existing checklist from `codex-fullreview.md` (create/join/draft/scoring/final/reconnect).

## Risks and Mitigations

- Risk: vote tracking tied to socket id breaks on reconnect.
- Mitigation: key votes by `reconnectToken`.

- Risk: rematch starts while room is partially disconnected.
- Mitigation: require both seats connected before starting.

- Risk: stale votes carry into future matches.
- Mitigation: always clear rematch votes on new game start, leave, timeout, and room reset.

## Done Criteria

1. Rematch can be triggered from the finished screen without returning to menu.
2. Rematch uses explicit two-player confirmation.
3. New match starts in the same room with same players and reconnect semantics.
4. Failure paths are visible to users and do not leave room/game state corrupted.
