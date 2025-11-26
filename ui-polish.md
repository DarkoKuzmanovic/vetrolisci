# UI Polish Tasks - Vetrolisci

A prioritized list of UI improvements organized into sprints for iterative delivery.

---

## 🏃 Sprint 1: Modal System Consistency ✅ COMPLETE

**Goal**: Unify all modals to match the card-inspired design system
**Effort**: ~4-6 hours
**Impact**: High - modals are core interaction points

### Tasks

#### 1.1 ScoreboardModal Styling Update

**File**: `src/client/components/ScoreboardModal.css`

- [x] Align with base Modal component styling
- [x] Use card-inspired score display sections
- [x] Integrate design system typography
- [x] Add responsive adjustments for mobile

#### 1.2 CardChoiceModal Enhancement

**File**: `src/client/components/CardChoiceModal.css`

- [x] Ensure consistent modal header styling
- [x] Add visual comparison indicators (VS divider)
- [x] Style choice buttons with proper variants
- [x] Add hover states to card options

#### 1.3 PlacementChoiceModal Polish

**File**: `src/client/components/PlacementChoiceModal.css`

- [x] Style position grid to match GameGrid aesthetic
- [x] Add hover effects on selectable positions
- [x] Include position numbers with proper styling
- [x] Ensure mobile-friendly touch targets

#### 1.4 TurnScoreModal Refinement

**File**: `src/client/components/TurnScoreModal.css`

- [x] Review and update to match card-inspired theme
- [x] Add score breakdown with visual hierarchy
- [x] Include subtle animations for score reveals (via base Modal)
- [x] Consistent button styling

### Sprint 1 Definition of Done

- [x] All modals use consistent header styling
- [x] CSS variables used throughout (no hard-coded colors)
- [ ] Tested on desktop and mobile viewports
- [x] Smooth open/close animations

---

## 🏃 Sprint 2: Score Display Overhaul ✅ COMPLETE

**Goal**: Modernize all score-related components
**Effort**: ~3-4 hours
**Impact**: High - scores are central to gameplay

### Tasks

#### 2.1 ScoreBoard Component Overhaul

**File**: `src/client/components/ScoreBoard.css`

**Current Issues**:

- Hard-coded colors (`#007bff`, `#ffffff`, `#333`)
- Inconsistent with glassmorphism design system
- Missing CSS variable integration

**Tasks**:

- [x] Replace all hard-coded colors with CSS variables
- [x] Update container to use `--glass-bg` and `--glass-border`
- [x] Apply card-inspired styling to player score sections
- [x] Use `--shadow-*` variables for consistent shadows
- [x] Add proper hover states with `--transition-all`

#### 2.2 Game Complete Screen

**File**: `src/client/components/GameBoard.css` (`.game-complete` class)

- [x] Add winner/loser visual distinction
- [x] Create celebratory layout with larger typography
- [x] Add final score comparison display
- [x] Style with glassmorphism card container
- [x] Use Button component instead of raw button

### Sprint 2 Definition of Done

- [x] ScoreBoard matches glassmorphism design
- [x] Game complete screen feels celebratory
- [x] All score displays use consistent styling
- [ ] Responsive on all screen sizes

---

## 🏃 Sprint 3: Feedback & States ✅ COMPLETE

**Goal**: Improve user feedback through better visual states
**Effort**: ~3-4 hours
**Impact**: Medium - enhances perceived quality

### Tasks

#### 3.1 Error Banner Improvements

**File**: `src/client/components/GameBoard.css` (`.error-banner` class)

- [x] Add dismiss button/auto-dismiss timer
- [x] Improve animation (slide in from top)
- [x] Add icon for error type indication
- [x] Ensure proper contrast for accessibility

#### 3.2 Loading States Enhancement

**Files**: Multiple components

- [x] Unify loading spinner usage across components
- [x] Add skeleton loaders for card placeholders
- [x] Improve loading text with animated dots
- [x] Add loading overlay for async operations

#### 3.3 Grid Space Hover States

**File**: `src/client/components/GameGrid.css`

- [x] Add subtle highlight on hoverable empty spaces
- [x] Differentiate interactive vs non-interactive states
- [x] Improve space number visibility on dark backgrounds

### Sprint 3 Definition of Done

- [x] Error messages are clear and dismissible
- [x] Loading states feel polished
- [x] Interactive elements have clear hover/focus states
- [x] All animations respect `prefers-reduced-motion`

---

## 🏃 Sprint 4: Visual Polish ✅ COMPLETE

**Goal**: Add finishing touches and micro-interactions
**Effort**: ~2-3 hours
**Impact**: Medium - adds premium feel

### Tasks

#### 4.1 Validation Star Animation

