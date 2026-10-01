"use client";

import { useEffect, useState } from "react";
import { usePacmanGame } from "@/hooks/usePacmanGame";
import { GameCanvas } from "@/components/GameCanvas";
import { GameControls } from "@/components/GameControls";
import { JevTelemetrySidebar } from "@/components/JevTelemetrySidebar";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { KeyRound, Trophy } from "lucide-react";

export default function PacmanPage() {
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [persistedKey, setPersistedKey] = useState<string>("");
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage on mount
    const saved = localStorage.getItem("typesafe_api_key");
    if (saved) {
      setPersistedKey(saved);
    }

    // Check if server environment has TYPESAFE_API_KEY configured
    fetch("/api/jev")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.hasServerKey === "boolean") {
          setHasServerKey(data.hasServerKey);
        }
      })
      .catch(() => setHasServerKey(false));
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

  // Keyboard shortcut for Space -> Toggle Pause/Play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (isPaused) {
          play();
        } else {
          pause();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, play, pause]);

  // Calibrated tile size for desktop single-viewport fit (18px = 504px x 558px)
  const TILE_SIZE = 18;
  const boardWidthPx = 28 * TILE_SIZE; // 504px

  const hasApiKey = Boolean(apiKey || persistedKey || hasServerKey);
  const isCloudEngine = latestDecision
    ? latestDecision.source === "cloud_jev"
    : hasApiKey;

  return (
    <div className="min-h-screen w-screen bg-[#fafafa] text-neutral-900 selection:bg-neutral-900 selection:text-white flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Container width exactly matches content width (506px canvas + 32px gap + 410px sidebar = 948px) */}
      <div className="w-full max-w-[948px] mx-auto flex flex-col flex-1">
        {/* Unboxed Minimalist Header Row (matches reference "Ollama racer") */}
        <header className="flex items-center justify-between pb-5 mb-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 font-sans">
              Pacman
            </h1>
          </div>

          {/* Right Header: Minimalist Session Metrics & API Key */}
          <div className="flex items-center space-x-4 sm:space-x-6 text-sm">
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Score:
              </span>
              <span className="text-sm font-bold text-neutral-900">
                {stats.score.toString().padStart(6, "0")}
              </span>
            </div>

            <div className="hidden sm:flex items-baseline space-x-1.5 font-mono border-l border-neutral-200 pl-4">
              <Trophy className="h-3 w-3 text-neutral-400 self-center" />
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                High:
              </span>
              <span className="text-sm font-bold text-neutral-900">
                {stats.highScore.toString().padStart(6, "0")}
              </span>
            </div>

            <div className="border-l border-neutral-200 pl-4">
              <button
                onClick={() => setApiKeyModalOpen(true)}
                className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${hasApiKey
                  ? "border border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70"
                  : "border border-neutral-300 bg-neutral-900 text-white hover:bg-neutral-800"
                  }`}
                title="Configure TypeSafe AI API Key"
              >
                <KeyRound className="h-3 w-3" />
                <span className="text-[11px]">{hasApiKey ? "API Ready" : "API Key"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main 2-Column Split Layout (Both columns have equal height) */}
        <main className="flex flex-col lg:flex-row items-stretch justify-between gap-8 flex-1">
          {/* Left Column: Framed Game Canvas Shell */}
          <div
            className="flex flex-col justify-between rounded-2xl border border-neutral-300 bg-white shadow-2xs overflow-hidden shrink-0 h-full"
            style={{ width: `${boardWidthPx + 2}px` }}
          >
            {/* Canvas In-Frame Top Ribbon (matches reference subheader) */}
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-200/90 bg-neutral-50/70 text-[11px] font-mono select-none">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px]">
                  {mode === "AUTONOMOUS"
                    ? isCloudEngine
                      ? "JEV AUTOPILOT"
                      : "HEURISTIC AUTOPILOT"
                    : "MANUAL MODE"}
                </span>
                <span className="text-neutral-300">/</span>
                <span className="text-neutral-500 text-[10px]">
                  {isCloudEngine ? "COGNITIVE LAB" : "LOCAL SIM"}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-neutral-400 uppercase mr-0.5">Lives:</span>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 w-2 rounded-full border border-neutral-800 ${i < pacman.lives ? "bg-neutral-900" : "bg-transparent opacity-20"
                          }`}
                      />
                    ))}
                  </div>
                </div>

                <span className="text-neutral-300">|</span>

                <span className="text-neutral-600 text-[10px] font-semibold">
                  01 / LEVEL {stats.level}
                </span>
              </div>
            </div>

            {/* Game Canvas */}
            <div className="bg-[#fafafa] flex justify-center">
              <GameCanvas
                mapState={mapState}
                pacman={pacman}
                ghosts={ghosts}
                latestDecision={latestDecision}
                aiVisionOverlay={aiVisionOverlay}
                tileSize={TILE_SIZE}
              />
            </div>

            {/* Integrated Bottom Controls Shelf */}
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
              onSetSpeed={setSpeedMultiplier}
              onToggleAiVision={() => setAiVisionOverlay(!aiVisionOverlay)}
              onManualDirection={onManualDirection}
            />
          </div>

          {/* Right Column: Real-Time JEV Telemetry Sidebar */}
          <JevTelemetrySidebar
            decision={latestDecision}
            mode={mode}
            onSetMode={setMode}
            avgLatencyMs={stats.avgLatencyMs}
            isPaused={isPaused}
            isStepPending={isStepPending}
            hasApiKey={hasApiKey}
            onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
          />
        </main>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        currentKey={persistedKey || apiKey}
        onSaveKey={handleSaveKey}
        hasServerKey={hasServerKey === true}
      />
    </div>
  );
}
