# UX Polish Tasks - Vetrolisci

A prioritized list of UX improvements focused on **reducing verbosity** and making the interface **more visual, less descriptive**.

---

## 🎯 Core Principle

> **Show, don't tell.** Replace text explanations with visual cues, icons, and intuitive design patterns.

---

## 🏃 Sprint 1: Menu Screen Declutter ✅ COMPLETE

**Goal**: Transform the main menu from text-heavy to icon-driven
**Effort**: ~3-4 hours
**Impact**: High - first impression screen

### Current Problems

The menu has **4 separate text elements** that explain what buttons do:

```
"Host spins up a private room and shares a 6-character code." (menu-helper)
"Create a private room and get a shareable code." (button hint)
"Jump into a room with a 6-character code." (button hint)
```

Users don't read these. The buttons already say what they do.

### Tasks

#### 1.1 Remove Redundant Helper Text

**File**: `src/App.jsx`

- [x] Delete `menu-helper` paragraph entirely
- [x] Delete both `menu-button-hint` paragraphs
- [x] Keep only the tagline: "Draft fast, place smart, outscore your rival."

**Before (3 text blocks + tagline)**:

```jsx
<p className="menu-helper">Host spins up a private room...</p>
<Button>Host a Game</Button>
<p className="menu-button-hint">Create a private room...</p>
<Button>Join Game</Button>
<p className="menu-button-hint">Jump into a room...</p>
```

**After (clean, icon-driven)**:

```jsx
<Button icon="➕">Host Game</Button>
<Button icon="🔗">Join Game</Button>
```

#### 1.2 Add Icons to Menu Buttons

**Files**: `src/App.jsx`, `src/shared/components/Button.jsx`

- [x] Add `icon` prop to Button component
- [x] Use icons: ➕ for Host, 🔗 for Join
- [x] Icons speak louder than text explanations

#### 1.3 Simplify Button Labels

- [x] "Host a Game" → "Host Game" (shorter)
- [x] "Join Game" stays (already concise)

### Sprint 1 Definition of Done

- [x] Menu has 0 helper/hint paragraphs
- [x] Buttons have icons
- [x] Screen feels spacious, not crowded

---

## 🏃 Sprint 2: Join Screen Streamline ✅ COMPLETE

**Goal**: Remove unnecessary form guidance
**Effort**: ~2-3 hours
**Impact**: High - reduces friction for joining

### Current Problems

Join screen has **3 helper texts** for a simple 6-character input:

```
"Enter your room code to join friends" (subtitle)
"6 characters, letters or numbers. We'll auto-capitalize for you." (field helper)
"Reconnect to enable joining." / "Enter all 6 characters..." (status helper)
```

### Tasks

#### 2.1 Remove Form Helper Texts

**File**: `src/App.jsx`

- [x] Delete `field-helper` with auto-capitalize explanation
- [x] Delete dynamic `field-helper subtle` status text
- [x] Keep only the title "Join Game" (no subtitle needed)

**After**:

```jsx
<h2>Join Game</h2>
<input placeholder="Room Code" maxLength={6} />
<Button disabled={!ready}>Join</Button>
```

#### 2.2 Visual Input Validation

**File**: `src/App.css`

- [x] Add character counter pill: `4/6`
- [x] Green glow when input is valid (6 chars)
- [x] Disabled button is self-explanatory

#### 2.3 Compact Back Button

- [x] "← Back" kept with smaller size
- [x] Join button now has icon (🔗) for consistency

### Sprint 2 Definition of Done

- [x] Join screen has 0 helper paragraphs
- [x] Input validation is purely visual
- [x] Single focus: enter code, click join

---

## 🏃 Sprint 3: Waiting Room Simplification ✅ COMPLETE

**Goal**: Cut 60% of text, rely on visual progress
**Effort**: ~3-4 hours
**Impact**: Medium - less reading while waiting

### Current Problems

