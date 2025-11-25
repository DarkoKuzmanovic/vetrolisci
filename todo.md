# Vetrolisci UI/UX Polish – Sprint Backlog

## Sprint 1 – Navigation & Room Flow

- [x] App shell: unify background treatment; standardize padding/radius/shadows via `theme.css` tokens; remove ad-hoc values.
- [x] Buttons: ensure variants share hover/active/disabled states; add retry affordance to connection pill.
- [x] Main menu (`src/App.jsx`, `src/App.css`): tighten hero card spacing; clarify headline/subhead; add helper text for CTAs; compact connection status pill with icon.
- [x] Join screen: labeled room code input with helper (“6 chars”), primary focus ring; disable/tooltip when short; placeholder + inline hint.
- [x] Waiting screen: emphasize room code block (copy affordance + pulse), show players-in-room chips, friendly empty state, back/leave clarity.

## Sprint 2 – Game Frame & Draft

- [x] Game header (`GameBoard.jsx`, `GameBoard.css`): left title + room code chip, center turn/status pill (your/opponent colors), right round chips with glow on current, align control buttons.
- [x] Draft phase (`DraftPhase.jsx`, `.css`): consistent 4-card hover, clear “pick order” helper, disabled/waiting state styling, card-inspired notice/error banners with icons.
- [x] Modals (shared + game): align header/body/actions spacing, consistent close affordance; add concise instructions/subtext for choice modals.
- [x] Feedback: toasts for clipboard actions and connection regain; inline spinner for socket reconnect; actionable copy on error modal.

## Sprint 3 – Game Grid & Accessibility

- [x] Game grid (`GameGrid.jsx`, `.css`): replace dashed borders with card panels using tokens; ownership labels (your board vs opponent muted); hover/selected states for available cells; simplified animations (no conflicting 3D transforms); clearer restriction overlay.
- [x] Mobile: stack grids, reduce padding, keep numbers legible; ensure glass blur stays subtle per mobile overrides.
- [x] Cards (`Card.jsx`, `.css`): align validated/selected/restricted outlines/shadows with grid/system; verify alt text/loading keep numbers unobscured.
- [x] Accessibility: focus rings on all controls, modal focus trap, 44px targets, rem sizing where possible; light contrast audit on glass backgrounds.

## Guardrails (applies to all sprints)

- Use only `theme.css` tokens for color/spacing/shadows/radii; add tokens if new values are needed.
- Motion: <250ms hovers, <400ms enter/exit; avoid layered 3D on animated grids.
- Glass: stick to `--glass-bg`/`--glass-bg-medium`; keep extra blur off mobile.
- Icons: reuse `public/icons`; add new only if reused in 2+ places.
