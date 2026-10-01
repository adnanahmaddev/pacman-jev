# pacman-jev

> **Autonomous Pac-Man simulation driven by TypeSafe AI's JEV System One cognitive reflex engine.**

A high-performance, autonomous Pac-Man simulation built with Next.js 16 (App Router), React 19, TypeScript, and HTML5 Canvas 2D. Driven by TypeSafe AI's **JEV System One** decision pipeline, Pac-Man analyzes maze geometry, corridor pellets, and approaching ghost vectors in real time to make instantaneous, survival-oriented directional reflexes at intersections.

Featuring a monochromatic architectural aesthetic, ahead-of-time junction pre-fetching, real-time telemetry sidebar, and an offline heuristic fallback simulator.

---

## Highlights & Features

- **JEV System One Cognitive Reflexes**: Evaluates candidate corridors, raycasts corridor pellets, detects approaching ghost vectors, assesses danger levels, and classifies tactical intent (`evade_danger`, `hunt_ghost`, `farm_pellets`, `rush_power_pellet`, `reposition`).
- **Hybrid Cloud / Offline Architecture**: Real-time cloud decisions via TypeSafe AI System One API (`api.typesafe.ai`) with a calibrated local heuristic simulator fallback for offline play.
- **Lookahead Corridor Pre-fetching**: Anticipates upcoming junctions along Pac-Man's trajectory and pre-fetches decisions asynchronously, masking network round-trip latency (~50–200ms) with zero stutter at 60 FPS.
- **Monochromatic Architectural Aesthetic**: Clean off-white canvas (`#fafafa`), deep charcoal walls (`#18181b`), minimal stroke bevels, and distinct pattern-textured ghost sprites.
- **Real-Time Telemetry Sidebar**: Live driver profile indicator (Cloud JEV vs Local Sim), target directional meters, confidence score, threat ratings, latency tracking, and formatted JSON telemetry with 1-click clipboard copying.
- **Authentic Arcade Mechanics**: 28×31 grid, continuous floating-point tile coordinates, instant 180° reversals, wrap-around tunnels (Row 14), frightened ghost scaling (200, 400, 800, 1600 pts), and respawn eye navigation.
- **Interactive Control Deck**: Play/Pause (`Space`), step-by-step debugging (`Step`), speed multipliers (`1x`, `2x`, `3x`), AI vision vector overlays, manual keyboard overrides (`WASD` / Arrow keys), and clickable directional controls.
- **In-App API Key Manager**: Secure client-side key storage (`localStorage`) with live connection validation against TypeSafe AI.

---

## Architecture & Decision Flow

```
                     [ 60 FPS Game Engine Loop ]
                   (requestAnimationFrame / stateRef)
                                 │
                                 ▼
                     [ Junction Lookahead Scan ]
                      (lib/lookahead.ts)
                                 │
                                 ▼
                    [ Corridor Perception Analysis ]
                      (engine/perception.ts)
          - Raycasting 4 candidate directions (up to 15 tiles)
          - Threat classification (SAFE, CAUTION, LETHAL)
          - Tactical state briefing synthesis
                                 │
               ┌─────────────────┴─────────────────┐
               ▼                                   ▼
      [ Cloud JEV API ]                 [ Local Sim Fallback ]
  (POST /api/jev → TypeSafe AI)            (lib/localSim.ts)
               │                                   │
               └─────────────────┬─────────────────┘
                                 ▼
                    [ JEV System One Decision ]
          - Action: Best direction (UP, DOWN, LEFT, RIGHT)
          - Intent: Tactical intent classification
          - Threat: Danger score (0-3) & Cornered probability
          - Confidence & Directional probability distribution
                                 │
                                 ▼
            [ Execute Turn & Update Telemetry Sidebar ]
```

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16.3.6 (App Router) | React Server Components & API Route Handlers |
| **Runtime & UI** | React 19.2.8 | Dual-state engine (`stateRef` + throttled React state) |
| **Language** | TypeScript 5 | Strict typing, zero `any` policy |
| **Styling** | Tailwind CSS v4 | `@tailwindcss/postcss`, CSS variables, custom dot grid |
| **Rendering** | HTML5 Canvas 2D | Sub-pixel tile physics, HiDPI Retina scaling (`dpr`) |
| **AI Integration** | `@typesafe-ai/sdk` (v0.6.0) | TypeSafe AI JEV System One cognitive reflex endpoint |
| **Icons** | Lucide React | Modern stroke iconography |
| **Port** | `3005` | Default development and production port |

---

## Directory Structure

```
pacman/
├── app/
│   ├── api/
│   │   └── jev/
│   │       └── route.ts         # Server proxy to TypeSafe AI System One
│   ├── globals.css              # Tailwind v4 setup, color tokens, scrollbars
│   ├── layout.tsx               # Root layout and metadata configuration
│   └── page.tsx                 # Main layout: header, canvas shell, telemetry sidebar
├── components/
│   ├── ApiKeyModal.tsx          # API key configuration dialog with connection test
│   ├── GameCanvas.tsx           # Canvas 2D renderer with Retina scaling & AI vision
│   ├── GameControls.tsx         # Play/pause, step, speed, vision overlay, manual keys
│   ├── JevInspector.tsx         # Detailed telemetry utility card
│   ├── JevMechanicsDrawer.tsx   # Slide-over mechanics drawer
│   └── JevTelemetrySidebar.tsx  # Right-side telemetry panel (driver, meters, JSON)
├── engine/
│   ├── ghostAI.ts               # Classic ghost targeting & Scatter/Chase/Frightened cycles
│   ├── maze.ts                  # 28x31 maze matrix, tile constants, junction detection
│   └── perception.ts            # Corridor raycasting, threat evaluation, prompt builder
├── hooks/
│   └── usePacmanGame.ts         # High-frequency 60 FPS tick loop & state management
├── lib/
│   ├── localSim.ts              # Local heuristic fallback simulator (offline mode)
│   ├── lookahead.ts             # Ahead-of-time junction path projection & caching
│   └── typesafe.ts              # TypeSafe AI client & structured question schema
└── types/
    └── game.ts                  # TypeScript interfaces for entities, decisions, stats
```

