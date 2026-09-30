"use client";

import { useEffect, useState } from "react";
import { usePacmanGame } from "@/hooks/usePacmanGame";
import { GameCanvas } from "@/components/GameCanvas";
import { GameHeader } from "@/components/GameHeader";
import { GameControls } from "@/components/GameControls";
import { JevStatusBar } from "@/components/JevStatusBar";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { JevMechanicsDrawer } from "@/components/JevMechanicsDrawer";

export default function PacmanPage() {
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isMechanicsOpen, setIsMechanicsOpen] = useState(false);
  const [persistedKey, setPersistedKey] = useState<string>("");

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
    onManualDirection,
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

  // High-precision tile size calibrated for single-viewport fit (532px x 589px)
  const TILE_SIZE = 19;
  const boardWidthPx = 28 * TILE_SIZE; // 532px

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-neutral-100 text-neutral-900 bg-grid-pattern select-none">
      {/* Sleek Fixed Header */}
      <GameHeader
        stats={stats}
        lives={pacman.lives}
        onOpenSettings={() => setApiKeyModalOpen(true)}
        onOpenMechanics={() => setIsMechanicsOpen(true)}
        hasApiKey={Boolean(apiKey || persistedKey)}
      />

      {/* Centered Main Game Stage */}
      <main className="flex flex-1 flex-col items-center justify-center p-2 sm:p-3 overflow-hidden">
        <div
          className="flex flex-col items-center space-y-2"
          style={{ width: "100%", maxWidth: `${boardWidthPx + 24}px` }}
        >
          {/* Top JEV System One Live Status Ribbon */}
          <div className="w-full">
            <JevStatusBar
              decision={latestDecision}
              avgLatencyMs={stats.avgLatencyMs}
            />
          </div>

          {/* Centered Game Canvas */}
          <div className="flex justify-center shadow-md rounded-xl">
            <GameCanvas
              mapState={mapState}
              pacman={pacman}
              ghosts={ghosts}
              latestDecision={latestDecision}
              aiVisionOverlay={aiVisionOverlay}
              tileSize={TILE_SIZE}
            />
          </div>

          {/* Compact Centered Game Controls */}
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
              onManualDirection={onManualDirection}
            />
          </div>
        </div>
      </main>

      {/* Slide-over JEV Mechanics & Raw State Drawer (Option A) */}
      <JevMechanicsDrawer
        isOpen={isMechanicsOpen}
        onClose={() => setIsMechanicsOpen(false)}
        decision={latestDecision}
        avgLatencyMs={stats.avgLatencyMs}
      />

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
