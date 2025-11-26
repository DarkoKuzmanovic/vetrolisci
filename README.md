# Vetrolisci 🎴

A real-time multiplayer implementation of the Vetrolisci (Pixies) card game. Two players compete in head-to-head matches, drafting and strategically placing cards on a 3×3 grid to score points across three rounds.

## ✨ Features

- **Real-time Multiplayer**: Head-to-head gameplay with instant synchronization
- **Room System**: Private 4-character invite codes for matchmaking
- **Complete Game Implementation**: Full Vetrolisci rules including drafting, placement, and scoring
- **Modern UI**: Glassmorphism design with smooth animations and responsive layout
- **Accessibility**: WCAG AA compliant with keyboard navigation and screen reader support
- **Dark Mode**: Automatic theme detection with manual override
- **Audio System**: Background music and sound effects
- **No Database Required**: In-memory state for easy hosting and testing

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation & Running

```bash
# Install dependencies
npm install

# Start both client and server concurrently
npm run dev
```

**Access the game:**

- **Client**: <http://localhost:5173>
- **Server**: <http://localhost:8001> (health check: GET `/api/health`)

### Individual Scripts

```bash
npm run server    # Start Express + Socket.IO server only
npm run client    # Start Vite dev server only
npm run build     # Production build (client)
npm run preview   # Preview production build
```

## 🎮 How to Play

### Game Flow

1. **Create Room**: Host creates a private room and shares the 4-character code
2. **Join Game**: Second player enters the same room code
3. **Draft Phase**: Players alternate picking from 4 revealed cards each turn
4. **Placement**: Cards are placed on 3×3 grid following placement rules
5. **Scoring**: Points awarded for validated cards, symbols, and largest color zones
6. **Three Rounds**: Game consists of 3 rounds with cumulative scoring

### Placement Rules

- **Empty Space**: Place face-up on matching number position
- **Face-down Card**: Place face-up on top to validate both cards
- **Duplicate Number**: Choose which card stays face-up, other goes face-down underneath
- **Validated Number**: Place face-down on any empty space

### Scoring

- **Validated Cards**: Face-up cards covering face-down cards score their number value
- **Symbols**: Spirals (+1), Crosses (-1), Special cards grant bonus spirals
- **Color Zones**: Largest group of same-colored cards scores bonus points (2/3/4 per card per round)

## 🏗️ Project Architecture

```
src/
├── App.jsx                     # Main app with room system and navigation
├── App.css                     # Global styles and responsive design
├── main.jsx                    # React entry point
├── index.html                  # HTML entry point
│
├── client/                     # Game-specific UI components
│   ├── components/
│   │   ├── GameBoard.jsx       # Main game container with socket integration
│   │   ├── GameGrid.jsx        # 3×3 grid for card placement
│   │   ├── Card.jsx            # Individual card component with states
│   │   ├── DraftPhase.jsx      # 4-card draft interface
│   │   ├── ScoreBoard.jsx      # Live score tracking display
│   │   ├── CardChoiceModal.jsx # Choose between duplicate cards
│   │   ├── PlacementChoiceModal.jsx # Choose grid position
│   │   ├── RoundCompleteModal.jsx   # Round end summary
│   │   ├── TurnScoreModal.jsx  # Turn scoring details
│   │   ├── ScoreboardModal.jsx # Detailed score view
│   │   ├── ValidationStar.jsx  # Visual validation indicator
│   │   ├── Confetti.jsx        # Celebration animation
│   │   └── LazyImage.jsx       # Optimized image loading
│   └── services/
│       └── audio.js            # Sound effects and music management
│
├── server/                     # Backend services
│   ├── main.js                 # Express + Socket.IO server entry point
│   └── vetrolisci-server.js    # Game logic and state management
│
├── shared/                     # Reusable components and utilities
│   ├── components/
│   │   ├── Modal.jsx           # Reusable modal wrapper
│   │   ├── Button.jsx          # Styled button variants
│   │   ├── LoadingSpinner.jsx  # Loading animation
│   │   └── Toast.jsx           # Notification system
│   ├── utils/
│   │   └── socket-client.js    # Socket.IO wrapper and event handling
│   └── styles/
│       ├── theme.css           # CSS variables and design system
│       └── animations.js       # Framer Motion animation variants
│
└── core/                       # Game logic shared by client/server
    ├── cards.js                # 70-card deck with image mapping
    ├── draft.js                # 4-card draft system
    ├── placement.js            # Card placement scenarios and validation
    ├── scoring.js              # Complex scoring with color zones
    └── validation.js           # Card validation rules

public/
├── cards/                      # Card images (70 fronts + backs)
├── icons/                      # UI icons and assets
├── audio/                      # Game sound effects and music
├── background.jpg              # Game background image
└── background3.jpg             # Alternative background image
```