Waiting room is the **most verbose screen** with:

```
"Room ready" (eyebrow - fine)
"Share your room code and wait for friends to join." (subtitle - redundant)
"Room code" + "Share this with your opponent" (two labels for same thing)
"Clipboard ready to share" (hint under button - unnecessary)
"Send the code to your rival. We start as soon as..." (subtext - verbose)
"We'll start automatically once both players are in the room." (helper - redundant)
```

### Tasks

#### 3.1 Consolidate Room Code Section

**File**: `src/App.jsx`

- [x] Remove "Share this with your opponent" heading
- [x] Remove "Clipboard ready to share" hint
- [x] Remove "Send the code to your rival..." subtext
- [x] Keep just: Code + Copy Button

**After**:

```jsx
<span className="room-code-text">{roomCode}</span>
<Button size="small" icon="📋">Copy</Button>
```

#### 3.2 Simplify Player Status

- [x] Remove "We'll start automatically..." helper text
- [x] Replaced text chips with visual dots (●●)
- [x] Count shown as `1/2` - self explanatory

#### 3.3 Reduce Loading Text

- [x] Removed loading text entirely - spinner only
- [x] Spinner only shows when waiting (playersInRoom < 2)

#### 3.4 Simplify Leave Button

- [x] "Leave room and return to menu" → "Leave"
- [x] Single word, clear intent

### Sprint 3 Definition of Done

- [x] Room code section: code + copy button only
- [x] Player status: visual dots, no text labels
- [x] Loading: spinner only, no text
- [x] ~80% text reduction achieved (exceeded goal!)

---

## 🏃 Sprint 4: Visual Affordances ✅ COMPLETE

**Goal**: Replace text instructions with design patterns
**Effort**: ~4-5 hours
**Impact**: Medium - polish layer

### Tasks

#### 4.1 Input Affordances

**Files**: `src/App.css`

- [x] Room code input: wide letter-spacing (0.5em) for visual separation
- [x] Larger font, thicker border for prominence
- [x] Placeholder styled separately for better UX

#### 4.2 Button States Speak

- [x] Disabled buttons: greyed out (already implemented)
- [x] Loading buttons: spinner replaces text (already implemented)
- [x] Tooltips added for on-demand context

#### 4.3 Connection Status Visual

- [x] Replaced verbose pill with minimal blinking red dot
- [x] Dot is clickable to retry connection
- [x] Shows spinner while reconnecting
- [x] Tooltip explains: "Disconnected - Click to retry"

#### 4.4 Tooltips for Icons

- [x] Added `tooltip` prop to Button component
- [x] "Host Game" → tooltip: "Create a private room"
- [x] "Join Game" → tooltip: "Join with a room code"
- [x] Text moved from visible to on-demand

### Sprint 4 Definition of Done

- [x] Input feels intuitive without labels
- [x] Button states are self-documenting
- [x] Connection status is ambient, not intrusive

---

## 🏃 Sprint 5: Error & Feedback Polish ✅ COMPLETE

**Goal**: Errors as toasts, not modals with paragraphs
**Effort**: ~2-3 hours
**Impact**: Medium - reduces modal fatigue

### Tasks

#### 5.1 Error Modal → Toast

**File**: `src/App.jsx`

- [x] Removed Modal import and error modal component
- [x] Removed `showErrorModal` and `error` state variables
- [x] All errors now use `pushToast()` with short messages

#### 5.2 Toast Text Brevity

- [x] "Failed to connect to server. Please check your connection." → "Connection failed"
- [x] "Not connected to server" → "Not connected"
- [x] "Please enter a valid 6-character room code" → "Enter 6 characters"
- [x] "Failed to join room. Please try again." → "Join failed"
- [x] All messages now ≤3 words!

#### 5.3 Inline Validation

