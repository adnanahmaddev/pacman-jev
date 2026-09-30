"use client";

import { GameStats } from "@/types/game";
import { KeyRound, Trophy } from "lucide-react";

interface GameHeaderProps {
  stats: GameStats;
  lives: number;
  onOpenSettings: () => void;
  hasApiKey: boolean;
}

export function GameHeader({
  stats,
  lives,
  onOpenSettings,
  hasApiKey,
}: GameHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4">
      {/* Title & Brand */}
      <div className="flex items-center space-x-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono font-bold text-sm">
          J1
        </div>
        <div>
          <h1 className="font-mono text-base font-bold tracking-tight text-neutral-900 uppercase">
            PAC-MAN // JEV SYSTEM ONE
          </h1>
          <p className="text-xs text-neutral-500">
            Autonomous decision intelligence by TypeSafe AI
          </p>
        </div>
      </div>

      {/* Game HUD (Score, High Score, Lives) */}
      <div className="flex items-center space-x-6">
        <div>
          <div className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
            Score
          </div>
          <div className="font-mono text-xl font-bold tracking-tight text-neutral-900">
            {stats.score.toString().padStart(6, "0")}
          </div>
        </div>

        <div className="border-l border-neutral-200 pl-6">
          <div className="flex items-center space-x-1 text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
            <Trophy className="h-2.5 w-2.5" />
            <span>High Score</span>
          </div>
          <div className="font-mono text-xl font-bold tracking-tight text-neutral-900">
            {stats.highScore.toString().padStart(6, "0")}
          </div>
        </div>

        <div className="border-l border-neutral-200 pl-6">
          <div className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
            Lives
          </div>
          <div className="mt-1 flex items-center space-x-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full border border-neutral-900 ${
                  i < lives ? "bg-neutral-900" : "bg-transparent opacity-20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* API Key / Settings Button */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            hasApiKey
              ? "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              : "border-neutral-300 bg-neutral-900 text-white hover:bg-neutral-800"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>{hasApiKey ? "API Configured" : "Add API Key"}</span>
        </button>
      </div>
    </header>
  );
}
