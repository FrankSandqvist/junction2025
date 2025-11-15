"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckIcon,
  CodeIcon,
  GamepadIcon,
  ImageIcon,
  Loader,
  SpeakerIcon,
} from "lucide-react";

export default function NewGamePage() {
  const [status, setStatus] = useState<any>({
    wikipediaFetched: false,
    wikipediaArticle: null,
    wikipediaThumbnail: null,
    wikipediaDescription: null,
    title: null,
    gameIdea: null,
    gameId: null,
    coverComplete: false,
    planComplete: false,
    codeComplete: false,
    bitmapsComplete: false,
    sfxComplete: false,
    completed: false,
  });
  const [musicTheme, setMusicTheme] = useState<string>("idle");
  const controllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const start = async () => {
    try {
      const ac = new AbortController();
      controllerRef.current = ac;
      const res = await fetch("/api/generate-game", {
        method: "POST",
        signal: ac.signal,
      });
      if (!res.body) {
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
            setStatus((s: any) => ({ ...s, ...obj }));
            if (obj.musicTheme) {
              setMusicTheme(obj.musicTheme);
            }
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
    }
  };

  useEffect(() => {
    start();
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const completionCount = Object.values(status).filter(
      (v) => v === true
    ).length;
    (window as any).musicAPI?.setMusicTheme(
      musicTheme +
        ": " +
        {
          0: "idle",
          1: "building_tension",
          2: "tense",
          3: "action",
          4: "climax",
          5: "victory",
          6: "celebration",
        }[completionCount]
    );
  }, [status, musicTheme]);

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col items-stretch gap-6">
      <h1 className="text-5xl text-center mb-4 text-teal-200 font-jacquard">
        New LoreDash
      </h1>
      <div className="flex gap-4">
        <div className={`border-2 flex w-full p-4 ${status.wikipediaFetched ? 'border-teal-200/50' : 'border-teal-200 animate-pulse'}`}>
          <div className="grow">
            {status.wikipediaFetched ? (
              <div className="flex flex-col items-start">
                <div className="font-jacquard text-6xl text-white -mt-10 drop-shadow-lg">
                  {status.wikipediaArticle}
                </div>
                <div className="text-md text-teal-200">
                  {status.wikipediaDescription}
                </div>
              </div>
            ) : (
              <div className="font-jacquard text-3xl text-teal-200">
                Looking for something interesting...
              </div>
            )}
          </div>
          <div className="relative">
            <div className="bg-teal-400 mix-blend-color-burn absolute inset-0" />
            {status.wikipediaThumbnail ? (
              <Image
                src={status.wikipediaThumbnail}
                alt="Image"
                width={128}
                height={128}
                className="flex-[8rem] h-32 object-cover"
              />
            ) : (
              <Image
                src="/wikipedia.svg"
                alt="Wikipedia Logo"
                width={128}
                height={128}
                className="flex-[8rem] h-32"
              />
            )}
          </div>
        </div>
      </div>
      <div
        className={`flex flex-col gap-4 duration-500 w-full ${
          status.wikipediaFetched ? "translate-x-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="border-2 border-teal-200 flex w-ful items-start p-4">
          {status.planComplete ? (
            <div className="flex flex-col items-start">
              <div className="font-jacquard text-3xl text-teal-200">
                {status.title}
              </div>
              <div className="text-md text-teal-200">{status.gameIdea}</div>
            </div>
          ) : (
            <div className="text-teal-200 text-2xl font-jacquard flex items-center gap-2 grow">
              <GamepadIcon />
              <div className="grow">Game rules</div>
              <Loader className="animate-spin text-teal-200" />
            </div>
          )}
          {status.coverComplete ? (
            <div className="relative">
              <div className="bg-teal-400 mix-blend-color absolute inset-0" />
              <Image
                src={
                  process.env.NEXT_PUBLIC_BLOB_BASE_URL +
                  `${status.gameId}-cover.png`
                }
                unoptimized
                alt="Game Cover"
                width={128}
                height={128}
                className="object-contain h-32 min-w-32"
              />
            </div>
          ) : (
            <Loader className="animate-spin text-teal-200" />
          )}
        </div>
        <div className="flex flex-row gap-4 ">
          <div className="border-2 border-teal-200 flex w-full p-4">
            <div className="text-teal-200 text-2xl font-jacquard flex items-center gap-2 grow">
              <ImageIcon />
              Bitmaps
            </div>
            {status.bitmapsComplete ? (
              <div className="font-jacquard text-2xl text-teal-200">
                <CheckIcon />
              </div>
            ) : (
              <Loader className="animate-spin text-teal-200" />
            )}
          </div>
          <div className="border-2 border-teal-200 flex w-full p-4">
            <div className="text-teal-200 text-2xl font-jacquard flex items-center gap-2 grow">
              <SpeakerIcon />
              Sound FX
            </div>

            {status.sfxComplete ? (
              <div className="font-jacquard text-2xl text-teal-200">
                <CheckIcon />
              </div>
            ) : (
              <Loader className="animate-spin text-teal-200" />
            )}
          </div>
        </div>
        <div className="border-2 border-teal-200 flex flex-col w-full p-4">
          <div className="flex gap-4 items-center">
            <div className="text-teal-200 text-2xl font-jacquard flex items-center gap-2 grow">
              <CodeIcon />
              Coding with Gemini Pro
            </div>

            {status.codeComplete ? (
              <div className="font-jacquard text-2xl text-teal-200">
                <CheckIcon />
              </div>
            ) : (
              <Loader className="animate-spin text-teal-200" />
            )}
          </div>
          <div className="text-teal-200">
            Be patient, good things take time! This time, up to a minute.
          </div>
        </div>
      </div>
      {/*<button
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
      </div>*/}
    </div>
  );
}
