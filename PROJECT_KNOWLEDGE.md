# PROJECT_KNOWLEDGE.md — Technical Reference for pacman-jev

> **This file is git-tracked** — it serves as the technical ground truth for AI agents and developers working on this project.
>
> Last updated: 2026-10-01

---

## Stack & Ports

| Layer | Technology | Details / Port |
|---|---|---|
| **Framework** | Next.js 16.3.6 (App Router) | React Server Components & Route Handlers |
| **Runtime & UI** | React 19.2.8, React DOM 19.2.8 | Client components with Hooks and Context |
| **Language** | TypeScript 5 | Strict typing, zero `any` policy |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/postcss`) | CSS Variables, utility classes, monochromatic theme |
| **Icons** | Lucide React 1.47.0 | Clean stroke icons |
| **Rendering** | HTML5 Canvas 2D | Retina / HiDPI device-pixel-ratio scaling |
| **AI Integration** | `@typesafe-ai/sdk` (v0.6.0) | TypeSafe AI JEV System One cognitive API |
| **Local Port** | `3005` | Configured via `package.json` scripts |

**Run commands:**
```bash
npm run dev          # Starts Next.js development server on http://localhost:3005
npx tsc --noEmit     # Validates TypeScript types across all files
npm run build        # Compiles Next.js production bundle
npm run start        # Starts production server on port 3005
```

---

## Repository Architecture & Directory Layout

```
pacman/
├── app/
│   ├── api/
│   │   └── jev/
│   │       └── route.ts            → Next.js Route Handler (POST) proxying to TypeSafe AI
│   ├── globals.css                 → Tailwind v4 setup, color tokens, dot-grid, scrollbars
│   ├── layout.tsx                  → Root layout, HTML wrapper, metadata, font smoothing
│   └── page.tsx                    → Main game container, single-viewport layout, state wiring
├── components/
│   ├── ApiKeyModal.tsx             → Modal for entering & testing TypeSafe API keys
│   ├── GameCanvas.tsx              → HTML5 Canvas renderer (walls, pellets, ghosts, AI vision)
│   ├── GameControls.tsx            → Integrated bottom controls shelf with keyboard shortcuts
│   ├── JevTelemetrySidebar.tsx     → Permanent right-side panel: Driver profile, decision meters, raw JSON
│   ├── JevInspector.tsx            → Detailed telemetry card (utility component)
│   └── JevMechanicsDrawer.tsx      → Historical drawer component (superseded by sidebar)
├── engine/
│   ├── ghostAI.ts                  → Classic ghost targeting algorithms & state transitions
│   ├── maze.ts                     → 28x31 maze grid, tile types, passability, junction checks
│   └── perception.ts               → Corridor raycasting, threat analysis, prompt criteria builder
├── hooks/
│   └── usePacmanGame.ts            → Core 60 FPS tick loop, ref state management, input handling
├── lib/
│   ├── localSim.ts                 → Local heuristic simulator fallback (offline mode)
│   ├── lookahead.ts                → Ahead-of-time junction path projection for pre-fetching
│   └── typesafe.ts                 → TypeSafe AI JEV client and structured question definitions
└── types/
    └── game.ts                     → Complete TypeScript definitions (entities, decisions, stats)
```

---

## Game Engine & Loop Lifecycle

### 1. Dual-State Architecture (`stateRef` vs React State)
Because the game engine executes at **60 FPS** via `requestAnimationFrame`, binding physics updates directly to React state triggers excessive re-renders and degrades frame rates.

- **`stateRef` (`useRef`)**: Stores the authoritative, high-frequency game state (`pacman`, `ghosts`, `mapState`, `stats`, `decisionCache`, `inFlightQueries`, `globalGhostMode`). The animation loop updates `stateRef.current` synchronously every frame.
- **React State (`useState`)**: Synchronized with `stateRef.current` at throttled intervals or on critical game events (e.g. eating pellets, score updates, life loss, mode change, new JEV decision).

### 2. Coordinate System & Tile Grid
- The maze is defined in [`engine/maze.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/engine/maze.ts) as a **28 columns × 31 rows** grid (`MAZE_MAP`).
- **Tile Size**: Calibrated to **19px** for a pixel-perfect board size of **532px × 589px**, ensuring the entire UI fits within a single 1080p / laptop viewport without scrolling.
- **Continuous Coordinates**: Entity positions (`pacman.x`, `pacman.y`, `ghost.x`, `ghost.y`) are continuous floating-point tile coordinates.
- **Grid Queries**: Tile lookup uses `Math.round(x)` and `Math.round(y)` via `getTile(gridX, gridY, mapState)`.

