import {
  CandidateMoveAnalysis,
  Direction,
  Ghost,
  JevEvaluationState,
  PacmanEntity,
} from "@/types/game";
import {
  COLS,
  getDirectionOffset,
  getOppositeDirection,
  getValidMoves,
  isPassableForPacman,
  ROWS,
} from "./maze";

function getBearing(fromX: number, fromY: number, toX: number, toY: number): string {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "EAST" : "WEST";
  } else {
    return dy > 0 ? "SOUTH" : "NORTH";
  }
}

/**
 * Analyzes corridors in a given direction for pellets, walls, and ghost proximity.
 */
function analyzeCorridor(
  startX: number,
  startY: number,
  dir: Direction,
  mapState: number[][],
  ghosts: Ghost[]
): {
  pellets: number;
  hasPowerPellet: boolean;
  minGhostDist: number;
  corridorLength: number;
  isDeadEnd: boolean;
} {
  const offset = getDirectionOffset(dir);
  let curX = startX + offset.x;
  let curY = startY + offset.y;
  let pellets = 0;
  let hasPowerPellet = false;
  let minGhostDist = Infinity;
  let steps = 0;

  while (isPassableForPacman(curX, curY, mapState) && steps < 15) {
    steps++;
    const tile = mapState[curY] ? mapState[curY][curX] : 0;
    if (tile === 2) pellets++;
    if (tile === 3) hasPowerPellet = true;

    // Check if any ghost is along this ray
    for (const ghost of ghosts) {
      if (ghost.mode === "CHASE" || ghost.mode === "SCATTER") {
        const d = Math.hypot(ghost.x - curX, ghost.y - curY);
        if (d < minGhostDist) {
          minGhostDist = d;
        }
      }
    }

    // Check if we hit an intersection or dead end
    const sideMoves = getValidMoves(curX, curY, mapState, dir, false);
    if (sideMoves.length > 1) {
      // Reached an intersection down the corridor
      break;
    }

    curX += offset.x;
    curY += offset.y;
  }

  const isDeadEnd = steps > 0 && !isPassableForPacman(curX, curY, mapState);

  return {
    pellets,
    hasPowerPellet,
    minGhostDist,
    corridorLength: steps,
    isDeadEnd,
  };
}

