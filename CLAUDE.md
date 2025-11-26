# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Vetrolisci - Multiplayer Card Duel

## Project Overview

**Vetrolisci** is a dedicated two-player Pixies card duel. The repo now focuses solely on Vetrolisci with a simplified, in-memory architecture and preserved game logic from the prior implementation.

## Recent Development History

### Major Revamp & Reorganization (Current Implementation)

- **Started fresh** with a clean architecture focused only on Vetrolisci multiplayer
- **Preserved working Vetrolisci logic** while modernizing the socket and UI layers
- **Reorganized structure**: Flat, modular architecture with separated concerns (client, server, shared, core)
- **Simple tech stack**: React + Vite (frontend) + Express + Socket.IO (backend) - no complex frameworks or databases

### Key Issues Resolved

1. **Card Validation Bug**: Fixed auto-validation logic that was incorrectly validating cards just for being in correct position
2. **Draft State Advancement**: Fixed critical bug where server advanced draft state before placement choices were made
3. **Modal System**: Fixed CardChoiceModal (duplicate cards) and PlacementChoiceModal (validated placement) scenarios
4. **Player Indexing**: Fixed multiplayer synchronization issues with proper player index management
5. **React Hooks**: Fixed hooks ordering violations in GameBoard component
6. **Restricted Cards**: Implemented validation overlay system with visual restrictions for validated cards

### Current Status

- ✅ **Core multiplayer Vetrolisci working** with proper card validation rules
- ✅ **Room-based multiplayer** with host/guest system
- ✅ **All placement scenarios** working: empty/face-down, duplicate number, already validated
- ✅ **Modal system** for card choices and placement decisions
- ✅ **Restricted card overlays** showing which cards can't be picked and why
- ✅ **Real-time synchronization** between players
- ✅ **Complete game flow** from room creation to game completion

## Current Architecture (Post-Revamp)

### Project Structure (Reorganized)

```
src/
├── client/                  # Game-specific UI components
│   ├── components/          # GameBoard, Card, modals, etc.
│   └── services/            # audio.js
├── server/                  # Backend services
│   ├── main.js              # Express + Socket.IO server (port 8001)
│   └── vetrolisci-server.js # Game logic server
├── shared/                  # Reusable UI components & utilities
│   ├── components/          # Modal, Button, LoadingSpinner
│   ├── utils/               # socket-client.js
│   └── styles/              # theme.css
├── core/                    # Game logic shared between client/server
│   ├── cards.js             # 70-card deck with image mapping
│   ├── draft.js             # 4-card draft system
│   ├── placement.js         # Card placement scenarios + validation
│   ├── scoring.js           # Complex scoring with color zones
│   └── validation.js        # Card validation rules
├── App.jsx                  # Main app with room system
├── main.jsx                 # React entry point
└── index.html               # HTML entry point
```

### Frontend (React + Vite)

- **Entry Point**: `src/index.html` → `src/main.jsx` → `src/App.jsx`
- **Room System**: Create/join Vetrolisci rooms with room codes, host/guest roles
- **Game Integration**: `GameBoard` component drives gameplay UI once the room is full
- **Real-time Communication**: Socket.IO client wrapper in `src/shared/utils/socket-client.js`

### Backend (Node.js + Express + Socket.IO)

- **Entry Point**: `src/server/main.js` - handles room management and routing
- **Game Server**: Vetrolisci logic in `src/server/vetrolisci-server.js`
- **In-memory State**: Maps for rooms, players, game states
- **Real-time Features**: Socket.IO for live multiplayer with room isolation

### Vetrolisci Game Systems (Current Implementation)

- **Draft Phase**: 4-card alternating draft system with turn-based picking
- **Placement Scenarios**:
  1. **Empty/Face-down**: Auto-place on target position (card.value - 1)
  2. **Duplicate Number**: Show CardChoiceModal to choose which card stays face-up
  3. **Already Validated**: Show PlacementChoiceModal to place face-down on empty space
- **Card Validation**: Cards validate when placed correctly with face-down cards underneath
- **Restriction System**: Visual overlays prevent picking validated card numbers (unless all cards are validated)
- **Scoring Engine**: Complex scoring with validated numbers, symbols, and color zones

### Socket.IO Events (Current Implementation)

#### Room Management

- **Client → Server**: `create-room`, `join-room`, `check-room`
- **Server → Client**: `player-joined`, `game-started`

#### Vetrolisci Game Events

- **Client → Server**: `vetrolisci-pick-card`, `vetrolisci-placement-choice`, `vetrolisci-get-state`
- **Server → Client**: `vetrolisci-card-placed`, `vetrolisci-round-complete`, `vetrolisci-game-complete`

## Development Commands

```bash
# Install dependencies
npm install

# Start both server and client concurrently
npm run dev

# Run only server (backend on port 8001)
npm run server

# Run only client (frontend on port 5173)
npm run client

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run typecheck
```

## Enhanced UI Components

### UI Components (Current Implementation)

#### Shared Components (`src/shared/components/`)

- **Modal**: Reusable modal wrapper with overlay and close handling
- **Button**: Styled button component with variants (primary, outline, disabled)
- **LoadingSpinner**: Loading animation component

#### Game Components (`src/client/components/`)