### 3. Tile Types & Passability
| Tile Value | Constant / Name | Description | Passable for Pac-Man | Passable for Ghosts |
|---|---|---|---|---|
| `0` | `EMPTY` | Open walkable corridor without pellets | Yes | Yes |
| `1` | `WALL` | Solid maze wall | No | No |
| `2` | `PELLET` | Standard pellet (+10 points) | Yes | Yes |
| `3` | `POWER_PELLET` | Energizer pellet (+50 points, triggers Frightened) | Yes | Yes |
| `4` | `GHOST_HOUSE` | Ghost respawn chamber interior | No | Yes (spawning) |
| `5` | `GATE` | Ghost house barrier gate | No | Yes (exit only) |

### 4. Movement & Turning Logic
- Pac-Man can only execute a 90-degree turn when aligned with the tile grid:
  `Math.abs(frac - 0) < 0.25`
- **Instant Reversal**: Pac-Man can reverse direction (180 degrees) immediately at any point without waiting for grid alignment.
- **Tunnel Passage**: Located at row 14 (`TUNNEL_ROW = 14`). When `x < -0.5`, Pac-Man wraps to `COLS - 0.5`. When `x > COLS - 0.5`, Pac-Man wraps to `-0.5`.

### 5. Scoring & Game Rules
- Normal Pellet: **+10 points**
- Power Pellet: **+50 points**; initiates 400-tick frightened timer on ghosts
- Frightened Ghost consumed: **+200 points** (scales: 200, 400, 800, 1600 per power cycle)
- Clearing all pellets: Resets the maze layout, increments `level`, and retains score.

---

## Ghost AI & Behavioral Modes

Ghost AI logic is located in [`engine/ghostAI.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/engine/ghostAI.ts). Each ghost features classic arcade targeting combined with distinctive monochromatic textures:

| Ghost | Name & Role | Visual Texture | Chase Targeting Behavior | Scatter Corner |
|---|---|---|---|---|
| `blinky` | **Blinky (Shadow)** | Solid black fill | Directly targets Pac-Man's exact current grid tile `[pacX, pacY]` | Top-Right `[26, 0]` |
| `pinky` | **Pinky (Speedy)** | Dotted stippling | Targets 4 tiles ahead of Pac-Man's heading `[pacX + 4*dx, pacY + 4*dy]` | Top-Left `[1, 0]` |
| `inky` | **Inky (Bashful)** | Diagonal striped | Uses a double-vector pivot: 2 tiles ahead of Pac-Man, doubled from Blinky's position | Bottom-Right `[26, 30]` |
| `clyde` | **Clyde (Pokey)** | Cross-hatched | Targets Pac-Man if distance > 8 tiles; retreats to scatter corner if distance ≤ 8 | Bottom-Left `[1, 30]` |

### Ghost State Machine
1. **`SCATTER`**: Ghosts retreat toward their designated home corners. Alternates with `CHASE` via a timed global cycle.
2. **`CHASE`**: Ghosts navigate toward their targeted tile using greedy Euclidean distance minimization at each intersection. Ghosts cannot reverse direction unless switching modes.
3. **`FRIGHTENED`**: Triggered when Pac-Man consumes a Power Pellet. Ghosts turn dark gray, move at reduced speed (0.08 tiles/tick), and make pseudo-random turns at intersections.
4. **`EATEN`**: When consumed, the ghost becomes floating eyes that rapidly return to the Ghost House `[13, 14]` to regenerate and re-enter play.

---

## JEV System One Integration & Decision Pipeline

### Concept: Fast Reflex Decisions (System 1) vs Deep Planning (System 2)
TypeSafe AI's **JEV System One** model is designed for low-latency cognitive reflexes. Rather than calculating complex game-tree minimax searches (System 2), JEV evaluates situational perception vectors at intersections to make instantaneous, survival-oriented directional choices.

```
       [ Pac-Man Moving in Corridor ]
                     │
                     ▼
       [ lookahead.ts: Detect Upcoming Junction ]
                     │
                     ▼
       [ perception.ts: Build JevEvaluationState ]
         - Corridor raycasting (pellets, walls, ghosts)
         - Threat ratings (SAFE, CAUTION, LETHAL)
         - Nearest objectives scan
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
[ Cloud JEV API ]          [ Local Sim Fallback ]
(api.typesafe.ai)          (lib/localSim.ts)
       │                           │
       └─────────────┬─────────────┘
                     ▼
       [ JevSystemOneDecision Received ]
         - Action: Direction (UP/DOWN/LEFT/RIGHT)
         - Probabilities & Confidence
         - Threat Level & Tactical Intent
                     │
                     ▼
       [ Pac-Man Executes Turn at Junction ]
```

### Perception Pipeline ([`engine/perception.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/engine/perception.ts))
At each junction, `buildJevEvaluationState` analyzes all 4 candidate directions:
- **Corridor Raycast**: Scans up to 15 tiles along each corridor for wall collisions, pellets, energizers, and advancing ghosts.
- **Threat Rating**:
  - `LETHAL`: Ghost within 3 tiles closing in, or trapped dead-end with approaching ghost.
  - `CAUTION`: Ghost within 4-7 tiles or approaching junction.
  - `SAFE`: No immediate ghost threat along corridor.
