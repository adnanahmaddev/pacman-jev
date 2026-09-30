"use client";

import { useEffect, useState } from "react";
import { usePacmanGame } from "@/hooks/usePacmanGame";
import { GameCanvas } from "@/components/GameCanvas";
import { GameHeader } from "@/components/GameHeader";
import { GameControls } from "@/components/GameControls";
import { JevStatusBar } from "@/components/JevStatusBar";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { ChevronDown, ChevronRight, Cpu, Info } from "lucide-react";

export default function PacmanPage() {
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [persistedKey, setPersistedKey] = useState<string>("");
  const [showRawState, setShowRawState] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const saved = localStorage.getItem("typesafe_api_key");
    if (saved) {
      setPersistedKey(saved);
    }
  }, []);

  const {
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
  } = usePacmanGame(persistedKey);

  const handleSaveKey = (newKey: string) => {
    setPersistedKey(newKey);
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem("typesafe_api_key", newKey);
    } else {
      localStorage.removeItem("typesafe_api_key");
    }
  };

  // Expanded tile size for maximum visibility and presence
  const TILE_SIZE = 22;
  const boardWidthPx = 28 * TILE_SIZE; // 616px

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 text-neutral-900 bg-grid-pattern">
      {/* Header */}
      <GameHeader
        stats={stats}
        lives={pacman.lives}
        onOpenSettings={() => setApiKeyModalOpen(true)}
        hasApiKey={Boolean(apiKey || persistedKey)}
      />

      {/* Centered Main Game Arena */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        <div
          className="flex flex-col items-center space-y-3.5"
          style={{ width: "100%", maxWidth: `${boardWidthPx + 32}px` }}
        >
          {/* Top JEV System One Live Status Ribbon */}
          <div className="w-full">
            <JevStatusBar
              decision={latestDecision}
              avgLatencyMs={stats.avgLatencyMs}
            />
          </div>

          {/* Centered Expanded Game Canvas */}
          <div className="flex justify-center shadow-lg rounded-2xl">
            <GameCanvas
              mapState={mapState}
              pacman={pacman}
              ghosts={ghosts}
              latestDecision={latestDecision}
              aiVisionOverlay={aiVisionOverlay}
              tileSize={TILE_SIZE}
            />
          </div>

          {/* Centered Game Controls */}
          <div className="w-full">
            <GameControls
              isPaused={isPaused}
              mode={mode}
              speed={speedMultiplier}
              aiVisionOverlay={aiVisionOverlay}
              isStepPending={isStepPending}
              onPlay={play}
              onPause={pause}
              onStep={step}
              onReset={reset}
              onSetMode={setMode}
              onSetSpeed={setSpeedMultiplier}
              onToggleAiVision={() => setAiVisionOverlay(!aiVisionOverlay)}
            />
          </div>

          {/* Collapsible Architecture & Raw State Details */}
          <div className="w-full rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs text-xs text-neutral-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-medium text-neutral-800">
                <Info className="h-3.5 w-3.5 text-neutral-600" />
                <span>Autonomous JEV System One Mechanics</span>
              </div>
              {latestDecision && (
                <button
                  onClick={() => setShowRawState(!showRawState)}
                  className="flex items-center space-x-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900"
                >
                  <Cpu className="h-3 w-3" />
                  <span>{showRawState ? "Hide JSON State" : "View Raw JSON State"}</span>
                  {showRawState ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              )}
            </div>

            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
              Pac-Man evaluates junctions using TypeSafe&apos;s <span className="font-mono font-medium text-neutral-800">jev-latest</span> System One model. Predictive lookahead eliminates stutter by evaluating upcoming turns before arrival.
            </p>

            {/* Ghost monochrome style guide */}
            <div className="mt-2.5 grid grid-cols-4 gap-2 pt-2 border-t border-neutral-100 text-[10px] font-mono text-center">
              <div className="rounded bg-neutral-50 p-1 border border-neutral-200">
                <div className="font-bold text-neutral-900">Blinky</div>
                <div className="text-neutral-500">Solid Black</div>
              </div>
              <div className="rounded bg-neutral-50 p-1 border border-neutral-200">
                <div className="font-bold text-neutral-900">Pinky</div>
                <div className="text-neutral-500">Dotted</div>
              </div>
              <div className="rounded bg-neutral-50 p-1 border border-neutral-200">
                <div className="font-bold text-neutral-900">Inky</div>
                <div className="text-neutral-500">Striped</div>
              </div>
              <div className="rounded bg-neutral-50 p-1 border border-neutral-200">
                <div className="font-bold text-neutral-900">Clyde</div>
                <div className="text-neutral-500">Hatched</div>
              </div>
            </div>

            {/* Raw JSON State Dropdown */}
            {showRawState && latestDecision && (
              <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-neutral-900 p-2.5 font-mono text-[10px] leading-relaxed text-neutral-200">
                {JSON.stringify(latestDecision.raw_state, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        currentKey={persistedKey || apiKey}
        onSaveKey={handleSaveKey}
      />
    </div>
  );
}
