"use client";

import { useState } from "react";
import { Direction, JevSystemOneDecision } from "@/types/game";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Brain,
  ChevronDown,
  ChevronRight,
  Cpu,
  Gauge,
  ShieldAlert,
  Zap,
} from "lucide-react";

interface JevInspectorProps {
  decision: JevSystemOneDecision | null;
  avgLatencyMs: number;
  totalDecisions: number;
}

export function JevInspector({
  decision,
  avgLatencyMs,
  totalDecisions,
}: JevInspectorProps) {
  const [showJsonState, setShowJsonState] = useState(false);

  if (!decision) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white p-6 text-center text-neutral-500 shadow-xs">
        <Brain className="mb-3 h-8 w-8 text-neutral-400 stroke-1" />
        <h3 className="font-semibold text-neutral-800">JEV System One Idle</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Press Play or Step to activate autonomous navigation.
        </p>
      </div>
    );
  }

  const {
    action,
    probabilities,
    confidence,
    threat_level,
    threat_confidence,
    is_cornered,
    tactical_intent,
    latency_ms,
    token_usage,
    raw_state,
    source,
  } = decision;

  const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];

  const getDirIcon = (dir: Direction) => {
    switch (dir) {
      case "UP": return <ArrowUp className="h-4 w-4" />;
      case "DOWN": return <ArrowDown className="h-4 w-4" />;
      case "LEFT": return <ArrowLeft className="h-4 w-4" />;
      case "RIGHT": return <ArrowRight className="h-4 w-4" />;
      default: return null;
    }
  };

  const getThreatLabel = (level: number) => {
    if (level < 0.8) return { label: "SAFE", color: "text-neutral-600 bg-neutral-100" };
    if (level < 1.8) return { label: "LOW THREAT", color: "text-neutral-700 bg-neutral-200" };
    if (level < 2.5) return { label: "SEVERE", color: "text-neutral-900 bg-neutral-300 font-semibold" };
    return { label: "CRITICAL", color: "text-white bg-neutral-900 font-bold" };
  };

  const threatInfo = getThreatLabel(threat_level);

  return (
    <div className="flex flex-col space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      {/* Header with Engine Source Badge */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center space-x-2">
          <Brain className="h-4 w-4 text-neutral-900" />
          <span className="font-mono text-xs font-semibold tracking-wider text-neutral-900 uppercase">
            JEV System One Engine
          </span>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${
            source === "cloud_jev"
              ? "bg-neutral-900 text-neutral-50"
              : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {source === "cloud_jev" ? "TypeSafe Cloud API" : "Local Simulator"}
        </span>
      </div>

      {/* Selected Action Card */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="text-[11px] font-medium tracking-wider text-neutral-500 uppercase">
          Autonomous Action (Choice)
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white">
              {getDirIcon(action)}
            </span>
            <div>
              <div className="font-mono text-xl font-bold tracking-tight text-neutral-900">
                MOVE {action}
              </div>
              <div className="text-xs text-neutral-500 capitalize">
                Goal: {tactical_intent.replace(/_/g, " ")}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm font-semibold text-neutral-900">
              {(confidence * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-neutral-400 uppercase">Confidence</div>
          </div>
        </div>

        {/* Confidence Meter Bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full bg-neutral-900 transition-all duration-150"
            style={{ width: `${Math.max(5, confidence * 100)}%` }}
          />
        </div>
      </div>

      {/* Probability Distribution */}
      <div>
        <div className="mb-2 text-[11px] font-medium tracking-wider text-neutral-500 uppercase">
          Directional Probabilities
        </div>
        <div className="space-y-1.5">
          {directions.map((dir) => {
            const prob = probabilities[dir] || 0;
            const pct = (prob * 100).toFixed(1);
            const isSelected = dir === action;

            return (
              <div key={dir} className="flex items-center text-xs">
                <span
                  className={`w-14 font-mono font-medium ${
                    isSelected ? "font-bold text-neutral-900" : "text-neutral-500"
                  }`}
                >
                  {dir}
                </span>
                <div className="mx-2 h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isSelected ? "bg-neutral-900" : "bg-neutral-400"
                    }`}
                    style={{ width: `${Math.max(prob > 0 ? 3 : 0, prob * 100)}%` }}
                  />
                </div>
                <span
                  className={`w-11 text-right font-mono ${
                    isSelected ? "font-bold text-neutral-900" : "text-neutral-500"
                  }`}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Threat Level & Cornered Status (Score & Noul) */}
      <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Threat Score</span>
            <ShieldAlert className="h-3.5 w-3.5 text-neutral-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-bold text-neutral-900">
              {threat_level.toFixed(1)}
            </span>
            <span className="text-[10px] text-neutral-400">/ 3.0</span>
          </div>
          <span
            className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] ${threatInfo.color}`}
          >
            {threatInfo.label}
          </span>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Cornered (Noul)</span>
            <Gauge className="h-3.5 w-3.5 text-neutral-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-bold text-neutral-900">
              {(is_cornered * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-neutral-800"
              style={{ width: `${is_cornered * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Telemetry Metrics */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
        <div className="flex items-center space-x-1">
          <Zap className="h-3.5 w-3.5 text-neutral-400" />
          <span>Latency:</span>
          <span className="font-mono font-medium text-neutral-900">{latency_ms}ms</span>
          <span className="text-[10px] text-neutral-400">(avg {avgLatencyMs}ms)</span>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[11px]">
          <span>Decisions:</span>
          <span className="font-semibold text-neutral-900">{totalDecisions}</span>
        </div>
      </div>

      {/* Collapsible JSON State Inspector */}
      <div className="border-t border-neutral-100 pt-2">
        <button
          onClick={() => setShowJsonState(!showJsonState)}
          className="flex w-full items-center justify-between py-1 text-left text-xs font-medium text-neutral-600 hover:text-neutral-900"
        >
          <span className="flex items-center space-x-1">
            <Cpu className="h-3.5 w-3.5 text-neutral-500" />
            <span>Raw JEV State Payload</span>
          </span>
          {showJsonState ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {showJsonState && (
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-neutral-900 p-2.5 font-mono text-[10px] leading-relaxed text-neutral-200">
            {JSON.stringify(raw_state, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
