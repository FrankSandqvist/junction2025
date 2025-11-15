"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewGamePage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [status, setStatus] = useState<any>({
    wikipediaFetched: false,
    title: null,
    gameId: null,
    coverComplete: false,
    planComplete: false,
    codeComplete: false,
    bitmapsComplete: false,
    sfxComplete: false,
    completed: false,
  });
  const controllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const start = async () => {
    setRunning(true);
    setLogs([]);
    setStatus((s: any) => ({
      ...s,
      wikipediaFetched: false,
      planComplete: false,
      coverComplete: false,
      codeComplete: false,
      bitmapsComplete: false,
      sfxComplete: false,
      completed: false,
    }));

    try {
      const ac = new AbortController();
      controllerRef.current = ac;
      const res = await fetch("/api/generate-game", {
        method: "POST",
        signal: ac.signal,
      });
      if (!res.body) {
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            setLogs((prev) => [...prev, obj]);
            // merge event flags and metadata into status
            setStatus((s: any) => ({ ...s, ...obj }));
            // navigate when completed reported
            if (obj.completed && obj.gameId) {
              setTimeout(() => router.push(`/game/${obj.gameId}`), 1200);
            }
          } catch (e) {
            // ignore malformed chunk
          }
        }
      }
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        // aborted by user
      } else {
        console.error(err);
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create New Game</h1>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
        onClick={start}
        disabled={running}
      >
        {running ? "Running…" : "Start"}
      </button>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-4">
        <ul className="space-y-3">
          <li className="text-sm">
            <span className="font-medium">Wikipedia fetched:</span>{" "}
            {status.wikipediaFetched ? "✅" : "…"}
          </li>
          <li className="text-sm">
            <span className="font-medium">Plan generated:</span>{" "}
            {status.planComplete ? "✅" : "…"}
            {status.title && (
              <div className="font-semibold">{status.title}</div>
            )}
            {status.gameIdea && (
              <div className="italic">Idea: {status.gameIdea}</div>
            )}
            {status.howToPlay && <div>How to play: {status.howToPlay}</div>}
            {status.educationalText && (
              <div className="text-xs text-gray-600">
                {status.educationalText}
              </div>
            )}
          </li>
          <li className="text-sm">
            <span className="font-medium">Cover uploaded:</span>{" "}
            {status.coverComplete ? "✅" : "…"}
          </li>
          <li className="text-sm">
            <span className="font-medium">Code generated:</span>{" "}
            {status.codeComplete ? "✅" : "…"}
          </li>
          <li className="text-sm">
            <span className="font-medium">Bitmaps generated:</span>{" "}
            {status.bitmapsComplete ? "✅" : "…"}
          </li>
          <li className="text-sm">
            <span className="font-medium">SFX generated:</span>{" "}
            {status.sfxComplete ? "✅" : "…"}
          </li>
          <li className="text-sm">
            <span className="font-medium">Completed:</span>{" "}
            {status.completed ? "✅" : "…"}
          </li>
          {status.gameId && (
            <li className="text-xs text-gray-500">Game ID: {status.gameId}</li>
          )}
        </ul>

        {logs.length > 0 && (
          <div className="mt-4 text-xs text-gray-600">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(logs.slice(-6), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
