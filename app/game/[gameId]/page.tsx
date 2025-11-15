"use client";

import { GameLoop } from "@/components/GameLoop";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [pressed, setPressed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    const { gameId } = await params;

    const [game, code] = await Promise.all([
      fetch(
        process.env.NEXT_PUBLIC_BLOB_BASE_URL + `index-${gameId}.json`
      ).then((res) => res.json()),
      fetch(process.env.NEXT_PUBLIC_BLOB_BASE_URL + `${gameId}-code.js`).then(
        (res) => res.text()
      ),
    ]);

    setGameInfo(game);

    await (window as any).musicAPI.setMusicTheme(game.musicTheme);
    (window as any).gameLoopAPI = {
      getCanvas: () => {
        return document.getElementById("game-canvas") as HTMLCanvasElement;
      },
      getBitmapUrl: (id: string) => {
        return `${process.env.NEXT_PUBLIC_BLOB_BASE_URL}${gameId}-bitmap-${id}.png`;
      },
      playSound: (id: string) => {
        const audio = new Audio(
          `${process.env.NEXT_PUBLIC_BLOB_BASE_URL}${gameId}-sfx-${id}.mp3`
        );
        audio.volume = 0.5;
        audio.play();
      },
      buttonState: {
        A: false,
        B: false,
        UP: false,
        DOWN: false,
        LEFT: false,
        RIGHT: false,
      },
      tick: new Function(code),
    };
  };

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
    <div className="h-full p-6 max-w-2xl mx-auto bg-black/20">
      <Image
      unoptimized
        src={process.env.NEXT_PUBLIC_BLOB_BASE_URL + `${gameInfo?.id}-cover.png`}
        alt="Game Cover"
        fill
        className="absolute top-0 w-full h-full object-top object-contain opacity-10 pointer-events-none"
      />
      {gameInfo?.title}

      <h1 className="font-jacquard text-center text-5xl text-teal-200">Test</h1>
      
      <GameLoop />

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
    </div>
  );
}
