# Plan: UI Polish (Colors, Typography, Animations)

**Created:** 2026-02-08
**Status:** Ready for Atlas Execution

## Summary

Improve the game’s UI readability and “feel” with a full dark theme polish: fix contrast issues, retune backgrounds/surfaces for dark mode, tighten typography, and add subtle, consistent animations. The work will stay within the existing design system (CSS variables in `theme.css`) and existing animation tooling (Framer Motion variants in `animations.js`). Since there’s no test framework configured, validation will be done via a repeatable manual QA checklist.

## Context & Analysis

**Primary pain points found:**

- Dark-mode contrast can break because `body { color: #1a1a1a; }` is hardcoded in `index.css` and some inputs rely on tokens that don’t exist (e.g. `--color-gray-900`, `--font-size-md`). When tokens are missing, CSS falls back/inherits and can become dark-on-dark.
- Several UI elements use token names that aren’t defined in `theme.css` (e.g. `--color-gray-700`, `--color-gray-900`, `--font-size-md`).
- Animations exist in multiple places (CSS keyframes + Framer Motion) but aren’t consistently applied to phase transitions / key state changes.
- The page background and some container surfaces are hardcoded to light-mode-friendly gradients/alphas (e.g. `index.css` and `.app` in `App.css` use bright white overlays). In dark mode this can look washed out even when contrast is technically “fixed”.

**Relevant Files:**

- `src/shared/styles/theme.css`: Design tokens; needs missing tokens added + optional semantic aliases.
- `src/index.css`: Global typography/background; currently hardcodes text color, causing dark mode issues.
- `src/App.css`: Menu/join/waiting room UI; contains input styles and a few missing token usages.
- `src/shared/styles/animations.js`: Framer Motion variants; use to standardize motion across modals and phase transitions.
- `src/shared/components/Modal.jsx` + `src/shared/components/*.css`: Modal baseline styling + motion.
- `src/client/components/*.(jsx|css)`: Game UI components (Card, DraftPhase, GameBoard, ScoreBoard, modals) where typography + motion polish will be applied.

**Dependencies:**

- `framer-motion`: Already present and used; prefer it for view/phase transitions.

**Patterns & Conventions:**

- CSS variables are the design system source of truth; avoid scattered hardcoded colors.
- Component-local CSS lives next to the component.

## Implementation Phases

### Phase 1: Token & Dark Mode Foundations

**Objective:** Eliminate missing-token fallbacks and fix global text color so dark mode remains readable.

**Files to Modify:**

- `src/shared/styles/theme.css`
- `src/index.css`

**Steps:**

1. Add missing neutral tokens used by the app (at minimum `--color-gray-700`, `--color-gray-900`) and map them consistently for light/dark.
2. Add missing typography token(s) used in CSS (at minimum `--font-size-md`) or replace usages with existing tokens (`--font-size-base`).
3. Replace `body { color: #1a1a1a; }` with `body { color: var(--color-black); }` and `font-family: var(--font-primary); line-height: var(--line-height-normal);`.
4. Ensure dark-mode flips correctly by relying on the existing `--color-black/--color-white` inversion.

**Acceptance Criteria:**

- [ ] No CSS references to undefined tokens (`--color-gray-900`, `--font-size-md`, etc.).
- [ ] In system dark mode, menu and inputs have readable text.

---

### Phase 2: Dark Theme Backgrounds & Surfaces (Full Polish)

**Objective:** Make dark mode look intentional by tuning page background, app surface, and glass panels to dark-appropriate values (not just readable).

**Files to Modify:**

- `src/shared/styles/theme.css`
- `src/index.css`
- `src/App.css`

**Steps:**

1. Introduce a small set of semantic background/surface tokens in `theme.css` (examples):
   - `--page-bg-gradient` (or a few stops)
   - `--page-bg-image-opacity` (or `--page-bg-overlay`)
   - `--app-surface-bg` (used by `.app` instead of hardcoded rgba white)
   - `--panel-surface-bg` (used by menu/join/waiting surfaces as needed)
2. Update `index.css` to use semantic tokens for the `body` background layers so dark mode can swap to darker gradients/overlays while keeping the same structure.
3. Update `.app` background in `App.css` to use `--app-surface-bg` + token-driven radial accents so dark mode doesn’t glow white.
4. Audit glass surfaces (`--glass-bg*`) against the updated background to ensure legibility and separation (shadows/borders may need mild tuning in dark).

**Acceptance Criteria:**

- [ ] In dark mode, the page background does not appear “light theme with inverted text”.
- [ ] App surface and panels have clear separation without harsh borders.

---

### Phase 2: Form/Input Contrast & Focus Polish

**Objective:** Make inputs consistently readable (text, placeholder, caret) across light/dark, and make focus states feel intentional.

**Files to Modify:**

- `src/App.css`
- (Optional) `src/shared/styles/theme.css` (only if a small set of semantic form tokens improves reuse)

**Steps:**

1. Normalize input colors to theme primitives: background uses glass tokens; text uses `var(--color-black)`; placeholders use an existing gray token.
2. Ensure `.player-name-input` and `.room-code-input` explicitly set `color` and `caret-color` to avoid inheritance issues.
3. Make focus rings consistent by using the existing global `:focus-visible` plus component-specific focus shadow only when it improves clarity.
4. Adjust disabled states for dark mode (opacity can become too low on dark surfaces).

