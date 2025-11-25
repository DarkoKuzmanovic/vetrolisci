# Frontend Guide - Vetrolisci

This document maps out the screens, components, and UI elements in the Vetrolisci client.

## 🎯 Navigation Flow

```
Browser Load → Main Menu → Waiting Room → Game Play
                    ↓            ↑           ↑
                Join Game   ← Back/Leave ← Host Game
```

---

## 📱 Screens & Views

### 1. **Main Menu** (`currentView === "menu"`)

**Location**: `src/App.jsx`
**CSS**: `.menu`, `.menu-title`, `.menu-buttons` in `src/App.css`

**Elements**:

- **Menu Title**: "🎴 Vetrolisci" (h1) with subtitle "Fast-paced two player card duel"
- **Host a Game Button** - Green success variant, instantly creates a room
- **Join Game Button** - Blue primary variant, goes to Join Game screen
- **Connection Status** - Red warning indicator when disconnected

**Current State**: Centered glassmorphism card with vertical button stack

---

### 2. **Join Game Screen** (`currentView === "join"`)

**Location**: `src/App.jsx`
**CSS**: `.join-game`, `.join-game-title`, `.join-form`, `.room-code-input` in `src/App.css`

**Elements**:

- **Page Title**: "Join Game" (h2) with subtitle prompting the room code
- **Room Code Input**: 6-character uppercase input with glassmorphism styling
- **Join Game Button**: Primary variant, disabled until code length is 6
- **Back Button**: Outline variant, returns to Main Menu

**Current State**: Centered glassmorphism container with enhanced input styling

---

### 3. **Waiting Room** (`currentView === "waiting"`)

**Location**: `src/App.jsx`
**CSS**: `.waiting-room`, `.waiting-room-title`, `.room-code-share`, `.room-info` in `src/App.css`

**Elements**:

- **Page Title**: "Room Created!" with subtitle about sharing the code
- **Room Code Display**: Large code with copy-to-clipboard button
- **Game Info**: Single Vetrolisci badge and label
- **Players Section**: Two player slots showing filled/waiting states
- **Loading Spinner**: "Waiting for another player to join..."
- **Leave Room Button**: Outline variant to return to Main Menu

**Current State**: Glassmorphism container matching menu styling

---

### 4. **Game Screen** (`currentView === "game"`)

**Location**: `src/App.jsx`

**Rendering**:

- App header shows room code, turn indicator, and round progress chips
- `VetrolisciGameBoard` handles all in-game UI and state updates

---

## 🎮 Game-Specific Screens

---

# 🎴 **VETROLISCI GAME - COMPREHENSIVE BREAKDOWN**

## **Main Game Container**

**Location**: `src/games/vetrolisci/client/components/GameBoard.jsx`
**CSS**: `src/games/vetrolisci/client/components/GameBoard.css`

### **🏆 Enhanced Game Status Card**

**Purpose**: Top navigation and game state display

- **Game Icon & Title**: 🎴 Vetrolisci with room code display
- **Round Progress**: Current round number (no phase text)
- **Turn Indicator**: "Your Turn" vs "Opponent Turn" with proper tracking
- **Current State**: ✅ Unified glassmorphism styling with fixed turn logic

### **🎯 Game Content Container**

**Purpose**: Main glassmorphism container holding all game elements

- **Background**: Unified glassmorphism with backdrop blur
- **Layout**: Flexbox column with proper spacing
- **Current State**: ✅ Enhanced styling matching other screens

---

## **🎴 CORE GAME COMPONENTS**

### **1. Draft Phase Component (Available Cards Section)**

**File**: `src/games/vetrolisci/client/components/DraftPhase.jsx`
**CSS**: `src/games/vetrolisci/client/components/DraftPhase.css`

- **Purpose**: Shows 4 cards to pick from during draft rounds in card-inspired container
- **Features**:
  - **Card-inspired main container** with hover effects and card styling
  - **Available Cards display** with enhanced 3D card hover transforms
  - **Card restriction overlays** with improved styling and error borders
  - **Draft completion notices** using card-like styling with success accents
  - **Error handling** with card-inspired error banners
- **Current State**: ✅ **RECENTLY ENHANCED** - Complete card-inspired overhaul with 3D effects

### **2. Game Grid Component - COMPREHENSIVE ASSESSMENT**

**File**: `src/games/vetrolisci/client/components/GameGrid.jsx`
**CSS**: `src/games/vetrolisci/client/components/GameGrid.css`

- **Purpose**: 3x3 grid container displaying placed cards for player and opponent
- **Current Architecture**: CSS Grid layout with Framer Motion animations, responsive breakpoints
- **Features**: Card placement animations, state management (new/glowing/confetti), space numbering
- **Current State**: ⚠️ **NEEDS MAJOR UPDATES** - Multiple design and performance issues identified

#### **🔧 Issues Identified:**

1. **Design Inconsistency**: Dashed borders don't match card-inspired theme
2. **Animation Conflicts**: Layout props + complex 3D transforms causing performance issues
3. **Styling Misalignment**: Hard-coded colors, missing CSS variables, no card aesthetic
4. **Visual Hierarchy**: Space numbers and opponent grid need better contrast/distinction
5. **Performance**: Multiple backdrop-filters and layout animations causing inefficiency

#### **💡 Priority Improvements Needed:**

