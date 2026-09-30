"use client";

import { Eye, EyeOff, Pause, Play, RotateCcw, StepForward } from "lucide-react";

interface GameControlsProps {
  isPaused: boolean;
  mode: "AUTONOMOUS" | "MANUAL" | "STEP";
  speed: number;
  aiVisionOverlay: boolean;
  isStepPending: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSetMode: (mode: "AUTONOMOUS" | "MANUAL" | "STEP") => void;
  onSetSpeed: (speed: number) => void;
  onToggleAiVision: () => void;
}

export function GameControls({
  isPaused,
  mode,
  speed,
  aiVisionOverlay,
  isStepPending,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSetMode,
  onSetSpeed,
  onToggleAiVision,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
      {/* Mode Selector */}
      <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-medium">
        <button
          onClick={() => onSetMode("AUTONOMOUS")}
          className={`rounded-md px-3 py-1.5 transition-all ${
            mode === "AUTONOMOUS"
              ? "bg-white font-semibold text-neutral-900 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          JEV Autopilot
        </button>
        <button
          onClick={() => onSetMode("STEP")}
          className={`rounded-md px-3 py-1.5 transition-all ${
            mode === "STEP"
              ? "bg-white font-semibold text-neutral-900 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Step-by-Step
        </button>
        <button
          onClick={() => onSetMode("MANUAL")}
          className={`rounded-md px-3 py-1.5 transition-all ${
            mode === "MANUAL"
              ? "bg-white font-semibold text-neutral-900 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Manual Keys
        </button>
      </div>

      {/* Main Playback Buttons */}
      <div className="flex items-center space-x-2">
        {isPaused ? (
          <button
            onClick={onPlay}
            className="flex items-center space-x-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Play</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center space-x-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 shadow-xs hover:bg-neutral-50 transition-colors"
          >
            <Pause className="h-3.5 w-3.5 fill-current" />
            <span>Pause</span>
          </button>
        )}

        {(isPaused || mode === "STEP") && (
          <button
            onClick={onStep}
            className="flex items-center space-x-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors"
            title="Step to next junction decision"
          >
            <StepForward className="h-3.5 w-3.5" />
            <span>Step Move</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center space-x-1 rounded-lg border border-neutral-200 bg-white p-2 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          title="Reset Game"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Speed & AI Vision Toggles */}
      <div className="flex items-center space-x-3">
        {/* Speed Selector */}
        <div className="flex items-center space-x-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-[11px] font-mono">
          {[0.5, 1, 1.5, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`rounded px-2 py-0.5 transition-colors ${
                speed === s
                  ? "bg-neutral-900 font-bold text-white"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* AI Vision Overlay Toggle */}
        <button
          onClick={onToggleAiVision}
          className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
            aiVisionOverlay
              ? "border-neutral-300 bg-neutral-900 text-white"
              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
          }`}
          title="Toggle AI vectors & danger zone overlays"
        >
          {aiVisionOverlay ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          <span>AI Vision</span>
        </button>
      </div>
    </div>
  );
}
