"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Direction,
  GameStats,
  Ghost,
  JevEvaluationState,
  JevSystemOneDecision,
  PacmanEntity,
  Position,
} from "@/types/game";
import {
  COLS,
  countPellets,
  getDirectionOffset,
  getOppositeDirection,
  getValidMoves,
  isJunctionTile,
  isPassableForPacman,
  MAZE_MAP,
  ROWS,
  TUNNEL_ROW,
} from "@/engine/maze";
import {
  createInitialGhosts,
  getNextGhostDirection,
  GHOST_HOUSE_POS,
  updateGhostTargets,
} from "@/engine/ghostAI";
import { buildJevEvaluationState } from "@/engine/perception";
import { findNextJunctionAlongPath } from "@/lib/lookahead";
import { simulateLocalJevDecision } from "@/lib/localSim";

const INITIAL_PACMAN: PacmanEntity = {
  x: 13,
  y: 23,
  direction: "LEFT",
  nextDirection: "LEFT",
  speed: 0.16,
  mouthAngle: 0.2,
  isDying: false,
  lives: 3,
  powerRemaining: 0,
};

export function usePacmanGame(initialApiKey?: string) {
  const [mapState, setMapState] = useState<number[][]>(() =>
    MAZE_MAP.map((row) => [...row])
  );
  const [pacman, setPacman] = useState<PacmanEntity>(INITIAL_PACMAN);
  const [ghosts, setGhosts] = useState<Ghost[]>(createInitialGhosts);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [mode, setMode] = useState<"AUTONOMOUS" | "MANUAL" | "STEP">("AUTONOMOUS");
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [aiVisionOverlay, setAiVisionOverlay] = useState<boolean>(true);
  const [apiKey, setApiKey] = useState<string>(initialApiKey || "");

  const [stats, setStats] = useState<GameStats>(() => ({
    score: 0,
    highScore: 0,
    level: 1,
    pelletsEaten: 0,
    totalPellets: countPellets(MAZE_MAP),
    ghostsEaten: 0,
    jevDecisionsCount: 0,
    avgLatencyMs: 0,
  }));

  const [latestDecision, setLatestDecision] = useState<JevSystemOneDecision | null>(null);
  const [isStepPending, setIsStepPending] = useState<boolean>(false);

  // References for high-frequency game loop without React re-render lag
  const stateRef = useRef({
    pacman: { ...INITIAL_PACMAN },
    ghosts: createInitialGhosts(),
    mapState: MAZE_MAP.map((row) => [...row]),
    stats: {
      score: 0,
      highScore: 0,
      level: 1,
      pelletsEaten: 0,
      totalPellets: countPellets(MAZE_MAP),
      ghostsEaten: 0,
      jevDecisionsCount: 0,
      avgLatencyMs: 0,
    },
    mode: "AUTONOMOUS" as "AUTONOMOUS" | "MANUAL" | "STEP",
    speed: 1,
    isPaused: true,
    globalGhostMode: "SCATTER" as "CHASE" | "SCATTER",
    ghostModeTimer: 0,
    decisionCache: new Map<string, JevSystemOneDecision>(),
    inFlightQueries: new Set<string>(),
    lastJunctionKey: "",
    totalLatencies: [] as number[],
    stepTrigger: false,
  });

  // Sync stateRef with state changes
  useEffect(() => {
    stateRef.current.mode = mode;
  }, [mode]);

  useEffect(() => {
    stateRef.current.speed = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    stateRef.current.isPaused = isPaused;
  }, [isPaused]);

  // Request JEV decision helper
  const fetchJevDecision = useCallback(
    async (
      evalPacman: PacmanEntity,
      evalGhosts: Ghost[],
      evalMap: number[][],
      junctionKey: string
    ) => {
      if (stateRef.current.inFlightQueries.has(junctionKey)) return;
      stateRef.current.inFlightQueries.add(junctionKey);

      const { state, candidateAnalyses } = buildJevEvaluationState(
        evalPacman,
        evalGhosts,
        evalMap
      );

      try {
        const res = await fetch("/api/jev", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-typesafe-key": apiKey } : {}),
          },
          body: JSON.stringify({
            state,
            candidateAnalyses,
            apiKey,
            model: "jev-latest",
          }),
        });

        if (res.ok) {
          const decision: JevSystemOneDecision = await res.json();
          stateRef.current.decisionCache.set(junctionKey, decision);
          setLatestDecision(decision);

          // Update latencies & decision count
          stateRef.current.totalLatencies.push(decision.latency_ms);
          const avg = Math.round(
            stateRef.current.totalLatencies.reduce((a, b) => a + b, 0) /
              stateRef.current.totalLatencies.length
          );

          setStats((prev) => ({
            ...prev,
            jevDecisionsCount: prev.jevDecisionsCount + 1,
            avgLatencyMs: avg,
          }));
        } else {
          const fallback = simulateLocalJevDecision(state, candidateAnalyses, Date.now());
          stateRef.current.decisionCache.set(junctionKey, fallback);
          setLatestDecision(fallback);
        }
      } catch (err) {
        const fallback = simulateLocalJevDecision(state, candidateAnalyses, Date.now());
        stateRef.current.decisionCache.set(junctionKey, fallback);
        setLatestDecision(fallback);
      } finally {
        stateRef.current.inFlightQueries.delete(junctionKey);
      }
    },
    [apiKey]
  );

  // Manual direction application handler (Keyboard & UI controls)
  const applyManualDirection = useCallback((newDir: Direction) => {
    if (newDir === "NONE") return;
    const p = stateRef.current.pacman;
    const curMap = stateRef.current.mapState;
    const curGridX = Math.round(p.x);
    const curGridY = Math.round(p.y);

    p.nextDirection = newDir;

    // Immediate 180-degree reversal
    if (p.direction !== "NONE" && newDir === getOppositeDirection(p.direction)) {
      p.direction = newDir;
    } else if (p.direction === "NONE") {
      const offset = getDirectionOffset(newDir);
      if (isPassableForPacman(curGridX + offset.x, curGridY + offset.y, curMap)) {
        p.direction = newDir;
      }
    }

    if (stateRef.current.isPaused) {
      stateRef.current.isPaused = false;
      setIsPaused(false);
    }
  }, []);

  // Manual keydown listener for Manual Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      let newDir: Direction = "NONE";
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") newDir = "UP";
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") newDir = "DOWN";
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") newDir = "LEFT";
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") newDir = "RIGHT";

      if (newDir !== "NONE") {
        e.preventDefault();
        applyManualDirection(newDir);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [applyManualDirection]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);

      const delta = Math.min((currentTime - lastTime) / 16.666, 2.0);
      lastTime = currentTime;

      const { isPaused, mode, speed, stepTrigger } = stateRef.current;

      if (isPaused && !(mode === "STEP" && stepTrigger)) {
        return;
      }

      if (mode === "STEP" && stepTrigger) {
        stateRef.current.stepTrigger = false;
        setIsStepPending(false);
      }

      const p = stateRef.current.pacman;
      const ghostsList = stateRef.current.ghosts;
      const curMap = stateRef.current.mapState;
      const currentSpeed = p.speed * speed * delta;


      // 1. Ghost Global Mode Timer (Scatter / Chase cycle)
      stateRef.current.ghostModeTimer += delta;
      if (
        stateRef.current.globalGhostMode === "SCATTER" &&
        stateRef.current.ghostModeTimer > 420
      ) {
        stateRef.current.globalGhostMode = "CHASE";
        stateRef.current.ghostModeTimer = 0;
      } else if (
        stateRef.current.globalGhostMode === "CHASE" &&
        stateRef.current.ghostModeTimer > 1200
      ) {
        stateRef.current.globalGhostMode = "SCATTER";
        stateRef.current.ghostModeTimer = 0;
      }

      // 2. Pac-Man Power Pellet Timer
      if (p.powerRemaining > 0) {
        p.powerRemaining -= delta;
        if (p.powerRemaining <= 0) {
          p.powerRemaining = 0;
          for (const g of ghostsList) {
            if (g.mode === "FRIGHTENED") {
              g.mode = stateRef.current.globalGhostMode;
            }
          }
        }
      }

      // 3. Pac-Man Navigation & Autonomous JEV Logic
      const curGridX = Math.round(p.x);
      const curGridY = Math.round(p.y);

      // Handle immediate 180-degree reversal
      if (p.nextDirection !== "NONE" && p.nextDirection === getOppositeDirection(p.direction)) {
        p.direction = p.nextDirection;
      }

      // Check if Pac-Man is aligned with tile center
      const isAtTileCenter =
        Math.abs(p.x - curGridX) < Math.max(0.06, currentSpeed * 0.85) &&
        Math.abs(p.y - curGridY) < Math.max(0.06, currentSpeed * 0.85);

      if (isAtTileCenter) {
        // Snap to exact center when crossing
        p.x = curGridX;
        p.y = curGridY;

        // Tunnel wrapping
        if (curGridY === TUNNEL_ROW) {
          if (curGridX <= 0 && p.direction === "LEFT") {
            p.x = COLS - 1;
          } else if (curGridX >= COLS - 1 && p.direction === "RIGHT") {
            p.x = 0;
          }
        }

        const junctionKey = `${curGridX},${curGridY}`;
        const isJunction = isJunctionTile(curGridX, curGridY, curMap, p.direction);

        // AUTONOMOUS or STEP mode decision execution
        if (mode === "AUTONOMOUS" || mode === "STEP") {
          const fwdOffset = getDirectionOffset(p.direction);
          const isBlockedAhead = !isPassableForPacman(curGridX + fwdOffset.x, curGridY + fwdOffset.y, curMap);

          if ((isJunction || isBlockedAhead) && stateRef.current.lastJunctionKey !== junctionKey) {
            stateRef.current.lastJunctionKey = junctionKey;

            const cached = stateRef.current.decisionCache.get(junctionKey);
            if (
              cached &&
              isPassableForPacman(
                curGridX + getDirectionOffset(cached.action).x,
                curGridY + getDirectionOffset(cached.action).y,
                curMap
              )
            ) {
              p.nextDirection = cached.action;
              p.direction = cached.action;
              setLatestDecision(cached);
              stateRef.current.decisionCache.delete(junctionKey);
            } else {
              // Local fallback immediate movement to keep physics fluid
              const { state, candidateAnalyses } = buildJevEvaluationState(p, ghostsList, curMap);
              const fallback = simulateLocalJevDecision(state, candidateAnalyses, Date.now());
              if (
                isPassableForPacman(
                  curGridX + getDirectionOffset(fallback.action).x,
                  curGridY + getDirectionOffset(fallback.action).y,
                  curMap
                )
              ) {
                p.nextDirection = fallback.action;
                p.direction = fallback.action;
              }

              // Only set fallback decision if no cloud query is currently in-flight
              // to prevent rapid flickering between Cloud JEV and Local Sim
              const hasInFlight = stateRef.current.inFlightQueries.has(junctionKey);
              if (!hasInFlight) {
                // If cloud is available, dispatch query and keep UI stable
                fetchJevDecision(p, ghostsList, curMap, junctionKey);
              }
            }

            if (mode === "STEP") {
              stateRef.current.isPaused = true;
              setIsPaused(true);
              setIsStepPending(true);
            }
          }
        }

        // Apply queued direction if valid
        if (p.nextDirection !== p.direction && p.nextDirection !== "NONE") {
          const nextOffset = getDirectionOffset(p.nextDirection);
          if (isPassableForPacman(curGridX + nextOffset.x, curGridY + nextOffset.y, curMap)) {
            p.direction = p.nextDirection;
          }
        }

        // Check if forward path is a wall
        const curOffset = getDirectionOffset(p.direction);
        if (!isPassableForPacman(curGridX + curOffset.x, curGridY + curOffset.y, curMap)) {
          if (mode === "AUTONOMOUS") {
            const valid = getValidMoves(curGridX, curGridY, curMap, p.direction, false);
            if (valid.length > 0) {
              p.direction = valid[0];
            } else {
              const allValid = getValidMoves(curGridX, curGridY, curMap, p.direction, true);
              p.direction = allValid.length > 0 ? allValid[0] : "NONE";
            }
          } else {
            p.direction = "NONE";
          }
        }

        // Lookahead Pre-fetching: Find upcoming junction down this corridor
        if (p.direction !== "NONE" && (mode === "AUTONOMOUS" || mode === "STEP")) {
          const nextJunction = findNextJunctionAlongPath(curGridX, curGridY, p.direction, curMap);
          if (nextJunction) {
            const nextKey = `${nextJunction.x},${nextJunction.y}`;
            if (
              !stateRef.current.decisionCache.has(nextKey) &&
              !stateRef.current.inFlightQueries.has(nextKey)
            ) {
              const hypotheticalPacman: PacmanEntity = {
                ...p,
                x: nextJunction.x,
                y: nextJunction.y,
              };
              fetchJevDecision(hypotheticalPacman, ghostsList, curMap, nextKey);
            }
          }
        }
      }

      // Move Pac-Man along current direction
      if (p.direction !== "NONE") {
        const offset = getDirectionOffset(p.direction);
        p.x += offset.x * currentSpeed;
        p.y += offset.y * currentSpeed;
        p.mouthAngle = (Math.sin(currentTime * 0.015) + 1) * 0.18 + 0.05;
      }

      // Pellet consumption
      const eatGridX = Math.round(p.x);
      const eatGridY = Math.round(p.y);
      const curCell = curMap[eatGridY] ? curMap[eatGridY][eatGridX] : 0;
      if (curCell === 2 || curCell === 3) {
        curMap[eatGridY][eatGridX] = 0;
        const addScore = curCell === 2 ? 10 : 50;

        if (curCell === 3) {
          p.powerRemaining = 600; // ~10 seconds
          for (const g of ghostsList) {
            if (g.mode !== "EATEN") {
              g.mode = "FRIGHTENED";
              g.frightenedTimer = 600;
            }
          }
        }

        stateRef.current.stats.score += addScore;
        stateRef.current.stats.pelletsEaten += 1;
        if (stateRef.current.stats.score > stateRef.current.stats.highScore) {
          stateRef.current.stats.highScore = stateRef.current.stats.score;
        }

        setStats({ ...stateRef.current.stats });
        setMapState(curMap.map((row) => [...row]));
      }

      // 4. Ghost AI Updates and Movement
      updateGhostTargets(ghostsList, p, stateRef.current.globalGhostMode);

      for (const ghost of ghostsList) {
        const gGridX = Math.round(ghost.x);
        const gGridY = Math.round(ghost.y);
        const gSpeed =
          ghost.mode === "EATEN"
            ? ghost.speed * 2.2
            : ghost.mode === "FRIGHTENED"
            ? ghost.speed * 0.55
            : ghost.speed;
        const currentGSpeed = gSpeed * speed * delta;

        const isGhostAtCenter =
          Math.abs(ghost.x - gGridX) < Math.max(0.06, currentGSpeed * 0.85) &&
          Math.abs(ghost.y - gGridY) < Math.max(0.06, currentGSpeed * 0.85);

        if (isGhostAtCenter) {
          ghost.x = gGridX;
          ghost.y = gGridY;

          // Ghost house respawn check
          if (
            ghost.mode === "EATEN" &&
            Math.abs(ghost.x - GHOST_HOUSE_POS.x) < 1 &&
            Math.abs(ghost.y - GHOST_HOUSE_POS.y) < 1
          ) {
            ghost.mode = stateRef.current.globalGhostMode;
          }

          ghost.direction = getNextGhostDirection(ghost, gGridX, gGridY, curMap);
        }

        const gOffset = getDirectionOffset(ghost.direction);
        ghost.x += gOffset.x * currentGSpeed;
        ghost.y += gOffset.y * currentGSpeed;

        // 5. Collision Detection between Pac-Man and Ghost
        const dist = Math.hypot(ghost.x - p.x, ghost.y - p.y);
        if (dist < 0.75) {
          if (ghost.mode === "FRIGHTENED") {
            ghost.mode = "EATEN";
            stateRef.current.stats.score += 200;
            stateRef.current.stats.ghostsEaten += 1;
            setStats({ ...stateRef.current.stats });
          } else if (ghost.mode === "CHASE" || ghost.mode === "SCATTER") {
            // Pac-Man loses life
            p.lives -= 1;
            if (p.lives <= 0) {
              // Game Over
              setIsPaused(true);
            }
            // Reset entity positions
            p.x = INITIAL_PACMAN.x;
            p.y = INITIAL_PACMAN.y;
            p.direction = "LEFT";
            p.nextDirection = "LEFT";

            const newGhosts = createInitialGhosts();
            stateRef.current.ghosts = newGhosts;
            setGhosts(newGhosts);
            break;
          }
        }
      }

      // Sync React state for Canvas rendering
      setPacman({ ...p });
      setGhosts([...ghostsList]);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speedMultiplier, mode, fetchJevDecision]);

  const play = useCallback(() => {
    stateRef.current.isPaused = false;
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    stateRef.current.isPaused = true;
    setIsPaused(true);
  }, []);
  const step = useCallback(() => {
    stateRef.current.stepTrigger = true;
    setIsStepPending(false);
  }, []);

  const reset = useCallback(() => {
    const newMap = MAZE_MAP.map((row) => [...row]);
    const newPacman = { ...INITIAL_PACMAN };
    const newGhosts = createInitialGhosts();

    stateRef.current.pacman = newPacman;
    stateRef.current.ghosts = newGhosts;
    stateRef.current.mapState = newMap;
    stateRef.current.decisionCache.clear();
    stateRef.current.lastJunctionKey = "";
    stateRef.current.stats.score = 0;
    stateRef.current.stats.pelletsEaten = 0;

    setMapState(newMap);
    setPacman(newPacman);
    setGhosts(newGhosts);
    setLatestDecision(null);
    setStats((prev) => ({
      ...prev,
      score: 0,
      pelletsEaten: 0,
    }));
    setIsPaused(true);
  }, []);

  return {
    pacman,
    ghosts,
    mapState,
    stats,
    latestDecision,
    isPaused,
    mode,
    speedMultiplier,
    aiVisionOverlay,
    isStepPending,
    apiKey,
    play,
    pause,
    step,
    reset,
    setMode,
    setSpeedMultiplier,
    setAiVisionOverlay,
    setApiKey,
    onManualDirection: applyManualDirection,
  };
}
