import { Direction, Ghost, GhostMode, PacmanEntity, Position } from "@/types/game";
import {
  COLS,
  getDirectionOffset,
  getOppositeDirection,
  isPassableForGhost,
  ROWS,
} from "./maze";

export const GHOST_SCATTER_TARGETS: Record<Ghost["id"], Position> = {
  blinky: { x: 26, y: 0 },
  pinky: { x: 1, y: 0 },
  inky: { x: 26, y: 30 },
  clyde: { x: 1, y: 30 },
};

export const GHOST_HOUSE_POS: Position = { x: 13, y: 14 };

export function createInitialGhosts(): Ghost[] {
  return [
    {
      id: "blinky",
      name: "Blinky (Shadow)",
      x: 13,
      y: 11,
      targetX: 26,
      targetY: 0,
      direction: "LEFT",
      mode: "SCATTER",
      frightenedTimer: 0,
      speed: 0.14,
      visualStyle: "solid",
    },
    {
      id: "pinky",
      name: "Pinky (Speedy)",
      x: 13,
      y: 14,
      targetX: 1,
      targetY: 0,
      direction: "UP",
      mode: "SCATTER",
      frightenedTimer: 0,
      speed: 0.13,
      visualStyle: "dotted",
    },
    {
      id: "inky",
      name: "Inky (Bashful)",
      x: 11,
      y: 14,
      targetX: 26,
      targetY: 30,
      direction: "UP",
      mode: "SCATTER",
      frightenedTimer: 0,
      speed: 0.12,
      visualStyle: "striped",
    },
    {
      id: "clyde",
      name: "Clyde (Pokey)",
      x: 15,
      y: 14,
      targetX: 1,
      targetY: 30,
      direction: "UP",
      mode: "SCATTER",
      frightenedTimer: 0,
      speed: 0.11,
      visualStyle: "hatched",
    },
  ];
}

export function updateGhostTargets(
  ghosts: Ghost[],
  pacman: PacmanEntity,
  globalMode: "CHASE" | "SCATTER"
): void {
  const blinky = ghosts.find((g) => g.id === "blinky");

  for (const ghost of ghosts) {
    if (ghost.mode === "EATEN") {
      ghost.targetX = GHOST_HOUSE_POS.x;
      ghost.targetY = GHOST_HOUSE_POS.y;
      continue;
    }

    if (ghost.mode === "FRIGHTENED") {
      // In frightened mode, ghost doesn't use target tile; picks random moves
      continue;
    }

    const currentMode = ghost.mode === "CHASE" || ghost.mode === "SCATTER" ? globalMode : ghost.mode;
    ghost.mode = currentMode;

    if (currentMode === "SCATTER") {
      const target = GHOST_SCATTER_TARGETS[ghost.id];
      ghost.targetX = target.x;
      ghost.targetY = target.y;
      continue;
    }

    // CHASE mode AI per classic Ghost personality
    const pacGridX = Math.round(pacman.x);
    const pacGridY = Math.round(pacman.y);
    const pacOffset = getDirectionOffset(pacman.direction);

    switch (ghost.id) {
      case "blinky":
        // Blinky relentlessly targets Pac-Man's exact tile
        ghost.targetX = pacGridX;
        ghost.targetY = pacGridY;
        break;

      case "pinky":
        // Pinky aims 4 tiles ahead of Pac-Man's heading
        ghost.targetX = pacGridX + pacOffset.x * 4;
        ghost.targetY = pacGridY + pacOffset.y * 4;
        break;

      case "inky":
        // Inky uses double-vector: 2 tiles ahead of Pac-Man, doubled from Blinky
        if (blinky) {
          const pivotX = pacGridX + pacOffset.x * 2;
          const pivotY = pacGridY + pacOffset.y * 2;
          ghost.targetX = pivotX + (pivotX - blinky.x);
          ghost.targetY = pivotY + (pivotY - blinky.y);
        } else {
          ghost.targetX = pacGridX;
          ghost.targetY = pacGridY;
        }
        break;

      case "clyde": {
        // Clyde targets Pac-Man if distance > 8 tiles, else retreats to scatter corner
        const distToPac = Math.hypot(ghost.x - pacGridX, ghost.y - pacGridY);
        if (distToPac > 8) {
          ghost.targetX = pacGridX;
          ghost.targetY = pacGridY;
        } else {
          ghost.targetX = GHOST_SCATTER_TARGETS.clyde.x;
          ghost.targetY = GHOST_SCATTER_TARGETS.clyde.y;
        }
        break;
      }
    }
  }
}

/**
 * Chooses the best next direction for a ghost at a tile intersection.
 * Ghosts cannot turn directly 180 degrees backwards unless mode flips.
 */
export function getNextGhostDirection(
  ghost: Ghost,
  gridX: number,
  gridY: number,
  mapState: number[][]
): Direction {
  const directions: Direction[] = ["UP", "LEFT", "DOWN", "RIGHT"];
  const opposite = getOppositeDirection(ghost.direction);
  const allowGate = ghost.mode === "EATEN" || (gridY >= 12 && gridY <= 15 && gridX >= 10 && gridX <= 17);

  const validDirs = directions.filter((dir) => {
    if (dir === opposite) return false;
    const offset = getDirectionOffset(dir);
    return isPassableForGhost(gridX + offset.x, gridY + offset.y, mapState, allowGate);
  });

  if (validDirs.length === 0) {
    // If blocked, allow reverse
    return opposite;
  }

  // If Frightened, pick pseudo-random valid direction
  if (ghost.mode === "FRIGHTENED") {
    const randomIndex = Math.floor(Math.random() * validDirs.length);
    return validDirs[randomIndex];
  }

  // Otherwise, pick direction that minimizes Euclidean distance to target tile
  let bestDir = validDirs[0];
  let minDistance = Infinity;

  for (const dir of validDirs) {
    const offset = getDirectionOffset(dir);
    const nx = gridX + offset.x;
    const ny = gridY + offset.y;
    const dist = Math.hypot(nx - ghost.targetX, ny - ghost.targetY);
    if (dist < minDistance) {
      minDistance = dist;
      bestDir = dir;
    }
  }

  return bestDir;
}
