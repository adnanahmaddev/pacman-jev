export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT" | "NONE";

export interface Position {
  x: number;
  y: number;
}

export type TileType = 
  | "EMPTY" 
  | "WALL" 
  | "PELLET" 
  | "POWER_PELLET" 
  | "GHOST_HOUSE" 
  | "GATE";

export type GhostMode = "CHASE" | "SCATTER" | "FRIGHTENED" | "EATEN";

export interface Ghost {
  id: "blinky" | "pinky" | "inky" | "clyde";
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: Direction;
  mode: GhostMode;
  frightenedTimer: number;
  speed: number;
  visualStyle: "solid" | "dotted" | "striped" | "hatched";
}

export interface PacmanEntity {
  x: number;
  y: number;
  direction: Direction;
  nextDirection: Direction;
  speed: number;
  mouthAngle: number;
  isDying: boolean;
  lives: number;
  powerRemaining: number;
}

export interface CandidateMoveAnalysis {
  direction: Direction;
  isValid: boolean;
  distanceToNearestGhost: number;
  pelletsInCorridor: number;
  isDeadEnd: boolean;
  leadsToPowerPellet: boolean;
  threatRating: "SAFE" | "CAUTION" | "LETHAL";
}

export interface JevEvaluationState {
  pacman: {
    grid_position: [number, number];
    current_direction: Direction;
    power_mode_active: boolean;
    power_ticks_remaining: number;
    lives: number;
  };
  candidate_moves: Record<Direction, string>;
  ghost_proximities: Array<{
    name: string;
    distance_tiles: number;
    bearing: string;
    mode: GhostMode;
  }>;
  nearest_objectives: {
    nearest_pellet_distance: number;
    nearest_pellet_direction: Direction;
    nearest_power_pellet_distance: number | null;
    nearest_frightened_ghost_distance: number | null;
  };
  tactical_summary: string;
}

export interface JevSystemOneDecision {
  action: Direction;
  probabilities: Record<Direction, number>;
  confidence: number;
  threat_level: number;
  threat_confidence: number;
  is_cornered: number;
  tactical_intent: string;
  latency_ms: number;
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  raw_state: JevEvaluationState;
  source: "cloud_jev" | "local_sim";
}

export interface GameStats {
  score: number;
  highScore: number;
  level: number;
  pelletsEaten: number;
  totalPellets: number;
  ghostsEaten: number;
  jevDecisionsCount: number;
  avgLatencyMs: number;
}
