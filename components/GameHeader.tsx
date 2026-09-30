"use client";

import { GameStats } from "@/types/game";
import { KeyRound, Trophy } from "lucide-react";

interface GameHeaderProps {
  stats: GameStats;
  lives: number;
  onOpenSettings: () => void;
  onOpenMechanics: () => void;
  hasApiKey: boolean;
}

export function GameHeader({
  stats,
  lives,
  onOpenSettings,
  onOpenMechanics,
  hasApiKey,
}: GameHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-6 py-2.5 shadow-2xs shrink-0">
      {/* Title & Brand */}
      <div className="flex items-center space-x-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono font-bold text-xs shadow-2xs">
          J1
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-mono text-sm font-bold tracking-tight text-neutral-900 uppercase">
              PAC-MAN // JEV SYSTEM ONE
            </h1>
            <span className="hidden sm:inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-neutral-600 border border-neutral-200">
              TypeSafe AI
            </span>
          </div>
        </div>
      </div>

      {/* Game HUD (Score, High Score, Lives) */}
      <div className="flex items-center space-x-5">
        <div className="flex items-baseline space-x-2">
          <span className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
            Score:
          </span>
          <span className="font-mono text-base font-bold tracking-tight text-neutral-900">
            {stats.score.toString().padStart(6, "0")}
          </span>
        </div>

        <div className="border-l border-neutral-200 pl-4 flex items-baseline space-x-1.5">
          <Trophy className="h-3 w-3 text-neutral-400 self-center" />
          <span className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
            High:
          </span>
          <span className="font-mono text-base font-bold tracking-tight text-neutral-900">
            {stats.highScore.toString().padStart(6, "0")}
          </span>
        </div>

        <div className="border-l border-neutral-200 pl-4 flex items-center space-x-1.5">
          <span className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase mr-1">
            Lives:
          </span>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full border border-neutral-900 ${
                  i < lives ? "bg-neutral-900" : "bg-transparent opacity-20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* JEV Mechanics Slide-Over Trigger Button */}
        <button
          onClick={onOpenMechanics}
          className="flex items-center space-x-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          title="Open Autonomous JEV System One Mechanics & State Inspector"
        >
          <span className="font-mono text-[11px] font-bold">⚡</span>
          <span>Mechanics</span>
        </button>

        {/* API Key / Settings Button */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
            hasApiKey
              ? "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              : "border-neutral-300 bg-neutral-900 text-white hover:bg-neutral-800"
          }`}
        >
          <KeyRound className="h-3 w-3" />
          <span>{hasApiKey ? "API Ready" : "API Key"}</span>
        </button>
      </div>
    </header>
  );
}