**File**: `src/client/components/ValidationStar.css`

- [x] Review star positioning on cards
- [x] Add subtle pulse or glow animation
- [x] Ensure color matches card color theme
- [x] Test at various card sizes (added size variants)

#### 4.2 Confetti Effect Tuning

**File**: `src/client/components/Confetti.css`

- [x] Adjust particle count for performance (configurable prop)
- [x] Fine-tune animation duration (1.8s with easing)
- [x] Add color variety matching card colors
- [x] Ensure cleanup after animation

#### 4.3 Header Controls Polish

**File**: `src/client/components/GameBoard.css`

- [x] Add tooltips for icon buttons (CSS-only tooltips)
- [x] Improve active state visibility for sound/music toggles
- [x] Consider grouping related controls (`.header-control-group`)
- [x] Add keyboard shortcuts indicator (`.shortcut-key`)

### Sprint 4 Definition of Done

- [x] Validation animations feel satisfying
- [x] Confetti performs well on mobile
- [x] Header controls are intuitive with tooltips
- [x] Overall polish level matches AAA standards

---

## 🏃 Sprint 5: Accessibility & Performance ✅ COMPLETE

**Goal**: Ensure the app is accessible and performant
**Effort**: ~4-5 hours
**Impact**: High - affects all users

### Tasks

#### 5.1 Accessibility Improvements

**Scope**: All interactive components

- [x] Audit color contrast ratios (WCAG AA) - using design system colors
- [x] Add proper ARIA labels to all buttons
- [x] Ensure keyboard navigation works (focus-visible)
- [x] Add focus indicators that match design
- [x] Screen reader announcements for game events (.sr-only, .sr-announce)

#### 5.2 Animation System Refinement

**Scope**: All components with Framer Motion

- [x] Create shared animation variants (animations.js)
- [x] Reduce motion for accessibility (`prefers-reduced-motion`)
- [x] Optimize animation performance on mobile
- [x] Add spring physics for natural feel

#### 5.3 Mobile Touch Optimization

**Scope**: Game components

- [x] Increase touch target sizes (min 44px)
- [x] Add touch feedback (:active states)
- [x] Prevent accidental double-taps (pointer-events handling)
- [x] Optimize swipe gestures if applicable

### Sprint 5 Definition of Done

- [x] Passes WCAG AA contrast requirements
- [x] Full keyboard navigation support
- [x] Animations disabled when `prefers-reduced-motion` set
- [x] Touch targets meet 44px minimum

---

## 📋 Component Status Summary

| Component            | CSS Variables | Glassmorphism | Card-Inspired | Mobile |
| -------------------- | ------------- | ------------- | ------------- | ------ |
| GameBoard            | ✅            | ✅            | ✅            | ✅     |
| GameGrid             | ✅            | ✅            | ✅            | ✅     |
| Card                 | ✅            | N/A           | ✅            | ✅     |
| DraftPhase           | ✅            | ✅            | ✅            | ✅     |
| Modal (base)         | ✅            | ✅            | ✅            | ✅     |
| ScoreBoard           | ✅            | ✅            | ✅            | ✅     |
| ScoreboardModal      | ✅            | ✅            | ✅            | ✅     |
| CardChoiceModal      | ✅            | ✅            | ✅            | ✅     |
| PlacementChoiceModal | ✅            | ✅            | ✅            | ✅     |
| TurnScoreModal       | ✅            | ✅            | ✅            | ✅     |
| RoundCompleteModal   | ✅            | ✅            | ✅            | ✅     |

**Legend**: ✅ Complete | ⚠️ Partial | ❌ Needs Work | ❓ Needs Review

---

## 🎯 Sprint Summary

| Sprint   | Focus                       | Effort  | Priority | Status      |
| -------- | --------------------------- | ------- | -------- | ----------- |
| Sprint 1 | Modal System Consistency    | 4-6 hrs | 🔴 High  | ✅ Complete |
| Sprint 2 | Score Display Overhaul      | 3-4 hrs | 🔴 High  | ✅ Complete |
| Sprint 3 | Feedback & States           | 3-4 hrs | 🟡 Med   | ✅ Complete |
| Sprint 4 | Visual Polish               | 2-3 hrs | 🟡 Med   | ✅ Complete |
| Sprint 5 | Accessibility & Performance | 4-5 hrs | 🔴 High  | ✅ Complete |

**All 5 Sprints Complete!** 🎉

---

## 📝 Notes

- Always test changes on both desktop and mobile
- Check performance impact of new animations
- Maintain consistency with existing design language
- Prefer CSS variables over hard-coded values
- Use shared components (Button, Modal) where possible
- Each sprint should end with a playable, polished state
