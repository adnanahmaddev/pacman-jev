"use client";

import { Direction } from "@/types/game";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eye,
  EyeOff,
  Pause,
  Play,
  RotateCcw,
  StepForward,
} from "lucide-react";

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
  onSetSpeed: (speed: number) => void;
  onToggleAiVision: () => void;
  onManualDirection?: (dir: Direction) => void;
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
  onSetSpeed,
  onToggleAiVision,
  onManualDirection,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white border-t border-neutral-200/90 text-xs">
      {/* Left: Keyboard Shortcuts / Hints (matches reference [←][→] Lane) */}
      <div className="flex items-center space-x-2">
        {mode === "MANUAL" ? (
          <div className="flex items-center space-x-1 font-mono text-[11px] text-neutral-600">
            <span className="flex items-center space-x-0.5">
              <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[10px] font-semibold text-neutral-700 shadow-2xs">
                W
              </kbd>
              <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[10px] font-semibold text-neutral-700 shadow-2xs">
                A
              </kbd>
              <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[10px] font-semibold text-neutral-700 shadow-2xs">
                S
              </kbd>
              <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[10px] font-semibold text-neutral-700 shadow-2xs">
                D
              </kbd>
            </span>
            <span className="text-neutral-500 text-[11px] ml-1">Move</span>

            {/* Manual Clickable D-pad for mouse users */}
            {onManualDirection && (
              <div className="flex items-center space-x-0.5 ml-2 border-l border-neutral-200 pl-2">
                <button
                  onClick={() => onManualDirection("LEFT")}
                  className="flex h-5 w-5 items-center justify-center rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 active:scale-95 transition"
                  title="Left"
                >
                  <ArrowLeft className="h-2.5 w-2.5" />
                </button>
                <div className="flex flex-col space-y-0.5">
                  <button
                    onClick={() => onManualDirection("UP")}
                    className="flex h-4 w-5 items-center justify-center rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 active:scale-95 transition"
                    title="Up"
                  >
                    <ArrowUp className="h-2 w-2" />
                  </button>
                  <button
                    onClick={() => onManualDirection("DOWN")}
                    className="flex h-4 w-5 items-center justify-center rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 active:scale-95 transition"
                    title="Down"
                  >
                    <ArrowDown className="h-2 w-2" />
                  </button>
                </div>
                <button
                  onClick={() => onManualDirection("RIGHT")}
                  className="flex h-5 w-5 items-center justify-center rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 active:scale-95 transition"
                  title="Right"
                >
                  <ArrowRight className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-neutral-500">
            <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700 shadow-2xs">
              SPACE
            </kbd>
            <span className="text-[11px] text-neutral-500">Pause / Resume</span>
          </div>
        )}
      </div>

      {/* Right: Controls & Speed Multipliers (matches reference SPACE Pause / controls) */}
      <div className="flex items-center space-x-2.5">
        {/* Speed Selector (0.5x, 1x, 2x, 3x) */}
        <div className="flex items-center space-x-0.5 rounded-lg border border-neutral-200 bg-neutral-100/80 p-0.5 text-[10px] font-mono">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`rounded px-1.5 py-0.5 transition-colors cursor-pointer ${
                speed === s
                  ? "bg-neutral-900 font-bold text-white shadow-2xs"
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
          className={`flex items-center space-x-1 rounded-lg border px-2 py-1 text-xs cursor-pointer transition-colors ${
            aiVisionOverlay
              ? "border-neutral-300 bg-neutral-900 text-white"
              : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
          }`}
          title="Toggle AI vector rays & threat zones"
        >
          {aiVisionOverlay ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
          <span className="hidden sm:inline text-[11px]">Vision</span>
        </button>

        {/* Step Button */}
        {(isPaused || mode === "STEP") && (
          <button
            onClick={onStep}
            disabled={isStepPending}
            className="flex items-center space-x-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer transition-colors"
            title="Step one junction decision forward"
          >
            <StepForward className="h-3 w-3" />
            <span className="text-[11px]">Step</span>
          </button>
        )}

        {/* Play / Pause Toggle Button */}
        <button
          onClick={isPaused ? onPlay : onPause}
          className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer shadow-2xs transition-colors ${
            isPaused
              ? "bg-neutral-900 text-white hover:bg-neutral-800"
              : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
          }`}
        >
          {isPaused ? (
            <>
              <Play className="h-3 w-3 fill-current" />
              <span className="text-[11px]">Play</span>
            </>
          ) : (
            <>
              <Pause className="h-3 w-3 fill-current" />
              <span className="text-[11px]">Pause</span>
            </>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="flex items-center justify-center h-7 w-7 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer transition-colors"
          title="Reset Maze & Scores"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