- **Tactical Summary**: Synthesizes a natural language briefing describing current grid position, escape routes, power mode status, and danger warnings.

### JEV Questions Schema ([`lib/typesafe.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/lib/typesafe.ts))
The payload sent to TypeSafe AI's System One endpoint (`https://api.typesafe.ai/v1/systemone`) includes 4 cognitive questions:

1. **`action`** (`choice`): Selects the single best directional move among valid corridors.
2. **`tactical_intent`** (`choice`): Classifies strategic goal (`evade_danger`, `hunt_ghost`, `farm_pellets`, `rush_power_pellet`, `reposition`).
3. **`threat_level`** (`score`, 0–3): Rates danger from `0` (Safe) to `3` (Critical ambush).
4. **`is_cornered`** (`noul`, 0–1): Quantifies probability of being trapped with no escape corridor.

### Lookahead Pre-fetching & Caching
To mask network round-trip latency (~50–200ms):
- **`findNextJunctionAlongPath`** ([`lib/lookahead.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/lib/lookahead.ts)): Scans tiles ahead along Pac-Man's current direction.
- As soon as an upcoming junction is detected, a JEV query is dispatched ahead of time.
- **`decisionCache`**: Caches decisions based on junction coordinates and ghost states.
- **`inFlightQueries`**: Deduplicates redundant queries to prevent duplicate requests.

### Local Heuristic Simulator ([`lib/localSim.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/lib/localSim.ts))
When no `TYPESAFE_API_KEY` is present or if the network is unavailable:
- Computes scores for all valid corridors factoring in distance to ghosts, pellet counts, power pellet urgency, and dead-end penalties.
- Returns an identical `JevSystemOneDecision` object, ensuring seamless offline gameplay with zero code divergence.

---

## Frontend & UI Design System

### Monochromatic Architectural Aesthetic
The UI uses a light, editorial design palette rather than neon arcade colors:

