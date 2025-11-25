# Vetrolisci MVP – UI/UX Polish Plan

## Goals
- Make the core flows (host, join, play) feel deliberate, legible, and responsive.
- Keep the card-inspired/glass aesthetic while improving hierarchy and readability.
- Ship fast: prioritize visible wins on the main surfaces before deep refactors.

## Success Criteria
- Clear CTAs and status on every screen (no ambiguity about what to do next).
- Consistent typography, spacing, and color usage via `src/shared/styles/theme.css`.
- Smooth but restrained motion (no jank on low-end devices).
- Mobile-ready layouts for menu/join/waiting and usable controls during play.

## MVP Scope (UI/UX)

### App Shell
- Unify background treatment across all screens; keep blur subtle on mobile (respect mobile overrides in `theme.css`).
- Standardize padding, rounded corners, and card shadows using tokens; remove ad-hoc values.
- Ensure `Button` variants (primary, outline, danger/success) have consistent hover/active states.

### Main Menu (`src/App.jsx`, `src/App.css`)
- Elevate the hero card: tighter vertical rhythm, sharper headline/subhead contrast, supporting microcopy for connection status.
- CTA stack: primary = Host, secondary = Join; add inline “what happens next” helper text.
- Connection state: a compact pill with iconography; add retry affordance if disconnected.

### Join + Waiting (`src/App.jsx`, `src/App.css`)
- Input: clearer label + placeholder, focus ring using `--color-primary-focus`, helper for “room code = 6 chars”.
- Buttons: disabled state with tooltip-style hint when code is short.
- Waiting: emphasize the room code block (copy affordance, subtle pulse), clearer “players in room” state chips, friendlier empty state.

### Game Header (`src/client/components/GameBoard.jsx`, `GameBoard.css`)
- Layout: left = game title + room code chip; center = turn indicator + status pill; right = round progress + control buttons.
- Turn/phase: high-contrast pill with icon; use success/warning colors for your/opponent turn.
- Round chips: consistent spacing, subtle glow on the current round.

### Game Grid (`src/games/vetrolisci/client/components/GameGrid.jsx`, `GameGrid.css`)
- Replace dashed borders with card-like panels; use CSS variables for all colors and borders.
- Clarify ownership: top/bottom labels, muted opponent board, stronger own-board highlight.
- Placement feedback: hover/selected state for available cells, clearer restriction overlay, simpler animations (avoid conflicting 3D transforms).
- Mobile: single-column stack with reduced padding; keep numbers legible.

### Draft Phase (`src/games/vetrolisci/client/components/DraftPhase.jsx`, `DraftPhase.css`)
- Grid of 4 cards with consistent card hover; add clear “pick order” helper and disabled state styling when waiting.
- Error/notice banners: use glass card styling with success/error accents and iconography.

### Cards (`src/games/vetrolisci/client/components/Card.jsx`, `Card.css`)
- Maintain recent overhaul; ensure validated/selected/restricted states share the same shadow/outline system used elsewhere.
- Check alt text and loading states for LazyImage; keep numbers unobscured.

### Modals (`src/shared/components/Modal.jsx`, `Modal.css` and game modals)
- Align header, body, actions spacing; consistent close affordance.
- For choice modals, show concise instructions + per-option subtext (e.g., “Keeps validation” vs “Place face-down”).

### Feedback & Errors
- Global error modal copy: actionable language, retry guidance.
- Non-blocking toasts for clipboard actions and connection regain.
- Loading: keep `LoadingSpinner` sizes consistent; add small inline spinner for socket reconnect.

### Responsiveness & Accessibility
- Minimum touch target 44px for all controls.
- Prefer `rem` sizing; avoid fixed heights where possible.
- Keyboard focus rings visible on all interactive elements; ensure modals trap focus.
- Light audit of color contrast for primary text/buttons on glass backgrounds.

## Visual/Interaction Guardrails
- Use only theme tokens for color, spacing, shadows, radii; no new hard-coded values unless added to `theme.css`.
- Motion: <250ms for simple hover/focus, <400ms for enter/exit; avoid layered 3D transforms on animated grids.
- Keep glass backgrounds at `--glass-bg`/`--glass-bg-medium`; avoid extra blur on mobile.
- Iconography: prefer existing `public/icons` set; add only if reused in 2+ places.

## Quick Wins (suggested first pass)
1) Main menu + join/waiting layout pass (padding, hierarchy, buttons, connection pill).  
2) Game header polish (turn pill, room code chip, round chips).  
3) Game grid restyle (card panels, ownership labels, simplified animations).  
4) Draft phase helper text + card hover normalization.  
5) Toasts for copy/reconnect + consistent disabled/hover states on buttons.

## Out of Scope for MVP
- Audio system, settings menus, deep accessibility audit, or leaderboard/social features.