## 🔧 Technical Details

### Tech Stack

- **Frontend**: React 18 + Vite + Framer Motion
- **Backend**: Node.js + Express + Socket.IO
- **State Management**: In-memory with real-time synchronization
- **Styling**: CSS with glassmorphism design system
- **Build Tool**: Vite for fast development and production builds

### Real-time Communication

#### Room Management Events

- `create-room` - Create new game room
- `join-room` - Join existing room
- `check-room` - Verify room existence
- `player-joined` - Player successfully joined
- `game-started` - Both players ready, game begins

#### Game Events

- `vetrolisci-pick-card` - Player selects card during draft
- `vetrolisci-placement-choice` - Player makes placement decision
- `vetrolisci-card-placed` - Card successfully placed
- `vetrolisci-round-complete` - Round ends, scores calculated
- `vetrolisci-game-complete` - Game ends, final scores

### Key Features Implemented

✅ **Complete Game Logic**: All Vetrolisci rules including drafting, placement scenarios, and scoring
✅ **Real-time Multiplayer**: Instant synchronization between players
✅ **Responsive Design**: Works on desktop and mobile devices
✅ **Accessibility**: Keyboard navigation, screen reader support, reduced motion
✅ **Dark Mode**: Automatic system preference with manual toggle
✅ **Audio System**: Background music and contextual sound effects
✅ **Visual Polish**: Glassmorphism design with smooth animations
✅ **Error Handling**: User-friendly error messages and recovery
✅ **Performance**: Optimized animations and lazy image loading

## 📚 Documentation

- **[Game Rules](vetrolisci-ruleset.md)** - Complete Vetrolisci rules and scoring details
- **[Frontend Guide](frontend-guide.md)** - Detailed component documentation and UI architecture
- **[UI Polish](ui-polish.md)** - Design system and component status
- **[Development Notes](CLAUDE.md)** - Technical implementation details and history

## 🎯 Development

### Testing Multiplayer

Open two browser windows to simulate both players:

1. First window: Create room and copy the code
2. Second window: Join with the same room code
3. Both windows will sync in real-time

### Key Files for Development

- **Game Logic**: [`src/core/placement.js`](src/core/placement.js) - Card placement scenarios
- **Server**: [`src/server/vetrolisci-server.js`](src/server/vetrolisci-server.js) - Game state management
- **Client**: [`src/client/components/GameBoard.jsx`](src/client/components/GameBoard.jsx) - Main game UI
- **Shared Components**: [`src/shared/components/`](src/shared/components/) - Reusable UI components

### Deployment

The project is configured for easy deployment:

- Client builds to static files with `npm run build`
- Server runs on Node.js with in-memory state
- No database dependencies for simplified hosting

## 🐛 Known Issues & Future Enhancements

### Current Status

- ✅ All core gameplay features implemented and tested
- ✅ Real-time multiplayer synchronization working
- ✅ Complete UI/UX with accessibility features
- ✅ Audio system with background music and effects
- ✅ Dark mode and responsive design

### Potential Enhancements

- Game replay system
- Spectator mode
- Player statistics and history
- Additional game variants
- Enhanced animations and visual effects

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Darko Kuzmanovic

---

## 📦 Version

**Current Version**: 2.0.1

### Recent Updates (v2.0.1)

- Updated project metadata and documentation
- Minor version bump for maintenance

---

Vetrolisci is based on the Pixies card game mechanics, adapted for online multiplayer gameplay.
