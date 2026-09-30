import { Direction, Position } from "@/types/game";
import { getDirectionOffset, isJunctionTile, isPassableForPacman } from "@/engine/maze";

/**
 * Predicts the next junction or turning point along Pac-Man's current direction corridor.
 */
export function findNextJunctionAlongPath(
  currentGridX: number,
  currentGridY: number,
  dir: Direction,
  mapState: number[][]
): Position | null {
  if (dir === "NONE") return null;

  const offset = getDirectionOffset(dir);
  let scanX = currentGridX + offset.x;
  let scanY = currentGridY + offset.y;
  let steps = 0;

  while (isPassableForPacman(scanX, scanY, mapState) && steps < 20) {
    steps++;
    if (isJunctionTile(scanX, scanY, mapState, dir)) {
      return { x: scanX, y: scanY };
    }
    scanX += offset.x;
    scanY += offset.y;
  }

  // If the path hits a wall, the tile before the wall is a forced turning point
  if (steps > 0 && !isPassableForPacman(scanX, scanY, mapState)) {
    return { x: scanX - offset.x, y: scanY - offset.y };
  }

  return null;
}
