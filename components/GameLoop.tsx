"use client";

import { useEffect, useRef, useState } from "react";

export const GameLoop = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [educationalText, setEducationalText] = useState<string | null>(null);
  const [musicPrompt, setMusicPrompt] = useState<string>("elevator music");

  // Expose API so the actual game loop can be provided later
  useEffect(() => {
    const runnerTimer = setInterval(() => {
      (window as any).gameLoopAPI?.tick?.();
    }, 1000 / 30);

    return () => {
      delete (window as any).gameLoopAPI;
      clearInterval(runnerTimer);
    };
  }, []);

  // Basic canvas setup placeholder
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // Initialize a simple background to show the canvas is mounted
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#9be";
    ctx.font = "14px monospace";
    ctx.fillText("Canvas ready", 10, 24);
  }, []);

  return (
    <div className="relative bg-black flex justify-center items-center rounded-sm overflow-hidden">
      <div className="absolute inset-0 bg-teal-600 mix-blend-color" />
      <canvas
        ref={canvasRef}
        id="game-canvas"
        width={320}
        height={288}
        className="w-full block"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
};
