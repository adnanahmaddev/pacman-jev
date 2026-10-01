<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — AI Agent Reference for pacman-jev

This file is the primary entry point for AI agents working in this repository. Read this first, then load the full technical context from [`PROJECT_KNOWLEDGE.md`](./PROJECT_KNOWLEDGE.md).

> **This file is git-tracked** — preserve the Next.js auto-generated block above at all times.

---

## What This Repo Is

**pacman-jev** is an autonomous, high-performance Pac-Man game simulation driven by TypeSafe AI's **JEV System One** decision engine. It features:

- A **Next.js 16 (App Router)** + **React 19** frontend styled with **Tailwind CSS v4**
- An **HTML5 Canvas 2D engine** with HiDPI Retina support and continuous tile physics
- A **JEV System One reflex-decision pipeline** evaluating candidate moves, corridor threats, and tactical intent
- A **hybrid AI architecture**: Real-time cloud decisions via TypeSafe API with an offline heuristic simulator fallback
- A **monochromatic architectural design language**: Clean off-white canvas (`#fafafa`), charcoal walls (`#18181b`), patterned ghost sprites, and AI vision vectors

---

## Read This Before Starting Any Task

📖 See [`PROJECT_KNOWLEDGE.md`](./PROJECT_KNOWLEDGE.md) for:
- Stack, ports (`3005`), and run commands
- Repository folder layout and module responsibilities
- Game engine loop lifecycle, `stateRef` decoupling, and tile physics
- Ghost AI personalities (Blinky, Pinky, Inky, Clyde) and state transitions
- JEV System One decision schema, lookahead corridor pre-fetching, and prompts
- UI design rules, monochromatic palette, and responsive single-viewport sizing
- Environment variables (`TYPESAFE_API_KEY`) and localStorage persistence

---

## Quick Command Reference

| Action | Command | Purpose |
|---|---|---|
| **Start Dev Server** | `npm run dev` | Runs Next.js dev server on `http://localhost:3005` |
| **Type Check** | `npx tsc --noEmit` | Validates TypeScript types across the entire project |
| **Production Build** | `npm run build` | Compiles production Next.js bundle |
| **Production Start** | `npm run start` | Runs compiled production app on port 3005 |

---

## Key Agent Workflows

### 1. Modifying Game Engine & Physics
- Core game state and 60 FPS tick loop live in [`hooks/usePacmanGame.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/hooks/usePacmanGame.ts).
- Tile collisions and grid dimensions (28x31) are defined in [`engine/maze.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/engine/maze.ts).
- **Rule**: Never bind high-frequency physics ticks directly to React `useState`. Always update `stateRef.current` and sync state to React conditionally or throttled.

### 2. Tuning JEV Perception & Prompting
- Corridor raycasting and candidate move metrics are built in [`engine/perception.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/engine/perception.ts).
- Cloud API request formatting and questions live in [`lib/typesafe.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/lib/typesafe.ts).
- The local fallback simulator lives in [`lib/localSim.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/lib/localSim.ts).
- When adjusting JEV questions or prompt criteria, keep questions aligned across cloud schema and `simulateLocalJevDecision`.

### 3. Canvas & UI Enhancements
- Game board rendering is in [`components/GameCanvas.tsx`](file:///Users/adnanahmad/apps/projects/games/pacman/components/GameCanvas.tsx).
- Telemetry widgets live in [`components/JevStatusBar.tsx`](file:///Users/adnanahmad/apps/projects/games/pacman/components/JevStatusBar.tsx) and [`components/JevInspector.tsx`](file:///Users/adnanahmad/apps/projects/games/pacman/components/JevInspector.tsx).
- Slide-over mechanics inspector is in [`components/JevMechanicsDrawer.tsx`](file:///Users/adnanahmad/apps/projects/games/pacman/components/JevMechanicsDrawer.tsx).
- **Rule**: Preserve the monochromatic architectural aesthetic. Avoid adding garish or saturated colors unless explicitly requested by the user.

---

## Critical Rules & Gotchas

1. **Next.js Agent Rules Header**: The `<!-- BEGIN:nextjs-agent-rules -->` block at the top of this file is automatically verified and re-added by `next dev`. Never remove it.
2. **Next.js 16 Conventions**: Use modern Next.js 16 conventions (App Router, async route parameters where applicable, Node docs in `node_modules/next/dist/docs/`).
3. **No `any` Policy**: Maintain strict TypeScript safety. Use interfaces in [`types/game.ts`](file:///Users/adnanahmad/apps/projects/games/pacman/types/game.ts) or declare explicit types.
4. **Coordinate Systems**:
   - `pacman.x` and `ghost.x` are continuous floating-point tile coordinates (e.g. `13.5`).
   - Maze lookup requires integer grid coordinates: `Math.round(x)` or `Math.floor(x)`.
   - Canvas pixel coordinates are `x * tileSize` (calibrated to 19px for single-viewport fit).
5. **Tunnel Wrap-around**:
   - Tunnel passage is located on row 14 (`TUNNEL_ROW = 14`).
   - Out-of-bounds on row 14 wraps around from `x < 0` to `COLS - 1` and `x >= COLS` to `0`.
6. **API Key Handling**:
   - API keys are handled securely via client header / body to `/api/jev` or local storage `typesafe_api_key`.
   - Never commit API keys to version control.

---

## Branch & Commit Conventions

- **Branch format**: `feat/<short-description>`, `fix/<short-description>`, or `refactor/<short-description>`
- **Commit format**: Conventional Commits (`feat: <imperative summary>`, `fix: ...`, `refactor: ...`)
- Run `npx tsc --noEmit` before committing to verify zero type regressions.
