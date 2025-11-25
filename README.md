# Vetrolisci

Head-to-head, in-memory multiplayer version of Vetrolisci (Pixies). Two players join a private room via a six-character code and draft, place, and score cards in real time.

## Features
- Two-player rooms with 6-character invite codes
- Real-time sync over Socket.IO
- React + Vite front-end, Express + Node server
- In-memory state (no database) for quick hosting and testing

## Quick Start
Prerequisite: Node.js 16+

Install dependencies and run both client and server:

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:8001 (health check: GET /api/health)

Individual scripts:

```bash
npm run server   # start Express + Socket.IO
npm run client   # start Vite dev server
npm run build    # production build (client)
npm run preview  # preview production build
```

## Project Structure
```
src/
├── App.jsx, App.css              # App shell and flows (menu/join/wait/game)
├── client/                       # Reusable UI + utilities (Modal, Button, socket-client, theme)
├── server/main.js                # Express + Socket.IO entry
└── games/
    └── vetrolisci/               # Vetrolisci game logic and UI
        ├── client/components/
        ├── server/
        └── core/                 # Game logic shared by client/server
```

## Gameplay Flow
1) Host creates a room and shares the 6-character code
2) Second player joins the same code
3) Game starts automatically; rounds play out in real time
4) Leave room to return to the main menu

Tip: open two browser windows to simulate both players while testing.

## Useful Docs
- Frontend overview: `frontend-guide.md`
- Vetrolisci rules: `vetrolisci-ruleset.md`

## License
MIT — see LICENSE

## Author
Darko Kuzmanovic