**Acceptance Criteria:**

- [ ] No dark-on-dark input text in any screen (menu, join, waiting room).
- [ ] Focus states are visible and consistent across inputs/buttons.

---

### Phase 3: Typography Pass (Hierarchy + Density)

**Objective:** Improve readability and perceived polish via consistent type scale, weights, and spacing.

**Files to Modify:**

- `src/index.css`
- `src/App.css`
- `src/client/components/*.(css)` (targeted)

**Steps:**

1. Establish consistent defaults: base font-size (keep browser default), consistent line-height via tokens.
2. Reduce “shouty” UI where needed: tighten letter-spacing in places using mono + wide tracking (room code remains mono/uppercase).
3. Standardize headings and labels:
   - Titles: `--font-weight-bold`, `--letter-spacing-tight`, `--line-height-tight`.
   - Labels/helpers: `--font-size-sm`, `--color-gray-*` tokens.
4. Audit in-game text (ScoreBoard, turn indicator, modal content) to ensure consistent sizes and contrast.

**Acceptance Criteria:**

- [ ] Menu, join, waiting room, and game header typography feels consistent.
- [ ] Scoreboard text is readable on all surfaces.

---

### Phase 4: Motion System (Subtle, Consistent)

**Objective:** Add a small set of tasteful animations that improve UX clarity without feeling busy.

**Files to Modify:**

- `src/shared/styles/animations.js`
- `src/shared/components/Modal.jsx` (only if needed)
- `src/client/components/GameBoard.jsx` / `DraftPhase.jsx` / key modal components
- Component CSS for hover/transition consistency

**Steps:**

1. Adopt a rule: use CSS transitions for micro-interactions (hover/focus), Framer Motion for layout/phase transitions.
2. Add phase/view transitions with `AnimatePresence` where phases switch (e.g. draft ↔ scoring) using existing variants (`fadeVariants`/`slideVariants`).
3. Ensure reduced-motion users are respected (already supported in `animations.js`); avoid infinite keyframes where unnecessary, or gate them under `prefers-reduced-motion`.
4. Add a couple of high-signal micro-animations:
   - Button press/hover (scale or lift).
   - Card hover lift (if not already consistent across all card-like UI).
   - Modal open/close consistency (use shared variants).

**Acceptance Criteria:**

- [ ] Phase transitions feel smooth and consistent.
- [ ] Motion is subtle and doesn’t distract.
- [ ] Reduced motion preference disables/limits motion.

---

### Phase 5: Surface/Component Polish (Modals, Toasts, Panels)

**Objective:** Make overlays and panels feel cohesive (spacing, radius, shadows, and colors) and avoid mixed styling.

**Files to Modify:**

- `src/shared/components/Modal.css`
- `src/shared/components/Toast.css`
- `src/client/components/*Modal*.css`

**Steps:**

1. Align modal paddings/radii/shadows to tokens (`--modal-border-radius`, `--shadow-*`, glass tokens).
2. Ensure modal titles/body text follow the typography decisions from Phase 3.
3. Confirm toasts have readable contrast in both themes.

**Acceptance Criteria:**

- [ ] Modals and toasts share consistent spacing and typography.
- [ ] No modal content has low-contrast text.

---

### Phase 6: Manual QA Checklist (No Test Framework)

**Objective:** Provide a repeatable checklist to validate UI quality after each phase.

**Checklist:**

- Light mode: menu → create/join → waiting room → game start → draft interactions → scoring modal → next round.
- Dark mode (system or `data-theme="dark"`): repeat all steps.
- Keyboard: tab through inputs/buttons, confirm visible focus.
- Reduced motion: enable OS-level reduced motion (or simulate) and confirm animations are minimal.
- Responsive: narrow viewport (~375px) and typical desktop.

**Acceptance Criteria:**

- [ ] No contrast regressions in either theme.
- [ ] No layout breaks on mobile widths.

## Open Questions

1. Dark theme scope: **Decided — full dark theme polish.**
   - Focus on token-driven backgrounds/surfaces so the look remains cohesive and easy to adjust.

## Risks & Mitigation

- **Risk:** Token additions (e.g. new `--color-gray-900`) could subtly change existing screens.
  - **Mitigation:** Add tokens to match existing intent and do a quick screenshot/visual sweep per phase.
- **Risk:** Motion changes can feel “too much.”
  - **Mitigation:** Keep animations short, use one easing system, and honor reduced-motion.

## Success Criteria

- [ ] Inputs, labels, and body text are always readable (light + dark).
- [ ] Typography feels consistent and intentional across menu + game.
- [ ] Animations are subtle, consistent, and respect reduced motion.
- [ ] Manual QA checklist passes.

## Notes for Atlas

- Prioritize Phase 1–2 first; they fix real bugs (undefined CSS vars + hardcoded body color).
- Keep changes token-driven: update `theme.css` + swap component CSS to use tokens; avoid introducing ad-hoc hex colors in component files.
- Since there’s no test runner configured, keep each phase small and verify via the checklist.