- **GameBoard**: Main game container with socket integration and state management
- **GameGrid**: 3x3 card grid with placement logic and animations
- **Card**: Individual card component with image loading and validation states
- **CardChoiceModal**: Modal for choosing between duplicate cards (keep existing vs use new)
- **PlacementChoiceModal**: Modal for choosing grid position for face-down placement
- **RoundCompleteModal**: Round end summary with scores and continue option
- **ScoreBoard**: Score tracking and breakdown display

#### Key Features

- **Restricted Card Overlays**: Visual indicators for cards that can't be picked
- **Real-time Animations**: Card placement, validation, and turn transitions
- **Error Handling**: User-friendly error messages and recovery
- **Responsive Design**: Works across different screen sizes

## Critical Implementation Details

### Card Validation Rules (FIXED)

- **Cards do NOT auto-validate** just for being in correct position
- **Cards validate ONLY when**:
  1. Placed face-up on top of a face-down card, OR
  2. Result of a duplicate card choice (both cards become validated)
- **Validation checking**: `hasValidatedCardWithNumber()` and `canPickCard()` in `placement.js`

### Placement Scenarios (WORKING)

1. **Empty/Face-down**: Place on target position (card.value - 1), validates if face-down card underneath
2. **Duplicate Number**: CardChoiceModal appears, player chooses which card stays face-up, both become validated
3. **Already Validated**: PlacementChoiceModal appears, card placed face-down on chosen empty space

### Restriction System (IMPLEMENTED)

- **Visual overlays** with restricted.png icon for cards that can't be picked
- **Rule**: Can't pick card if you already have validated card with that number
- **Exception**: If ALL revealed cards would violate rule, can pick any card (goes face-down)
- **Error messages** explain why cards are restricted

## Known Working State & Next Steps

### What's Currently Working ✅

- **Room creation/joining** with room codes and host/guest system
- **Complete multiplayer Vetrolisci game** with proper turn management
- **All placement scenarios** including modals for duplicate/validated cards
- **Card validation system** with proper rules (no auto-validation)
- **Restricted card overlays** showing which cards can't be picked
- **Real-time synchronization** between players via Socket.IO
- **Error handling** with user-friendly messages
- **Responsive UI** that works on different screen sizes

### Potential Next Steps

- Audio system integration (music, sound effects)
- Keyboard shortcuts and accessibility features
- Visual polish and animations
- Deployment configuration for production

## Current Project Structure (Post-Reorganization)

```
src/
├── index.html                    # Entry point
├── main.jsx                      # React entry
├── App.jsx                       # Main app with room system
├── client/                       # Game-specific UI components
│   ├── components/              # GameBoard, Card, modals, etc.
│   └── services/                # audio.js
├── server/                       # Backend services
│   ├── main.js                  # Express + Socket.IO server
│   └── vetrolisci-server.js     # Game logic server
├── shared/                       # Reusable UI components & utilities
│   ├── components/              # Modal, Button, LoadingSpinner
│   ├── utils/                   # socket-client.js
│   └── styles/                  # theme.css
└── core/                         # Game logic shared between client/server
    ├── cards.js                 # 70-card deck + images
    ├── draft.js                 # 4-card draft system
    ├── placement.js             # Placement scenarios + validation
    ├── scoring.js               # Complex scoring system
    └── validation.js            # Card validation rules

public/
├── cards/                       # Card images (fronts/ and backs/)
├── icons/                       # UI icons including restricted.png
├── audio/                       # Game audio files
├── background.jpg               # Game background
└── background3.jpg              # Alternate background
```

## Important Notes for Future Development

### Development Commands (Current)

```bash
npm install          # Install dependencies
npm run dev         # Start server (8001) + client (5173) concurrently
npm run server      # Server only
npm run client      # Client only (Vite dev server)
```

### Game Assets (Current Location)

- **Card Images**: `public/cards/fronts/` and `public/cards/backs/`
- **Icons**: `public/icons/` (including `restricted.png` for card overlays)
- **Naming**: `{color}-{value}.png`, `{color}-{value}-alt.png`, `{color}-{value}-special.png`

### Key Files to Reference

- **Main server**: `src/server/main.js` (Express + Socket.IO + room management)
- **Vetrolisci server**: `src/server/vetrolisci-server.js` (game logic)
- **Main client**: `src/App.jsx` (room creation/joining interface)
- **Game client**: `src/client/components/GameBoard.jsx` (main game UI)
- **Game logic**: `src/core/placement.js` (placement scenarios + validation)
- **Shared components**: `src/shared/components/` (Modal, Button, LoadingSpinner)
- **Socket client**: `src/shared/utils/socket-client.js` (Socket.IO wrapper)

### Critical Bug Fixes Applied

1. **Fixed auto-validation bug** in `validation.js` - cards only validate with face-down cards underneath
2. **Fixed draft state advancement** in `vetrolisci-server.js` - waits for placement choices
3. **Fixed React hooks ordering** in `GameBoard.jsx` - all hooks at component top
4. **Added restriction system** with visual overlays and validation logic
5. **Fixed modal data structures** for CardChoiceModal and PlacementChoiceModal

### Testing & Debugging

- **Server logs**: Watch for `🎯` prefixed debug messages showing placement scenarios
- **Browser console**: Client-side errors and socket connection status
- **Room codes**: 4-character alphanumeric codes for joining games
- **Player indexing**: Host = player 0, Guest = player 1