- [x] Added `inputError` state for shake animation
- [x] Invalid room code triggers red border + shake
- [x] Added `.room-code-input.error` and `.shake` CSS classes
- [x] `@keyframes shake` animation (0.4s)

### Sprint 5 Definition of Done

- [x] Error modal removed completely
- [x] All errors via toasts (≤3 words achieved!)
- [x] Validation is inline, visual (shake + red border)

---

## 🏃 Sprint 6: GameBoard Polish ✅ COMPLETE

**Goal**: Apply same principles to in-game UI
**Effort**: ~4-5 hours
**Impact**: Medium - gameplay polish

### Tasks

#### 6.1 Audit GameBoard Text

- [x] Review all text in `GameBoard.jsx`
- [x] Identify redundant instructions
- [x] Plan replacements with visual cues

#### 6.2 Grid Headers Simplified

- [x] Removed `grid-eyebrow` component entirely
- [x] Removed `grid-subtext` labels ("Place cards by their number", "See their placements in real time")
- [x] Player grid: "You" + turn badge when active
- [x] Opponent grid: "Opponent" only

#### 6.3 Turn Indicator Compact

- [x] Removed 2-line pill with `pill-copy` (strong + small)
- [x] New: single-line `pill-icon` + `pill-label`
- [x] "Your turn" / "Waiting..." - max 2 words
- [x] Smaller, less intrusive

#### 6.4 Header Controls Icon-Only

- [x] Removed text labels: "SFX", "Music", "Scoreboard", "Leave"
- [x] Now: pure icon buttons with native `title` tooltips
- [x] Trophy emoji for scoreboard, ✕ for leave
- [x] Added `danger` style for leave button

#### 6.5 Round Indicator Tooltip

- [x] Added `title` attribute to round chips for clarity

### Sprint 6 Definition of Done

- [x] GameBoard follows same "show don't tell" principle
- [x] Grid headers: minimal labels, no instructions
- [x] Header controls: icons with tooltips
- [x] Turn pill: compact 2-word max

---

## 📊 Summary

| Sprint | Focus              | Text Reduction      | Effort | Priority | Status      |
| ------ | ------------------ | ------------------- | ------ | -------- | ----------- |
| 1      | Menu Declutter     | -4 paragraphs       | 3-4h   | 🔴 High  | ✅ Complete |
| 2      | Join Streamline    | -3 helpers          | 2-3h   | 🔴 High  | ✅ Complete |
| 3      | Waiting Room       | -80% text           | 3-4h   | 🟡 Med   | ✅ Complete |
| 4      | Visual Affordances | Replace with design | 4-5h   | 🟡 Med   | ✅ Complete |
| 5      | Error/Feedback     | Modal → Toast       | 2-3h   | 🟡 Med   | ✅ Complete |
| 6      | GameBoard          | Audit & polish      | 4-5h   | 🟢 Low   | ✅ Complete |

**All 6 Sprints Complete!** 🎉🎊

---

## 📐 Design Principles Applied

### Before (Text-Heavy)

```
┌─────────────────────────────────┐
│ Host spins up a private room   │
│ and shares a 6-character code. │
├─────────────────────────────────┤
│ [   Host a Game   ]            │
│ Create a private room and get  │
│ a shareable code.              │
├─────────────────────────────────┤
│ [   Join Game   ]              │
│ Jump into a room with a        │
│ 6-character code.              │
└─────────────────────────────────┘
```

### After (Visual-First)

```
┌─────────────────────────────────┐
│        🎴 Vetrolisci            │
│ Draft fast, place smart.       │
│                                 │
│    [ ➕ Host Game ]             │
│                                 │
│    [ 🔗 Join Game ]             │
└─────────────────────────────────┘
```

---

## 📝 Notes

- Test with fresh users: can they navigate without reading?
- Icons should be universally understood (no obscure symbols)
- Tooltips/hover states for accessibility
- Keep one-liner tagline for brand personality
- Mobile: icons work better than text in small spaces
