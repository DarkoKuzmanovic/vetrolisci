# Frontend Guide v2 - Vetrolisci

This document maps out the screens, components, and UI elements in the Vetrolisci client, reflecting the current state after the **UI Polish (Feb 2026)** update which introduced a comprehensive token-based design system, full dark mode support, and refined motion.

## 🎯 Navigation Flow

```
Browser Load → Main Menu → Waiting Room → Game Play
                    ↓            ↑           ↑
                Join Game   ← Back/Leave ← Host Game
```

---

## 🎨 Design System

The application uses a token-driven CSS architecture located in `src/shared/styles/theme.css`.

### Tokens & Theming

- **Colors**: Semantic tokens (e.g., `--color-primary`, `--app-surface-bg`) handle Light/Dark mode switching automatically via `body` class or system preference.
- **Typography**: Unified scale using `--font-size-*` and `--line-height-*`.
  - Headers: Tight letter-spacing, bold weights.
  - Body: Normal line-height, optimized for readability.
- **Glassmorphism**:
  - Light Mode: White-tinted overlays with blurring.
  - Dark Mode: Dark-tinted overlays (`--glass-bg-*`) ensuring proper contrast without washing out.
- **Motion**:
  - `prefers-reduced-motion` is globally respected (disables animations).
  - Standardized micro-interactions (1px lifts, subtle scaling).

---

## 📱 Screens & Views

### 1. **Main Menu** (`currentView === "menu"`)
**State**: ✅ **Polished**
- **Design**: Centered glassmorphism card on token-driven animated background.
- **Features**: Dark mode ready inputs and surfaces. Connection status indicator.

### 2. **Join Game Screen** (`currentView === "join"`)
**State**: ✅ **Polished**
- **Design**: Consistent glass panel styling.
- **Inputs**: Enhanced contrast inputs with explicit caret colors and focus rings.

### 3. **Waiting Room** (`currentView === "waiting"`)
**State**: ✅ **Polished**
- **Design**: Unified layout with Main Menu.
- **Elements**: Large room code display, copy-to-clipboard (toast feedback), player slot indicators.

### 4. **Game Screen** (`currentView === "game"`)
**State**: ✅ **Polished**
- **Layout**: optimized flex/grid layout for responsive game board.
- **Status Bar**: Top navigation showing Room Code, Round/Turn info.

---

## 🎴 Game Components Status

### **1. Card Component**
**Location**: `src/client/components/Card.jsx`
**State**: ✅ **Gold Standard**
- **Features**:
  - Optimized image loading (`object-fit: contain`).
  - Consistent hover animations (scale 1.01).
  - Validation styling integrated with CSS variables.
  - Full Dark Mode support for empty/back states.

### **2. Draft Phase**
**Location**: `src/client/components/DraftPhase.jsx`
**State**: ✅ **Complete**
- **Features**: 3D card hover effects, token-based "restricted" overlays, responsive layout.

### **3. Modals (System-wide)**
**Location**: `src/shared/components/Modal.jsx` & specific implementations
**State**: ✅ **Unified**
- **Design**: All modals (CardChoice, PlacementChoice, RoundComplete, Scoreboard) use the shared `Modal` wrapper.
- **Theming**: Correct overlay colors (`--overlay-bg`) and token-driven text colors.
- **UX**: Consistent close mechanics and backdrop blurs.

### **4. ScoreBoard**
**Location**: `src/client/components/ScoreBoard.jsx`
**State**: ✅ **Polished**
- **Updates**: Fixed typography hierarchy, removed conflicting text shadows, improved dark mode readability.

### **5. Game Grid**
**Location**: `src/client/components/GameGrid.jsx`
**State**: ✅ **Polished (Feb 2026)**
- **Features**:
  - Modern "Slot" aesthetic using inset shadows and token-driven backgrounds.
  - Enhanced opponent grid distinction (opacity, scale, and saturation reduction).
  - Optimized animations using stagger variants and refined physics.
  - Improved dark mode consistency for empty slots.

---

## 🚀 Future Optimizations (Sprints)

### Sprint 5: Game Grid Modernization (COMPLETE)
✅ **Redesign Grid Slots**: Replaced CSS dashed borders with "Empty Card Slot" components that match the Card aesthetic.
✅ **Opponent Visibility**: Improved distinction between Local Player grid and Opponent grid (opacity/scale/filter).
✅ **Animation Performance**: Optimized placement animations to reduce layout thrashing.
❌ **Drag & Drop**: Deferred in favor of stable click-to-pick flow (research for future).

### Sprint 6: Audio & Immersion
**Goal**: Add sound feedback to make the game feel tactile and responsive.
- [ ] **Sound Engine**: Implement `AudioService` with lazy-loading.
- [ ] **SFX**: Add sounds for:
  - Card Hover/Select (subtle click)
  - Card Place (snap sound)
  - Scoring/Validation (chime)
  - Error/Restriction (low buzz)
- [ ] **Music**: Ambient background track with mute toggle.

### Sprint 7: Mobile Experience & PWA
**Goal**: Make the game playable and installable on mobile devices.
- [ ] **Touch Targets**: Ensure all interactive elements constitute 44px+ tap targets.
- [ ] **Viewport**: Fix "100vh" issues on mobile browsers (address bar shifting).
- [ ] **Landscape Mode**: Optimize layout for landscape play on phones/tablets.
- [ ] **Manifest**: Complete `manifest.json` for "Add to Home Screen" capability.

### Sprint 8: Production Readiness
**Goal**: Prepare codebase for scale and public deployment.
- [ ] **Asset Optimization**: WebP conversion for card assets.
- [ ] **Error Boundaries**: Wrap major components to prevent white-screen crashes.
- [ ] **Reconnect Logic**: Robust handling of socket disconnects/reconnects.
- [ ] **Analytics**: Basic tracking for game completion rates and errors.