- **Card-Inspired Redesign**: Replace dashed borders with card-like styling
- **Animation Optimization**: Remove layout conflicts, simplify card placement
- **Theme Integration**: Use CSS variables, match overall design system
- **Performance Optimization**: Reduce expensive effects, streamline animations

### **3. Individual Card Component - COMPREHENSIVE ASSESSMENT**

**File**: `src/games/vetrolisci/client/components/Card.jsx`
**CSS**: `src/games/vetrolisci/client/components/Card.css`

- **Purpose**: Core card display component handling front/back/empty/validated states
- **Current Architecture**: React memo component with LazyImage integration, Framer Motion support
- **Features**: Multiple card states, fallback system, validation animations, hover effects
- **Current State**: ✅ **RECENTLY OVERHAULED** - Complete transformation with all critical issues resolved

#### **🎉 OVERHAUL COMPLETED - All Critical Issues Fixed:**

1. **✅ Image Sizing Problem**: Fixed `object-fit: cover` → `contain` for proper image display
2. **✅ Animation Inconsistencies**: Unified all hover effects - removed complex 3D from validated cards
3. **✅ Performance Issues**: Optimized glow animations, added will-change properties
4. **✅ Styling Inconsistencies**: Integrated CSS variables throughout, removed hard-coded values
5. **✅ Visual Hierarchy**: Enhanced validation feedback, improved selected state design
6. **✅ Premium Polish**: Added subtle depth, inner shadows, improved fallback design

#### **🚀 Improvements Delivered:**

- **🎯 FIXED**: Card images now display perfectly without cropping
- **⚡ UNIFIED**: Consistent hover animations across all card states
- **🎨 INTEGRATED**: Full design system integration with CSS variables
- **🚀 OPTIMIZED**: Better performance with streamlined animations
- **✨ PREMIUM**: Enhanced visual depth and polish throughout

### **4. Score Board Component**

**File**: `src/games/vetrolisci/client/components/ScoreBoard.jsx`
**CSS**: `src/games/vetrolisci/client/components/ScoreBoard.css`

- **Purpose**: Live score display during gameplay
- **Features**: Player scores, round tracking
- **Current State**: ❓ Likely needs glassmorphism update

---

## **🎭 MODAL COMPONENTS**

### **5. Card Choice Modal**

**File**: `src/games/vetrolisci/client/components/CardChoiceModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/CardChoiceModal.css`

- **Purpose**: Choose between duplicate cards when placing
- **Features**: Side-by-side card comparison
- **Current State**: ❓ May need glassmorphism modal styling

### **6. Placement Choice Modal**

**File**: `src/games/vetrolisci/client/components/PlacementChoiceModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/PlacementChoiceModal.css`

- **Purpose**: Choose grid position for face-down placement
- **Features**: Grid position selection interface
- **Current State**: ❓ May need glassmorphism modal styling

### **7. Round Complete Modal**

**File**: `src/games/vetrolisci/client/components/RoundCompleteModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/RoundCompleteModal.css`

- **Purpose**: Show round results and scores
- **Features**: Score breakdown, continue button
- **Current State**: ❓ Likely needs glassmorphism update

### **8. Turn Score Modal**

**File**: `src/games/vetrolisci/client/components/TurnScoreModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/TurnScoreModal.css`

- **Purpose**: Show individual turn scoring details
- **Current State**: ❓ May need styling assessment

### **9. Scoreboard Modal**

**File**: `src/games/vetrolisci/client/components/ScoreboardModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/ScoreboardModal.css`

- **Purpose**: Detailed scoreboard view (accessible via control button)
- **Current State**: ❓ Likely needs glassmorphism update

---

## **✨ VISUAL EFFECTS COMPONENTS**

### **10. Validation Star Component**

**File**: `src/games/vetrolisci/client/components/ValidationStar.jsx`
**CSS**: `src/games/vetrolisci/client/components/ValidationStar.css`

- **Purpose**: Visual indicator for validated cards
- **Features**: Star animation on validation
- **Current State**: ❓ May need styling assessment

### **11. Confetti Component**

**File**: `src/games/vetrolisci/client/components/Confetti.jsx`
**CSS**: `src/games/vetrolisci/client/components/Confetti.css`

- **Purpose**: Celebration animation for game events
- **Current State**: ❓ Animation styling assessment needed

### **12. Lazy Image Component**

**File**: `src/games/vetrolisci/client/components/LazyImage.jsx`

- **Purpose**: Optimized image loading for card assets
- **Current State**: ✅ Likely fine as utility component

---

## **🎭 MODAL SYSTEM - CARD-INSPIRED DESIGN**

### **📦 Modal Base Component**

**File**: `src/client/components/Modal.jsx`
**CSS**: `src/client/components/Modal.css`

- **Purpose**: Reusable modal wrapper for all modals
- **Features**: Card-inspired styling with 3D perspective effects, fixed overlay positioning (z-index: 1000)
- **Design**: White card background, subtle shadows, card-like borders and hover effects
- **Current State**: ✅ **RECENTLY ENHANCED** - Card-inspired design matching Vetrolisci aesthetic

### **🎴 Vetrolisci Modal Components**

#### **1. CardChoiceModal**

**File**: `src/games/vetrolisci/client/components/CardChoiceModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/CardChoiceModal.css`

- **Purpose**: Choose between existing/new card when duplicate numbers occur
