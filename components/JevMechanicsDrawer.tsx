"use client";

import { useEffect, useState } from "react";
import { JevSystemOneDecision } from "@/types/game";
import { X, Cpu, Copy, Check, ShieldAlert, Navigation, Layers, Compass } from "lucide-react";

interface JevMechanicsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decision: JevSystemOneDecision | null;
  avgLatencyMs: number;
}

export function JevMechanicsDrawer({
  isOpen,
  onClose,
  decision,
  avgLatencyMs,
}: JevMechanicsDrawerProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    if (!decision?.raw_state) return;
    navigator.clipboard.writeText(JSON.stringify(decision.raw_state, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed & Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-50 flex h-full w-full max-w-md flex-col bg-white border-l border-neutral-200 shadow-2xl transition-transform animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 bg-neutral-50/70">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-900 text-white font-mono text-xs font-bold">
              ⚡
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold text-neutral-900 uppercase tracking-tight">
                JEV System One Mechanics
              </h2>
              <p className="text-[11px] text-neutral-500">
                Model: <span className="font-mono font-medium text-neutral-800">jev-latest</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
            title="Close Drawer (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-neutral-700">
          {/* Architecture Overview */}
          <section className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5" />
              <span>Multi-Primitive Evaluation</span>
            </div>
            <p className="text-xs leading-relaxed text-neutral-600">
              Unlike generative language models that produce sequential text tokens, TypeSafe AI&apos;s
              <strong className="text-neutral-900"> JEV</strong> System One model evaluates state and produces calibrated, typed categorical decisions and probability distributions simultaneously.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                <div className="text-[10px] text-neutral-400 uppercase">Action Primitive</div>
                <div className="font-bold text-neutral-900">Choice: UP / DOWN / LEFT / RIGHT</div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                <div className="text-[10px] text-neutral-400 uppercase">Threat Scale</div>
                <div className="font-bold text-neutral-900">Score: 0.0 – 3.0</div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                <div className="text-[10px] text-neutral-400 uppercase">Tactical Intent</div>
                <div className="font-bold text-neutral-900">Choice: farm / evade / hunt</div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                <div className="text-[10px] text-neutral-400 uppercase">Predictive Raycast</div>
                <div className="font-bold text-neutral-900">Zero Stutter Ahead</div>
              </div>
            </div>
          </section>

          {/* Ghost Visual Identity Legend */}
          <section className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5" />
              <span>Ghost AI Geometric Identities</span>
            </div>
            <p className="text-xs leading-relaxed text-neutral-600">
              In this monochromatic aesthetic, ghosts are distinguished through bespoke geometric textures:
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="flex items-center space-x-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                <span className="h-3 w-3 rounded-full bg-neutral-900 inline-block shrink-0" />
                <div>
                  <div className="font-bold text-neutral-900">Blinky (Shadow)</div>
                  <div className="text-[10px] text-neutral-500">Solid Black • Direct Chase</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                <span className="h-3 w-3 rounded-full border border-dashed border-neutral-700 bg-neutral-200 inline-block shrink-0" />
                <div>
                  <div className="font-bold text-neutral-900">Pinky (Speedy)</div>
                  <div className="text-[10px] text-neutral-500">Dotted • 4-Tile Ambush</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                <span className="h-3 w-3 rounded-full bg-neutral-600 inline-block shrink-0" />
                <div>
                  <div className="font-bold text-neutral-900">Inky (Bashful)</div>
                  <div className="text-[10px] text-neutral-500">Striped • Vector Flank</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                <span className="h-3 w-3 rounded-full bg-neutral-400 inline-block shrink-0" />
                <div>
                  <div className="font-bold text-neutral-900">Clyde (Pokey)</div>
                  <div className="text-[10px] text-neutral-500">Hatched • Proximity Flee</div>
                </div>
              </div>
            </div>
          </section>

          {/* Live Decision Telemetry & Raw JSON Payload */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                <Cpu className="h-3.5 w-3.5" />
                <span>Live State Payload</span>
              </div>
              {decision?.raw_state && (
                <button
                  onClick={handleCopyJson}
                  className="flex items-center space-x-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {decision ? (
              <div className="space-y-2.5">
                {/* Latency & Confidence Metrics */}
                <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-mono">
                  <span className="text-neutral-500">Decision Latency:</span>
                  <span className="font-bold text-neutral-900">{decision.latency_ms.toFixed(0)} ms</span>
                </div>

                {/* Preformatted JSON Tree */}
                <div className="relative rounded-xl border border-neutral-800 bg-neutral-950 p-3 shadow-inner">
                  <pre className="max-h-72 overflow-auto font-mono text-[10.5px] leading-relaxed text-neutral-300 scrollbar-thin">
                    {JSON.stringify(decision.raw_state, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-xs text-neutral-500">
                <Navigation className="mx-auto mb-2 h-5 w-5 text-neutral-400 animate-pulse" />
                Start gameplay or navigate a junction to inspect live JEV System One payload data.
              </div>
            )}
          </section>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-neutral-200 px-5 py-3 bg-neutral-50 flex items-center justify-between text-[11px] text-neutral-500">
          <span>TypeSafe AI System One</span>
          <button
            onClick={onClose}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
