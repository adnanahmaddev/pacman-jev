import { CandidateMoveAnalysis, Direction, JevEvaluationState, JevSystemOneDecision } from "@/types/game";

/**
 * Calibrated local System One heuristic simulator that matches JEV's response schema.
 * Used when TYPESAFE_API_KEY is not configured or in offline simulation mode.
 */
export function simulateLocalJevDecision(
  state: JevEvaluationState,
  analyses: Record<Direction, CandidateMoveAnalysis>,
  startTime: number
): JevSystemOneDecision {
  const validDirs = (["UP", "DOWN", "LEFT", "RIGHT"] as Direction[]).filter(
    (d) => analyses[d].isValid
  );

  if (validDirs.length === 0) {
    return {
      action: "NONE",
      probabilities: { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0, NONE: 1 },
      confidence: 1.0,
      threat_level: 3.0,
      threat_confidence: 1.0,
      is_cornered: 1.0,
      tactical_intent: "evade_danger",
      latency_ms: Date.now() - startTime,
      raw_state: state,
      source: "local_sim",
    };
  }

  // Calculate scores for each candidate move
  const scores: Record<Direction, number> = {
    UP: -Infinity,
    DOWN: -Infinity,
    LEFT: -Infinity,
    RIGHT: -Infinity,
    NONE: -Infinity,
  };

  const isPowerActive = state.pacman.power_mode_active;
  let maxThreat = 0;

  for (const dir of validDirs) {
    const analysis = analyses[dir];
    let score = 50;

    // Safety factor
    if (!isPowerActive) {
      if (analysis.threatRating === "LETHAL") {
        score -= 200;
        maxThreat = Math.max(maxThreat, 3);
      } else if (analysis.threatRating === "CAUTION") {
        score -= 50;
        maxThreat = Math.max(maxThreat, 1.8);
      } else {
        score += 30;
      }
    } else {
      // Power mode: chase nearest ghost!
      if (analysis.distanceToNearestGhost < 6) {
        score += 80;
      }
    }

    // Pellets & Objectives
    score += analysis.pelletsInCorridor * 8;
    if (analysis.leadsToPowerPellet && !isPowerActive) {
      score += 40;
    }
    if (analysis.isDeadEnd && !isPowerActive && analysis.threatRating !== "SAFE") {
      score -= 80;
    }

    // Prefer maintaining direction slightly to prevent jitter unless turning for pellet/escape
    if (dir === state.pacman.current_direction) {
      score += 5;
    }

    scores[dir] = Math.max(score, 1);
  }

  // Softmax normalization to compute calibrated probabilities
  const validScores = validDirs.map((d) => scores[d]);
  const maxScore = Math.max(...validScores);
  const expScores = validDirs.map((d) => Math.exp((scores[d] - maxScore) / 25));
  const sumExp = expScores.reduce((a, b) => a + b, 0);

  const probabilities: Record<Direction, number> = {
    UP: 0,
    DOWN: 0,
    LEFT: 0,
    RIGHT: 0,
    NONE: 0,
  };

  let bestDir: Direction = validDirs[0];
  let highestProb = 0;

  validDirs.forEach((dir, idx) => {
    const p = Number((expScores[idx] / sumExp).toFixed(3));
    probabilities[dir] = p;
    if (p > highestProb) {
      highestProb = p;
      bestDir = dir;
    }
  });

  // Confidence is calculated from probability spread
  const confidence = Number(Math.min(1.0, Math.max(0.2, (highestProb - 1 / validDirs.length) * 1.5 + 0.5)).toFixed(2));

  // Determine tactical intent
  let intent = "farm_pellets";
  if (isPowerActive) {
    intent = "hunt_ghost";
  } else if (maxThreat >= 2.0) {
    intent = "evade_danger";
  } else if (analyses[bestDir]?.leadsToPowerPellet) {
    intent = "rush_power_pellet";
  }

  const isCornered = maxThreat >= 2.5 && validDirs.length <= 1 ? 0.95 : maxThreat >= 2.0 ? 0.6 : 0.05;

  return {
    action: bestDir,
    probabilities,
    confidence,
    threat_level: Number(maxThreat.toFixed(1)),
    threat_confidence: Number(confidence.toFixed(2)),
    is_cornered: isCornered,
    tactical_intent: intent,
    latency_ms: Math.max(8, Date.now() - startTime),
    token_usage: {
      input_tokens: 340,
      output_tokens: 38,
    },
    raw_state: state,
    source: "local_sim",
  };
}
