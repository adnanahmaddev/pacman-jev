"use client";

import { useState } from "react";
import { Check, KeyRound, Loader2, X } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
  hasServerKey?: boolean;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
  hasServerKey = false,
}: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("https://api.typesafe.ai/v1/systemone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keyInput.trim()}`,
        },
        body: JSON.stringify({
          state: "Pacman test ping",
          model: "jev-latest",
          questions: {
            test: {
              type: "noul",
              instructions: "Is this a test?",
            },
          },
        }),
      });

      if (res.ok) {
        setTestResult("success");
      } else {
        setTestResult("error");
      }
    } catch {
      setTestResult("error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5 text-neutral-900" />
            <h3 className="font-semibold text-neutral-900">TypeSafe AI Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs leading-relaxed text-neutral-500">
            Enter your TypeSafe AI API Key to run Pac-Man with the live cloud-hosted{" "}
            <span className="font-mono font-medium text-neutral-800">jev-latest</span> System One model.
            If left blank, the app runs the built-in local calibrated simulator.
          </p>

          {hasServerKey && (
            <div className="flex items-center space-x-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>
                Server key active via <code className="font-mono text-[10px] bg-neutral-200/70 px-1 py-0.5 rounded">.env.local</code>. You can optionally override it here.
              </span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium tracking-wide text-neutral-700 uppercase">
              TypeSafe API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="apikey_..."
              className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
            />
          </div>

          {testResult === "success" && (
            <div className="flex items-center space-x-1.5 text-xs font-medium text-neutral-800">
              <Check className="h-4 w-4" />
              <span>Valid TypeSafe API key connected!</span>
            </div>
          )}

          {testResult === "error" && (
            <div className="text-xs font-medium text-neutral-800">
              Connection failed. Check your key or run in local simulator mode.
            </div>
          )}

          <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
            <button
              onClick={handleTestKey}
              disabled={isTesting || !keyInput}
              className="flex items-center space-x-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {isTesting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Test Connection</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
