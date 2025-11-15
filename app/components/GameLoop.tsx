"use client";

import { useEffect, useRef, useState } from "react";
import { generateGame } from "../actions/generate-game";
import { MusicStream } from "../music-stream";

export const GameLoop = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runnerRef = useRef<Function | null>(null);
  const [score, setScore] = useState(0);
  const [educationalText, setEducationalText] = useState<string | null>(null);
  const [musicPrompt, setMusicPrompt] = useState<string>("elevator music");
  const [token, setToken] = useState<string | null>(null);

  // Expose API so the actual game loop can be provided later
  useEffect(() => {
    (window as any).gameLoopAPI = {
      getCanvas: () => canvasRef.current,
      addScore: (score: number) => setScore((s) => s + score),
      bitmapDataURLs: {},
      buttonState: {
        A: false,
        B: false,
        UP: false,
        DOWN: false,
        LEFT: false,
        RIGHT: false,
      },
    };

    return () => {
      delete (window as any).gameLoopAPI;
    };
  }, []);

  // Run the provided runner at ~30 FPS
  useEffect(() => {
    const tick = () => {
      if (runnerRef.current) {
        try {
          runnerRef.current();
        } catch (e) {
          console.error("gameLoop runner error", e);
        }
      }
    };

    const id = setInterval(tick, 1000 / 30);
    return () => clearInterval(id);
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
    <>
      <div
        className="w-full h-full flex flex-col items-center justify-between text-white"
        style={{ aspectRatio: "3 / 4" }}
      >
        <div className="w-full text-center mt-2 text-sm text-stone-200">
          Game Title
        </div>

        <div className="w-[92%] h-[72%] bg-black flex justify-center items-center rounded-sm overflow-hidden">
          <canvas
            ref={canvasRef}
            width={160}
            height={144}
            className="w-full block"
            onClick={async () => {
              const {
                gameLoopCode,
                educationalText,
                musicTheme,
                bitmapDataURLs,
              } = await generateGame();

              setEducationalText(educationalText);
              setMusicPrompt(musicTheme);

              runnerRef.current = new Function(gameLoopCode);
              (window as any).gameLoopAPI.bitmapDataURLs = bitmapDataURLs;
            }}
          />
        </div>

        <div className="w-full text-center mb-2 text-xs text-stone-400">
          Score: {score}
        </div>

        {educationalText && (
          <div className="w-full p-2 text-center text-xs text-stone-300 bg-stone-900/50">
            {educationalText}
          </div>
        )}
      </div>
      <MusicStream initialPrompt={musicPrompt} />
    </>
  );
};