| Token | CSS Variable | Hex Value | Usage |
|---|---|---|---|
| Background | `--bg-page` | `#fafafa` | Page canvas background |
| Surface | `--bg-surface` | `#ffffff` | Cards, modals, header, controls containers |
| Elevated Surface | `--bg-surface-elevated` | `#f4f4f5` | Hover states, secondary buttons, badges |
| Subtle Border | `--border-subtle` | `#e4e4e7` | Card borders, dividers, grid dots |
| Strong Border | `--border-strong` | `#27272a` | Active elements, inner wall stroke bevels |
| Primary Text | `--text-main` | `#09090b` | Headers, active scores, primary buttons |
| Muted Text | `--text-muted` | `#71717a` | Secondary labels, descriptions, ghost gate |
| Maze Wall | (canvas) | `#18181b` | Charcoal maze walls with `#27272a` inner bevel |

### Components Reference

- **[`GameCanvas`](file:///Users/adnanahmad/apps/projects/games/pacman/components/GameCanvas.tsx)**: Renders the 28x31 maze on HTML5 Canvas. Handles HiDPI Retina pixel scaling (`window.devicePixelRatio`), wall beveling, ghost texture stippling, and AI Vision vectors/danger zones.
- **[`GameControls`](file:///Users/adnanahmad/apps/projects/games/pacman/components/GameControls.tsx)**: Integrated bottom controls shelf under the canvas frame supporting `[SPACE]` pause, Play/Pause, Step, Reset, speed multipliers (`1x`, `2x`, `3x`), and AI Vision overlay toggle.
- **[`JevTelemetrySidebar`](file:///Users/adnanahmad/apps/projects/games/pacman/components/JevTelemetrySidebar.tsx)**: Permanent right-side telemetry panel featuring:
  1. **Driver Card**: Dynamic driver profile reflecting active mode — **JEV System One** (`Brain` icon, Cloud JEV) when `TYPESAFE_API_KEY` is present, or **Heuristic Simulator** (`Cpu` icon, Local Sim) when absent. Includes one-click autonomous driving toggle.
  2. **Decision Card**: Target directional move, tactical goal badge, threat rating, latency (ms), and 4 directional probability meters (`↑`, `↓`, `←`, `→`).
  3. **Raw Telemetry Card**: Formatted JSON code snippet with one-click copy button.
- **[`ApiKeyModal`](file:///Users/adnanahmad/apps/projects/games/pacman/components/ApiKeyModal.tsx)**: Dialog allowing users to configure their TypeSafe AI API key with live connection testing against `https://api.typesafe.ai/v1/systemone`.

---

## Environment & Configuration

### Environment Variables
- **`TYPESAFE_API_KEY`**: Optional API key for authenticating with TypeSafe AI's JEV System One service.
  - Can be set in `.env.local` for server-side evaluation via `/api/jev`.
  - Alternatively entered in the UI via the API Key Modal (persisted in `localStorage` under `typesafe_api_key`).
- See [`.env.example`](file:///Users/adnanahmad/apps/projects/games/pacman/.env.example) for reference.

### Next.js Route Proxy ([`app/api/jev/route.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/app/api/jev/route.ts))
- **`GET`**: Exposes server key presence (`hasServerKey`), active driver mode (`cloud_jev` vs `local_sim`), and model name without leaking the secret key to the browser.
- **`POST`**: Accepts requests with `{ state, candidateAnalyses, apiKey, model }`. Prioritizes client-supplied API key, then `x-typesafe-key` header, then server `process.env.TYPESAFE_API_KEY`.
- Returns the full `JevSystemOneDecision` JSON object.

---

## Development & Testing Guide

### Prerequisites
- Node.js 18+ or 20+
- npm (or pnpm/yarn)

### Common Commands
```bash
# Start development server on port 3005
npm run dev

# Run TypeScript type check (zero errors allowed)
npx tsc --noEmit

# Build production bundle
npm run build

# Start production server
npm run start
```

### Testing Changes Manually
1. Open `http://localhost:3005` in your browser.
2. Click **Play** to verify autonomous navigation via JEV Autopilot.
3. Toggle **Speed** to `2x` and `5x` to ensure collision physics and lookahead remain stable at higher tick rates.
4. Toggle **Manual Keys** to verify arrow key controls (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`).
5. Open the **Mechanics** drawer (`⚡ Mechanics`) to verify telemetry updates and JSON copying.
6. Toggle **AI Vision** to ensure visual vectors and danger zones render cleanly on the canvas.
