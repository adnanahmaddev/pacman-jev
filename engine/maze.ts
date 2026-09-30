import { Direction, Position, TileType } from "@/types/game";

// Standard 28 cols x 31 rows Pac-Man layout
// 1 = Wall, 2 = Pellet, 3 = Power Pellet, 0 = Empty, 4 = Ghost House, 5 = Gate
export const MAZE_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,0], // Tunnel row
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const COLS = 28;
export const ROWS = 31;
export const TILE_SIZE = 16; // Standard rendering tile size in px

export const TUNNEL_ROW = 14;

export function getTile(gridX: number, gridY: number, mapState: number[][]): number {
  if (gridY === TUNNEL_ROW) {
    if (gridX < 0 || gridX >= COLS) return 0; // In tunnel passage
  }
  if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) {
    return 1; // Out of bounds treated as wall
  }
  return mapState[gridY][gridX];
}

export function isWall(gridX: number, gridY: number, mapState: number[][]): boolean {
  const tile = getTile(gridX, gridY, mapState);
  return tile === 1 || tile === 5; // 5 is ghost gate
}

export function isPassableForPacman(gridX: number, gridY: number, mapState: number[][]): boolean {
  if (gridY === TUNNEL_ROW && (gridX < 0 || gridX >= COLS)) return true;
  if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return false;
  const tile = mapState[gridY][gridX];
  return tile !== 1 && tile !== 4 && tile !== 5;
}

export function isPassableForGhost(
  gridX: number, 
  gridY: number, 
  mapState: number[][], 
  allowGate: boolean = false
): boolean {
  if (gridY === TUNNEL_ROW && (gridX < 0 || gridX >= COLS)) return true;
  if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return false;
  const tile = mapState[gridY][gridX];
  if (tile === 1) return false;
  if (tile === 5 && !allowGate) return false;
  return true;
}

export function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case "UP": return "DOWN";
    case "DOWN": return "UP";
    case "LEFT": return "RIGHT";
    case "RIGHT": return "LEFT";
    default: return "NONE";
  }
}

export function getDirectionOffset(dir: Direction): Position {
  switch (dir) {
    case "UP": return { x: 0, y: -1 };
    case "DOWN": return { x: 0, y: 1 };
    case "LEFT": return { x: -1, y: 0 };
    case "RIGHT": return { x: 1, y: 0 };
    default: return { x: 0, y: 0 };
  }
}

export function getValidMoves(
  gridX: number,
  gridY: number,
  mapState: number[][],
  currentDir?: Direction,
  allowReverse: boolean = true
): Direction[] {
  const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
  const valid: Direction[] = [];
  const opposite = currentDir ? getOppositeDirection(currentDir) : "NONE";

  for (const dir of directions) {
    if (!allowReverse && dir === opposite) continue;
    const offset = getDirectionOffset(dir);
    const nx = gridX + offset.x;
    const ny = gridY + offset.y;
    if (isPassableForPacman(nx, ny, mapState)) {
      valid.push(dir);
    }
  }

  return valid;
}

/**
 * Returns true if this tile is a junction (more than 1 non-reverse direction option)
 * or a corner where the corridor turns.
 */
export function isJunctionTile(
  gridX: number, 
  gridY: number, 
  mapState: number[][],
  currentDir: Direction
): boolean {
  const validMoves = getValidMoves(gridX, gridY, mapState, currentDir, false);
  // An intersection allows turns other than just continuing straight
  const canContinueStraight = validMoves.includes(currentDir);
  
  if (validMoves.length >= 2) return true; // T-junction or crossroad
  if (validMoves.length === 1 && !canContinueStraight) return true; // Mandatory 90-degree corner
  
  return false;
}

export function countPellets(mapState: number[][]): number {
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (mapState[r][c] === 2 || mapState[r][c] === 3) {
        count++;
      }
    }
  }
  return count;
}