export function buildJevEvaluationState(
  pacman: PacmanEntity,
  ghosts: Ghost[],
  mapState: number[][]
): {
  state: JevEvaluationState;
  candidateAnalyses: Record<Direction, CandidateMoveAnalysis>;
} {
  const pacX = Math.round(pacman.x);
  const pacY = Math.round(pacman.y);
  const validMoves = getValidMoves(pacX, pacY, mapState, pacman.direction, true);

  const candidateMovesCriteria: Record<Direction, string> = {
    UP: "Blocked by maze wall",
    DOWN: "Blocked by maze wall",
    LEFT: "Blocked by maze wall",
    RIGHT: "Blocked by maze wall",
    NONE: "Maintain current position",
  };

  const analyses: Record<Direction, CandidateMoveAnalysis> = {
    UP: { direction: "UP", isValid: false, distanceToNearestGhost: Infinity, pelletsInCorridor: 0, isDeadEnd: false, leadsToPowerPellet: false, threatRating: "SAFE" },
    DOWN: { direction: "DOWN", isValid: false, distanceToNearestGhost: Infinity, pelletsInCorridor: 0, isDeadEnd: false, leadsToPowerPellet: false, threatRating: "SAFE" },
    LEFT: { direction: "LEFT", isValid: false, distanceToNearestGhost: Infinity, pelletsInCorridor: 0, isDeadEnd: false, leadsToPowerPellet: false, threatRating: "SAFE" },
    RIGHT: { direction: "RIGHT", isValid: false, distanceToNearestGhost: Infinity, pelletsInCorridor: 0, isDeadEnd: false, leadsToPowerPellet: false, threatRating: "SAFE" },
    NONE: { direction: "NONE", isValid: false, distanceToNearestGhost: Infinity, pelletsInCorridor: 0, isDeadEnd: false, leadsToPowerPellet: false, threatRating: "SAFE" },
  };

  const allDirections: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];

  for (const dir of allDirections) {
    if (!validMoves.includes(dir)) continue;

    const analysis = analyzeCorridor(pacX, pacY, dir, mapState, ghosts);
    let threat: "SAFE" | "CAUTION" | "LETHAL" = "SAFE";

    // Measure overall distance from ghost to the first step tile
    const offset = getDirectionOffset(dir);
    const stepX = pacX + offset.x;
    const stepY = pacY + offset.y;

    let nearestGhostDist = Infinity;
    let closestGhostName = "";
    let closestGhostMode = "";

    for (const ghost of ghosts) {
      const dist = Math.hypot(ghost.x - stepX, ghost.y - stepY);
      if (dist < nearestGhostDist) {
        nearestGhostDist = dist;
        closestGhostName = ghost.name;
        closestGhostMode = ghost.mode;
      }
    }

    if (closestGhostMode !== "FRIGHTENED" && closestGhostMode !== "EATEN") {
      if (nearestGhostDist <= 2.2) {
        threat = "LETHAL";
      } else if (nearestGhostDist <= 5.0) {
        threat = "CAUTION";
      }
    }

    analyses[dir] = {
      direction: dir,
      isValid: true,
      distanceToNearestGhost: Number(nearestGhostDist.toFixed(1)),
      pelletsInCorridor: analysis.pellets,
      isDeadEnd: analysis.isDeadEnd,
      leadsToPowerPellet: analysis.hasPowerPellet,
      threatRating: threat,
    };

    // Formulate rich natural language criteria for JEV Choice question
    let desc = `Move ${dir}: `;
    if (threat === "LETHAL") {
      desc += `DANGEROUS AMBUSH! Ghost ${closestGhostName} is only ${nearestGhostDist.toFixed(1)} tiles away! High collision risk.`;
    } else if (threat === "CAUTION") {
      desc += `Ghost ${closestGhostName} is nearby (${nearestGhostDist.toFixed(1)} tiles). ${analysis.pellets} pellets ahead.`;
    } else {
      desc += `Clear and safe corridor. ${analysis.pellets} pellets available. Nearest ghost is ${nearestGhostDist.toFixed(1)} tiles away.`;
    }

    if (analysis.hasPowerPellet) {
      desc += " Leads directly to a Power Pellet!";
    }
    if (analysis.isDeadEnd && threat !== "SAFE") {
      desc += " Warning: Corridor dead-ends.";
    }

    candidateMovesCriteria[dir] = desc;
  }

  // Ghost proximities
  const ghostProximities = ghosts.map((g) => {
    const dist = Math.hypot(g.x - pacX, g.y - pacY);
    return {
      name: g.name,
      distance_tiles: Number(dist.toFixed(1)),
      bearing: getBearing(pacX, pacY, g.x, g.y),
      mode: g.mode,
    };
  });

  // Nearest objectives search (BFS / Manhattan scan)
  let nearestPelletDist = Infinity;
  let nearestPelletDir: Direction = "NONE";
  let nearestPowerDist: number | null = null;
  let nearestFrightenedDist: number | null = null;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = mapState[r][c];
      const dist = Math.hypot(c - pacX, r - pacY);
      if (tile === 2 && dist < nearestPelletDist) {
        nearestPelletDist = dist;
        nearestPelletDir = getBearing(pacX, pacY, c, r) as Direction;
      }
      if (tile === 3) {
        if (nearestPowerDist === null || dist < nearestPowerDist) {
          nearestPowerDist = dist;
        }
      }
    }
  }

  for (const g of ghosts) {
    if (g.mode === "FRIGHTENED") {
      const dist = Math.hypot(g.x - pacX, g.y - pacY);
      if (nearestFrightenedDist === null || dist < nearestFrightenedDist) {
        nearestFrightenedDist = dist;
      }
    }
  }

  // Tactical summary
  const lethalMoves = allDirections.filter((d) => analyses[d].isValid && analyses[d].threatRating === "LETHAL");
  const safeMoves = allDirections.filter((d) => analyses[d].isValid && analyses[d].threatRating === "SAFE");

  let summary = `Pac-Man is at grid position [${pacX}, ${pacY}] moving ${pacman.direction}. `;
  summary += `Valid directional turns: [${validMoves.join(", ")}]. `;

  if (pacman.powerRemaining > 0) {
    summary += `POWER MODE ACTIVE! Ghosts are vulnerable for ${pacman.powerRemaining} ticks. Pac-Man should aggressively hunt edible ghosts! `;
  } else if (lethalMoves.length > 0) {
    summary += `CRITICAL THREAT: Direction(s) [${lethalMoves.join(", ")}] lead straight into attacking ghosts. `;
    if (safeMoves.length > 0) {
      summary += `Safe escape route(s): [${safeMoves.join(", ")}]. `;
    } else {
      summary += `No completely safe routes; evasive maneuvers required! `;
    }
  } else {
    summary += `All corridors relatively safe. Nearest pellet is ${nearestPelletDist.toFixed(1)} tiles away in direction ${nearestPelletDir}. `;
  }

  const state: JevEvaluationState = {
    pacman: {
      grid_position: [pacX, pacY],
      current_direction: pacman.direction,
      power_mode_active: pacman.powerRemaining > 0,
      power_ticks_remaining: pacman.powerRemaining,
      lives: pacman.lives,
    },
    candidate_moves: candidateMovesCriteria,
    ghost_proximities: ghostProximities,
    nearest_objectives: {
      nearest_pellet_distance: Number(nearestPelletDist.toFixed(1)),
      nearest_pellet_direction: nearestPelletDir,
      nearest_power_pellet_distance: nearestPowerDist !== null ? Number(nearestPowerDist.toFixed(1)) : null,
      nearest_frightened_ghost_distance: nearestFrightenedDist !== null ? Number(nearestFrightenedDist.toFixed(1)) : null,
    },
    tactical_summary: summary,
  };

  return { state, candidateAnalyses: analyses };
}
