"use client";

import { Direction, JevSystemOneDecision } from "@/types/game";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Brain, ShieldAlert, Zap } from "lucide-react";

interface JevStatusBarProps {
  decision: JevSystemOneDecision | null;
  avgLatencyMs: number;
}

export function JevStatusBar({ decision, avgLatencyMs }: JevStatusBarProps) {
  if (!decision) {
    return (
      <div className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500 shadow-xs">
        <div className="flex items-center space-x-2">
          <Brain className="h-4 w-4 text-neutral-400 stroke-1" />
          <span className="font-mono text-xs font-semibold text-neutral-800">
            JEV System One Standby
          </span>
        </div>
        <div className="text-[11px] text-neutral-400">
          Press Play or Step to activate autonomous navigation
        </div>
      </div>
    );
  }

  const {
    action,
    probabilities,
    confidence,
    threat_level,
    tactical_intent,
    latency_ms,
    source,
  } = decision;

  const getDirIcon = (dir: Direction) => {
    switch (dir) {
      case "UP": return <ArrowUp className="h-3.5 w-3.5" />;
      case "DOWN": return <ArrowDown className="h-3.5 w-3.5" />;
      case "LEFT": return <ArrowLeft className="h-3.5 w-3.5" />;
      case "RIGHT": return <ArrowRight className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const getThreatBadge = (level: number) => {
    if (level < 0.8) return { label: "Safe", cls: "bg-neutral-100 text-neutral-700" };
    if (level < 1.8) return { label: "Low Threat", cls: "bg-neutral-200 text-neutral-800" };
    if (level < 2.5) return { label: "Severe", cls: "bg-neutral-300 text-neutral-900 font-semibold" };
    return { label: "Critical", cls: "bg-neutral-900 text-white font-bold" };
  };

  const threatBadge = getThreatBadge(threat_level);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 shadow-xs">
      {/* Engine & Action */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-neutral-900">
          <Brain className="h-4 w-4" />
          <span>JEV:</span>
        </div>

        <div className="flex items-center space-x-1.5 rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
          {getDirIcon(action)}
          <span>{action}</span>
        </div>

        <div className="flex items-center space-x-1 text-xs text-neutral-500">
          <span className="font-mono font-semibold text-neutral-900">
            {(confidence * 100).toFixed(0)}%
          </span>
          <span className="text-[10px] text-neutral-400 uppercase">Certainty</span>
        </div>

        <span className="hidden sm:inline text-neutral-300">|</span>

        <div className="hidden sm:flex items-center text-xs text-neutral-500 capitalize">
          <span>Goal: <strong className="text-neutral-800">{tactical_intent.replace(/_/g, " ")}</strong></span>
        </div>
      </div>

      {/* Probabilities Mini-bar */}
      <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono">
        {(["UP", "DOWN", "LEFT", "RIGHT"] as Direction[]).map((d) => {
          const p = (probabilities[d] || 0) * 100;
          const isChosen = d === action;
          return (
            <span
              key={d}
              className={`rounded px-1.5 py-0.5 ${
                isChosen
                  ? "bg-neutral-900 font-bold text-white"
                  : p > 0
                  ? "bg-neutral-100 text-neutral-700"
                  : "text-neutral-400"
              }`}
            >
              {d[0]}:{p.toFixed(0)}%
            </span>
          );
        })}
      </div>

      {/* Threat & Telemetry */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1">
          <ShieldAlert className="h-3.5 w-3.5 text-neutral-500" />
          <span className={`rounded px-1.5 py-0.5 text-[10px] ${threatBadge.cls}`}>
            {threatBadge.label} ({threat_level.toFixed(1)})
          </span>
        </div>

        <div className="flex items-center space-x-1 text-neutral-400">
          <Zap className="h-3 w-3" />
          <span className="font-mono text-[11px] text-neutral-600">{latency_ms}ms</span>
        </div>

        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide ${
            source === "cloud_jev"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {source === "cloud_jev" ? "Cloud JEV" : "Local Sim"}
        </span>
      </div>
    </div>
  );
}
