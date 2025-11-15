"use client";
import { useEffect, useRef, useState } from "react";
import {
  GoogleGenAI,
  type LiveMusicServerMessage,
  type LiveMusicSession,
} from "@google/genai";
import { decode, decodeAudioData } from "./utils";
import {
  LoaderIcon,
  PauseIcon,
  PlayIcon,
  SpeakerIcon,
  VolumeIcon,
  VolumeOffIcon,
} from "lucide-react";

const model = "lyria-realtime-exp";

type PlaybackState = "stopped" | "playing" | "loading" | "paused";

export const MusicStream = () => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const sessionRef = useRef<LiveMusicSession | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const connectionErrorRef = useRef<boolean>(false);
  const bufferTime = 2; // seconds of buffer to allow for latency
  const sampleRate = 48000;
  const [musicPrompt, setMusicPrompt] = useState<string>("menu music");

  useEffect(() => {
    // Create AudioContext lazily when component mounts
    (window as any).musicAPI = {
      queuedMusic: null,
      setMusicTheme: (text?: string) => {
        if (sessionRef.current) {
          sessionRef.current.setWeightedPrompts({
            weightedPrompts: [
              {
                text:
                  text ?? (window as any).musicAPI.queuedMusic ?? "menu music",
                weight: 0.6,
              },
              { text: "videogame", weight: 0.4 },
            ],
          });
        } else {
          (window as any).musicAPI.queuedMusic = musicPrompt;
        }
        setMusicPrompt(text || "menu music");
      },
    };

    audioCtxRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)({ sampleRate });
    outputGainRef.current = audioCtxRef.current.createGain();
    outputGainRef.current.connect(audioCtxRef.current.destination);

    const timeout = setTimeout(() => {
      if (playbackState === "playing" || playbackState === "loading") {
        // Auto-stop after 5 minutes
        sessionRef.current?.stop?.();
        sessionRef.current = null;
        setPlaybackState("stopped");
      }
    }, 1000 * 60 * 5);

    return () => {
      // Cleanup: stop session and close audio context
      clearTimeout(timeout);
      sessionRef.current?.stop?.();
      sessionRef.current = null;
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  async function connectToSession() {
    if (sessionRef.current) return;

    const ai = new GoogleGenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_LYRIA_API_KEY!,
      apiVersion: "v1alpha",
    });
    const session = await ai.live.music.connect({
      model,
      callbacks: {
        onmessage: async (e: LiveMusicServerMessage) => {
          if (e.setupComplete) {
            connectionErrorRef.current = false;
          }
          if (
            e.serverContent?.audioChunks &&
            audioCtxRef.current &&
            outputGainRef.current
          ) {
            try {
              const chunk = e.serverContent.audioChunks[0];

              if (!chunk?.data) return;
              const decoded = decode(chunk.data);

              const audioBuffer = await decodeAudioData(
                decoded,
                audioCtxRef.current!,
                sampleRate,
                2
              );
              const source = audioCtxRef.current!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputGainRef.current!);

              if (nextStartTimeRef.current === 0) {
                nextStartTimeRef.current =
                  audioCtxRef.current!.currentTime + bufferTime;

                setTimeout(
                  () => setPlaybackState("playing"),
                  bufferTime * 1000
                );
              }

              if (nextStartTimeRef.current < audioCtxRef.current!.currentTime) {
                // underrun
                setPlaybackState("loading");
                nextStartTimeRef.current = 0;
                return;
              }

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
            } catch (err) {
              console.error("Failed to decode/play audio chunk", err);
            }
          }
          if (e.filteredPrompt) {
            console.warn("Prompt filtered:", e.filteredPrompt.filteredReason);
          }
        },
        onerror: (err) => {
          console.error("Live music error", err);
          connectionErrorRef.current = true;
          setPlaybackState("stopped");
        },
        onclose: () => {
          console.warn("Live music connection closed");
          connectionErrorRef.current = true;
          setPlaybackState("stopped");
        },
      },
    });

    sessionRef.current = session;
    return session;
  }

  async function handlePlay() {
    try {
      await connectToSession();
      //await (window as any).musicAPI.setMusicTheme();
      await audioCtxRef.current?.resume();
      sessionRef.current?.play();
      setPlaybackState("loading");
    } catch (err) {
      console.error("Play failed", err);
      setPlaybackState("stopped");
    }
  }

  function handlePause() {
    sessionRef.current?.pause();
    setPlaybackState("paused");
  }

  return (
    <div className="fixed mx-auto bottom-0 bg-black/60 p-4 rounded-tr-2xl text-white flex">
      {playbackState === "playing" ? (
        <button onClick={handlePause} className="p-2">
          <VolumeOffIcon />
        </button>
      ) : playbackState === "loading" ? (
        <button disabled className="p-2">
          <LoaderIcon className="animate-spin" />
        </button>
      ) : (
        <button onClick={handlePlay} className="p-2 ">
          <VolumeIcon />
        </button>
      )}
      <div className="text-sm">
        <div>Currently playing</div>
        <div>{musicPrompt}</div>
      </div>
    </div>
  );
};
