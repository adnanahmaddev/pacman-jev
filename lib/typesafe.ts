import { CandidateMoveAnalysis, Direction, JevEvaluationState, JevSystemOneDecision } from "@/types/game";
import { simulateLocalJevDecision } from "./localSim";

export interface RequestJevParams {
  state: JevEvaluationState;
  analyses: Record<Direction, CandidateMoveAnalysis>;
  apiKey?: string;
  model?: string;
}

export async function queryJevSystemOne({
  state,
  analyses,
  apiKey,
  model = "jev-latest",
}: RequestJevParams): Promise<JevSystemOneDecision> {
  const startTime = Date.now();
  const effectiveKey = apiKey || process.env.TYPESAFE_API_KEY;

  if (!effectiveKey) {
    return simulateLocalJevDecision(state, analyses, startTime);
  }

  // Filter only valid moves for the choice criteria to keep prompt concise & focused
  const validMoveCriteria: Record<string, string> = {};
  const validDirs = (["UP", "DOWN", "LEFT", "RIGHT"] as Direction[]).filter(
    (d) => analyses[d].isValid
  );

  if (validDirs.length === 0) {
    return simulateLocalJevDecision(state, analyses, startTime);
  }

  for (const dir of validDirs) {
    validMoveCriteria[dir] = state.candidate_moves[dir];
  }

  const payload = {
    state,
    model,
    questions: {
      action: {
        type: "choice",
        instructions: "Select the single best move for Pacman to survive and score points.",
        criteria: validMoveCriteria,
      },
      tactical_intent: {
        type: "choice",
        instructions: "What is Pacman's primary strategic goal at this intersection?",
        criteria: {
          evade_danger: "Flee approaching deadly ghosts to prevent losing a life",
          hunt_ghost: "Pursue and consume vulnerable blue/frightened ghosts for bonus points",
          farm_pellets: "Safely eat pellets along clear corridors",
          rush_power_pellet: "Quickly acquire nearby energizer power pellet",
          reposition: "Navigate towards central open junction to escape a trap",
        },
      },
      threat_level: {
        type: "score",
        instructions: "Rate the immediate danger to Pacman on a 0 to 3 scale.",
        criteria: [
          "Safe: No nearby danger or ghosts are vulnerable/frightened",
          "Low threat: Ghosts in distance, clear escape routes exist",
          "High threat: Ghost within 3 tiles advancing rapidly",
          "Critical: Imminent trap or unavoidable collision without reversal",
        ],
      },
      is_cornered: {
        type: "noul",
        instructions: "Is Pacman cornered with no safe exit if the ghost continues moving?",
        criteria: {
          true: "Trap detected, high probability of death",
          false: "Escape corridor remains open",
        },
      },
    },
  };

  try {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`TypeSafe API responded with status ${res.status}: Falling back to local simulator.`);
      return simulateLocalJevDecision(state, analyses, startTime);
    }

    const data = await res.json();
    const actionAns = data.answers?.action;
    const intentAns = data.answers?.tactical_intent;
    const threatAns = data.answers?.threat_level;
    const corneredAns = data.answers?.is_cornered;

    const chosenAction: Direction = (actionAns?.choice as Direction) || validDirs[0];
    const rawProbs: Record<string, number> = actionAns?.probabilities || {};

    const fullProbs: Record<Direction, number> = {
      UP: rawProbs.UP ?? 0,
      DOWN: rawProbs.DOWN ?? 0,
      LEFT: rawProbs.LEFT ?? 0,
      RIGHT: rawProbs.RIGHT ?? 0,
      NONE: 0,
    };

    return {
      action: chosenAction,
      probabilities: fullProbs,
      confidence: typeof actionAns?.confidence === "number" ? actionAns.confidence : 0.85,
      threat_level: typeof threatAns?.score === "number" ? threatAns.score : 0,
      threat_confidence: typeof threatAns?.confidence === "number" ? threatAns.confidence : 0.85,
      is_cornered: typeof corneredAns?.noul === "number" ? corneredAns.noul : 0,
      tactical_intent: intentAns?.choice || "farm_pellets",
      latency_ms: Date.now() - startTime,
      token_usage: data.usage,
      raw_state: state,
      source: "cloud_jev",
    };
  } catch (err) {
    console.error("Error communicating with TypeSafe AI:", err);
    return simulateLocalJevDecision(state, analyses, startTime);
  }
}