---

## Getting Started

### Prerequisites

- **Node.js**: `18.18+` or `20+` (LTS recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repo-url>
   cd pacman
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. *(Optional)* Set up your TypeSafe AI API key:
   ```bash
   cp .env.example .env.local
   ```
   Add your key to `.env.local`:
   ```env
   TYPESAFE_API_KEY=your_typesafe_api_key_here
   ```
   > **Note:** The simulation runs out-of-the-box using the local heuristic simulator if no API key is provided. You can also enter and switch keys directly within the UI at any time.

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3005](http://localhost:3005) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs the Next.js development server on `http://localhost:3005` |
| `npx tsc --noEmit` | Runs the TypeScript compiler to validate types across the project |
| `npm run build` | Compiles an optimized production build |
| `npm run start` | Runs the production build on port `3005` |
| `npm run lint` | Runs Next.js ESLint checks |

---

## Ghost Personalities & Visual Textures

The game implements classic arcade targeting logic styled with distinctive monochromatic fill textures:

| Ghost | Arcade Role | Visual Pattern | Chase Targeting Behavior | Scatter Corner |
|---|---|---|---|---|
| **Blinky** | *Shadow* | Solid Charcoal | Direct pursuit: Targets Pac-Man's exact tile `[x, y]` | Top-Right `[26, 0]` |
| **Pinky** | *Speedy* | Stippled Dots | Ambush: Targets 4 tiles ahead of Pac-Man's heading | Top-Left `[1, 0]` |
| **Inky** | *Bashful* | Diagonal Stripes | Flanking vector: Double-pivot offset from Blinky | Bottom-Right `[26, 30]` |
| **Clyde** | *Pokey* | Cross-Hatch | Distance-dependent: Pursues if >8 tiles away, retreats if closer | Bottom-Left `[1, 30]` |

---

## Controls & Keyboard Shortcuts

| Input | Action | Mode |
|---|---|---|
| <kbd>Space</kbd> | Toggle Play / Pause | All |
| <kbd>W</kbd> / <kbd>↑</kbd> | Turn Up | Manual Mode |
| <kbd>A</kbd> / <kbd>←</kbd> | Turn Left | Manual Mode |
| <kbd>S</kbd> / <kbd>↓</kbd> | Turn Down | Manual Mode |
| <kbd>D</kbd> / <kbd>→</kbd> | Turn Right | Manual Mode |
| **Step Button** | Advance simulation by a single frame | Step Mode / Paused |
| **Speed Multipliers** | Switch between `1x`, `2x`, `3x` tick speeds | All |
| **AI Vision Button** | Toggle canvas overlay for raycast vectors & danger zones | All |
| **Autopilot Toggle** | Switch between Autonomous JEV driving and Manual control | All |

---

## Cognitive Telemetry & Decision Schema

Every decision generated by either Cloud JEV or the local simulator conforms to a strict TypeScript schema defined in [`types/game.ts`](./types/game.ts):

```typescript
interface JevSystemOneDecision {
  action: "UP" | "DOWN" | "LEFT" | "RIGHT";
  tacticalIntent: "evade_danger" | "hunt_ghost" | "farm_pellets" | "rush_power_pellet" | "reposition";
  threatLevel: number;        // 0 (Safe) to 3 (Critical ambush)
  isCornered: number;         // 0.0 to 1.0 probability
  probabilities: {
    UP: number;
    DOWN: number;
    LEFT: number;
    RIGHT: number;
  };
  confidence: number;         // 0.0 to 1.0
  latencyMs: number;          // Round-trip or simulation duration
  source: "cloud_jev" | "local_sim";
  junctionTile: { x: number; y: number };
}
```

The right-side **JEV Telemetry Sidebar** displays this data in real time, featuring directional probability meters, tactical badges, and an interactive JSON telemetry card with one-click clipboard copying.

---

## Design System

The application follows an architectural monochromatic palette designed for extended viewing without eye strain:

- **Page Canvas**: `#fafafa`
- **Surface Cards**: `#ffffff` with subtle borders (`#e4e4e7`)
- **Elevated Surfaces**: `#f4f4f5`
- **Maze Walls**: Deep charcoal `#18181b` with `#27272a` inner bevels
- **Pac-Man**: Pure `#09090b` with animated mouth sweep
- **Typography**: Clean sans-serif headings with high-legibility monospace numerals and coordinates
- **Layout**: Calibrated single-viewport desktop frame (18px tile size = 504px × 558px canvas)

---

## Contributing

1. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Verify TypeScript types:
   ```bash
   npx tsc --noEmit
   ```
3. Commit your changes using Conventional Commits:
   ```bash
   git commit -m "feat: add your descriptive feature summary"
   ```
4. Push to your branch and open a Pull Request.

---

## License

This project is open-source and available under the [MIT License](LICENSE).
