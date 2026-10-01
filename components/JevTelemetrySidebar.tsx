"use client";

import { useState } from "react";
import { Direction, JevSystemOneDecision } from "@/types/game";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Brain,
  Check,
  Copy,
  Cpu,
  ShieldAlert,
  Zap,
} from "lucide-react";

interface JevTelemetrySidebarProps {
  decision: JevSystemOneDecision | null;
  mode: "AUTONOMOUS" | "MANUAL" | "STEP";
  onSetMode: (mode: "AUTONOMOUS" | "MANUAL" | "STEP") => void;
  avgLatencyMs: number;
  isPaused: boolean;
  isStepPending?: boolean;
  hasApiKey?: boolean;
  onOpenApiKeyModal?: () => void;
}

export function JevTelemetrySidebar({
  decision,
  mode,
  onSetMode,
  avgLatencyMs,
  isPaused,
  isStepPending = false,
  hasApiKey = false,
  onOpenApiKeyModal,
}: JevTelemetrySidebarProps) {
  const [copied, setCopied] = useState(false);

  const isAutopilot = mode === "AUTONOMOUS";
  const isCloudEngine = decision ? decision.source === "cloud_jev" : hasApiKey;

  const driverName = isCloudEngine ? "JEV System One" : "Heuristic Simulator";
  const driverSubtitle = isCloudEngine
    ? "Autonomous reflex pipeline"
    : "Calibrated offline fallback";
  const modelName = isCloudEngine ? "jev-latest" : "local-heuristic-v1";

  const handleToggleAutopilot = () => {
    onSetMode(isAutopilot ? "MANUAL" : "AUTONOMOUS");
  };

  const handleCopyJson = () => {
    if (!decision) return;
    const jsonToCopy = {
      model: modelName,
      driver: driverName,
      answers: {
        action: {
          type: "choice",
          choice: decision.action,
          probabilities: decision.probabilities,
          confidence: Number(decision.confidence.toFixed(3)),
        },
        tactical_intent: {
          choice: decision.tactical_intent,
        },
        threat_level: {
          score: Number(decision.threat_level.toFixed(1)),
        },
        is_cornered: {
          value: decision.is_cornered,
        },
      },
      usage: decision.token_usage || {
        input_tokens: isCloudEngine ? 184 : 0,
        output_tokens: isCloudEngine ? 1 : 0,
      },
      latency_ms: decision.latency_ms,
      source: decision.source,
    };

    navigator.clipboard.writeText(JSON.stringify(jsonToCopy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDirIcon = (dir: Direction) => {
    switch (dir) {
      case "UP":
        return <ArrowUp className="h-3 w-3" />;
      case "DOWN":
        return <ArrowDown className="h-3 w-3" />;
      case "LEFT":
        return <ArrowLeft className="h-3 w-3" />;
      case "RIGHT":
        return <ArrowRight className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getThreatLabel = (threat: number) => {
    if (threat < 0.8) return { text: "Safe", cls: "text-neutral-600 bg-neutral-100" };
    if (threat < 1.8) return { text: "Low Danger", cls: "text-neutral-700 bg-neutral-200" };
    if (threat < 2.5) return { text: "Severe", cls: "text-neutral-900 bg-neutral-300 font-semibold" };
    return { text: "Critical Ambush", cls: "text-white bg-neutral-900 font-bold" };
  };

  const directions: { dir: Direction; label: string; arrow: string }[] = [
    { dir: "UP", label: "Up", arrow: "↑" },
    { dir: "DOWN", label: "Down", arrow: "↓" },
    { dir: "LEFT", label: "Left", arrow: "←" },
    { dir: "RIGHT", label: "Right", arrow: "→" },
  ];

  // Prepare JSON preview snippet
  const jsonSnippet = decision
    ? JSON.stringify(
        {
          model: modelName,
          driver: driverName,
          answers: {
            move: {
              type: "choice",
              choice: decision.action.toLowerCase(),
              probabilities: decision.probabilities,
              confidence: Number(decision.confidence.toFixed(3)),
            },
            tactical_intent: decision.tactical_intent,
            threat_level: Number(decision.threat_level.toFixed(1)),
          },
          usage: decision.token_usage || {
            input_tokens: isCloudEngine ? 184 : 0,
            output_tokens: isCloudEngine ? 1 : 0,
          },
          latency_ms: decision.latency_ms,
          source: decision.source,
        },
        null,
        2
      )
    : JSON.stringify(
        {
          driver: driverName,
          model: modelName,
          status: isPaused ? "standby" : "evaluating",
          mode: isAutopilot ? "autonomous" : "manual",
          latency_ms: avgLatencyMs || 0,
          note: isCloudEngine
            ? "Real-time decision telemetry will stream here upon first junction."
            : "Running in offline fallback mode with calibrated heuristic simulator.",
        },
        null,
        2
      );

  return (
    <aside className="w-full lg:w-[410px] shrink-0 flex flex-col justify-between h-full select-none gap-3.5">
      {/* 1. Driver / Agent Card */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-4.5 shadow-2xs">
        <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-3">
          Driver
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white font-mono text-base font-bold shadow-2xs">
              {isCloudEngine ? (
                <Brain className="h-5 w-5 stroke-[1.75]" />
              ) : (
                <Cpu className="h-5 w-5 stroke-[1.75]" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-neutral-900 leading-snug">
                {driverName}
              </h2>
              <p className="text-xs text-neutral-500">{driverSubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={!isCloudEngine ? onOpenApiKeyModal : undefined}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase transition-colors ${
              isCloudEngine
                ? "bg-neutral-900 text-white font-semibold cursor-default"
                : "bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200/70 cursor-pointer"
            }`}
            title={
              isCloudEngine
                ? "Running with TypeSafe AI JEV System One"
                : "Running in local fallback mode. Click to configure API key"
            }
          >
            {isCloudEngine ? "Cloud JEV" : "Local Sim"}
          </button>
        </div>

        {/* Toggle Switch Row */}
        <div className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3.5 py-2.5">
          <span className="text-xs font-semibold text-neutral-800">
            {isCloudEngine ? "JEV Autonomous Driving" : "Autonomous Driving"}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={isAutopilot}
            onClick={handleToggleAutopilot}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
              isAutopilot ? "bg-neutral-900" : "bg-neutral-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isAutopilot ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Real-Time Decision Card */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-4.5 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-sm font-bold tracking-tight text-neutral-900">
            Decision
          </span>
          <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-neutral-400">
            {isStepPending
              ? "REQUESTING"
              : isPaused
              ? "STANDBY"
              : decision
              ? "EVALUATING"
              : "READY"}
          </span>
        </div>

        {/* Target Move & Intent */}
        <div className="space-y-1.5 pb-3 mb-3 border-b border-neutral-200/70">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Target move</span>
            <div className="flex items-center space-x-1.5 font-bold text-neutral-900 text-sm">
              {decision ? (
                <>
                  <span>{decision.action}</span>
                  <span className="flex items-center justify-center h-4.5 w-4.5 rounded bg-neutral-100 text-neutral-800">
                    {getDirIcon(decision.action)}
                  </span>
                </>
              ) : (
                <span className="text-neutral-400 text-xs font-normal">Pending junction</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Tactical intent</span>
            <span className="font-mono text-[11px] font-medium text-neutral-800 capitalize">
              {decision?.tactical_intent ? decision.tactical_intent.replace(/_/g, " ") : "Normal patrol"}
            </span>
          </div>
        </div>

        {/* Directional Probability Meters (matching reference style) */}
        <div className="space-y-2 mb-4">
          {directions.map(({ dir, label, arrow }) => {
            const prob = decision?.probabilities[dir] ?? 0;
            const pct = Math.round(prob * 100);
            const isChosen = decision?.action === dir;

            return (
              <div key={dir} className="flex items-center text-xs">
                <span
                  className={`w-18 shrink-0 font-mono text-xs flex items-center space-x-1 ${
                    isChosen ? "font-bold text-neutral-900" : "text-neutral-500"
                  }`}
                >
                  <span className="w-3 text-center">{arrow}</span>
                  <span>{label}</span>
                </span>

                <div className="flex-1 mx-2.5 h-2.5 rounded-full bg-neutral-100 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ease-out ${
                      isChosen ? "bg-neutral-900" : "bg-neutral-300"
                    }`}
                    style={{ width: `${Math.max(pct, prob > 0 ? 3 : 0)}%` }}
                  />
                </div>

                <span
                  className={`w-10 text-right font-mono text-xs ${
                    isChosen ? "font-bold text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Mini Status Footnotes */}
        <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-neutral-500">Threat:</span>
            {decision ? (
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] ${
                  getThreatLabel(decision.threat_level).cls
                }`}
              >
                {getThreatLabel(decision.threat_level).text}
              </span>
            ) : (
              <span className="text-neutral-400">None</span>
            )}
          </div>

          <div className="flex items-center space-x-1 text-neutral-500 font-mono">
            <Zap className="h-3 w-3 text-neutral-400" />
            <span>{decision?.latency_ms ?? avgLatencyMs ?? 0}ms</span>
          </div>
        </div>
      </div>

      {/* 3. Raw State & JSON Telemetry Block (Matching reference code view) */}
      <div className="relative rounded-2xl border border-neutral-300 bg-neutral-50/70 p-4 shadow-2xs flex-1 flex flex-col justify-between min-h-[200px]">
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-xs font-semibold text-neutral-400">
            &#123; telemetry &#125;
          </div>

          <button
            onClick={handleCopyJson}
            className="flex items-center space-x-1 rounded-md px-2 py-0.5 text-[11px] font-mono text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900 cursor-pointer transition-colors"
            title="Copy Raw State JSON"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-neutral-900" />
                <span className="text-neutral-900 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre className="flex-1 font-mono text-[11px] leading-relaxed text-neutral-700 overflow-x-auto min-h-[140px] max-h-[240px] overflow-y-auto select-all scrollbar-thin">
          <code>{jsonSnippet}</code>
        </pre>
      </div>
    </aside>
  );
}
