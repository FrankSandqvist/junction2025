"use client";

import { useEffect, useRef, useState } from "react";
import { GameLoop } from "./GameLoop";

export const GameboyFrame = () => {
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dummy handlers for button actions
  const handleButtonDown = (btn: string) => {
    (window as any).gameLoopAPI.buttonState[btn.toUpperCase()] = true;
  };

  const handleButtonUp = (btn: string) => {
    (window as any).gameLoopAPI.buttonState[btn.toUpperCase()] = false;
  };

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          handleButtonDown("UP");
          break;
        case "arrowdown":
        case "s":
          handleButtonDown("DOWN");
          break;
        case "arrowleft":
        case "a":
          handleButtonDown("LEFT");
          break;
        case "arrowright":
        case "d":
          handleButtonDown("RIGHT");
          break;
        case "z":
        case "x":
        case "j":
          handleButtonDown("B");
          break;
        case "k":
        case "\u0020": // space
          handleButtonDown("A");
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          handleButtonUp("UP");
          break;
        case "arrowdown":
        case "s":
          handleButtonUp("DOWN");
          break;
        case "arrowleft":
        case "a":
          handleButtonUp("LEFT");
          break;
        case "arrowright":
        case "d":
          handleButtonUp("RIGHT");
          break;
        case "z":
        case "x":
        case "j":
          handleButtonUp("B");
          break;
        case "k":
        case "\u0020": // space
          handleButtonUp("A");
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keydown", onKeyUp);
    };
  }, []);

  return (
    <div className="p-6">
      <div
        ref={containerRef}
        className="relative mx-auto w-[360px] max-w-[92vw] bg-stone-200 dark:bg-stone-900 rounded-3xl shadow-2xl ring-1 ring-stone-300 dark:ring-stone-700 overflow-hidden"
        style={{ aspectRatio: "9 / 16" }}
      >
        {/* Top speaker area */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="w-16 h-3 bg-stone-300 dark:bg-stone-800 rounded-full" />
          <div className="w-2 h-2 bg-red-500 rounded-full shadow-inner" />
        </div>

        {/* Screen */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-14 w-[85%] bg-[#9fbf7f] dark:bg-black/80 rounded-lg p-2 shadow-inner"
          style={{ aspectRatio: "3 / 4", maxHeight: "72%" }}
        >
          <div className="w-full h-full bg-black rounded-sm overflow-hidden flex items-center justify-center">
            <GameLoop />
          </div>
        </div>

        {/* Controls area */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          {/* D-PAD */}
          <div className="w-32 h-32 relative">
            <button
              aria-label="up"
              onMouseDown={() => handleButtonDown("up")}
              onMouseUp={() => handleButtonUp("up")}
              className={`absolute left-1/2 -translate-x-1/2 top-0 w-12 h-12 rounded bg-stone-300 dark:bg-stone-800 active:scale-95 transform transition-transform ${
                pressed["up"] ? "scale-95" : ""
              }`}
            />
            <button
              aria-label="down"
              onMouseDown={() => handleButtonDown("down")}
              onMouseUp={() => handleButtonUp("down")}
              className={`absolute left-1/2 -translate-x-1/2 bottom-0 w-12 h-12 rounded bg-stone-300 dark:bg-stone-800 active:scale-95 transform transition-transform ${
                pressed["down"] ? "scale-95" : ""
              }`}
            />
            <button
              aria-label="left"
              onMouseDown={() => handleButtonDown("left")}
              onMouseUp={() => handleButtonUp("left")}
              className={`absolute top-1/2 -translate-y-1/2 left-0 w-12 h-12 rounded bg-stone-300 dark:bg-stone-800 active:scale-95 transform transition-transform ${
                pressed["left"] ? "scale-95" : ""
              }`}
            />
            <button
              aria-label="right"
              onMouseDown={() => handleButtonDown("right")}
              onMouseUp={() => handleButtonUp("right")}
              className={`absolute top-1/2 -translate-y-1/2 right-0 w-12 h-12 rounded bg-stone-300 dark:bg-stone-800 active:scale-95 transform transition-transform ${
                pressed["right"] ? "scale-95" : ""
              }`}
            />
            {/* center pivot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-stone-400 dark:bg-stone-700 rounded-full shadow-inner" />
          </div>

          {/* Buttons A/B */}
          <div className="flex flex-col items-center gap-4 mr-2">
            <div className="flex gap-4 items-center">
              <button
                aria-label="b"
                onMouseDown={() => handleButtonDown("b")}
                onMouseUp={() => handleButtonUp("b")}
                className={`w-14 h-14 rounded-full bg-red-500 shadow-lg text-white active:scale-95 transform transition-transform ${
                  pressed["b"] ? "scale-95" : ""
                }`}
              >
                B
              </button>
              <button
                aria-label="a"
                onMouseDown={() => handleButtonDown("a")}
                onMouseUp={() => handleButtonDown("a")}
                className={`w-14 h-14 rounded-full bg-green-600 shadow-lg text-white active:scale-95 transform transition-transform ${
                  pressed["a"] ? "scale-95" : ""
                }`}
              >
                A
              </button>
            </div>

            <div className="text-xs text-stone-600 dark:text-stone-400">
              A: K / Space, B: Z / J
            </div>
          </div>
        </div>

        {/* Branding / bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-stone-500 dark:text-stone-400">
          mini-gameboy
        </div>
      </div>
    </div>
  );
};
