import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { ReadableStream } from "stream/web";
import { put } from "@vercel/blob";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  // helper to send progress events to the stream
  function createStream() {
    const stream = new ReadableStream({
      async start(controller) {
        function push(obj: any) {
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(obj) + "\n")
          );
        }

        try {
          const gameId = `game-${nanoid(8)}`;

          const randomWikipediaArticle = await fetch(
            "https://en.wikipedia.org/api/rest_v1/page/random/summary"
          )
            .then((res) => res.json())
            .catch(() => null);

          if (!randomWikipediaArticle) {
            throw new Error("Failed to fetch random Wikipedia article");
          }

          push({ wikipediaFetched: true });

          const planPrompt = `You are an expert game dev. Produce a compact JSON plan for a small Gameboy-style educational game from a wiki article. Provide a creative, fun game idea that a coder can implement and a short "howToPlay" text (1-2 sentences).

The response must include:
- title
- gameIdea (1-2 sentences)
- howToPlay (1-2 sentences)
- educationalText (2 sentences)
- musicTheme (very short, genre)
- bitmaps (array of {id,width,height,subject})
- sfx (array of {id,description}, max length 3)

You can make bitmaps for sprites and backgrounds, be creative.
The sound effects should work for gameboy, but can also include simple crunchy samples.

Use short ids (like 'bg1','player1') for assets.

This is the article: ${randomWikipediaArticle.extract}`;

          const planSchema = {
            type: "object",
            properties: {
              title: { type: "string" },
              gameIdea: { type: "string" },
              howToPlay: { type: "string" },
              educationalText: { type: "string" },
              musicTheme: { type: "string" },
              bitmaps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    width: { type: "number" },
                    height: { type: "number" },
                    subject: { type: "string" },
                  },
                  required: ["id", "width", "height", "subject"],
                },
              },
              sfx: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["id", "description"],
                },
              },
            },
            required: [
              "title",
              "gameIdea",
              "howToPlay",
              "educationalText",
              "musicTheme",
              "bitmaps",
            ],
          };

          const planResp = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: planPrompt }],
            config: {
              responseMimeType: "application/json",
              responseSchema: planSchema,
            },
          });

          if (!planResp.text) {
            throw new Error("No plan response text");
          }
          const plan = JSON.parse(planResp.text);
          plan.bitmaps = plan.bitmaps || [];
          plan.sfx = plan.sfx || [];

          // attach generated ids if missing
          for (let i = 0; i < plan.bitmaps.length; i++) {
            plan.bitmaps[i].id = plan.bitmaps[i].id || `bmp${i + 1}`;
          }
          for (let i = 0; i < plan.sfx.length; i++) {
            plan.sfx[i].id = plan.sfx[i].id || `sfx${i + 1}`;
          }

          push({
            planComplete: true,
            title: plan.title,
          });

          const coverPromise = new Promise<void>(async (res, rej) => {
            const coverResult = await openAi.images.generate({
              model: "gpt-image-1-mini",
              prompt: `Coverart for a game. It should be grayscale and use strong dark lines in the art 80's cartoon style.

Title: ${plan.title}

Game: ${plan}.`,
              size: "1024x1024",
              background: "opaque",
            });

            const coverBase64 = coverResult.data?.[0]?.b64_json;
            const coverBuffer = coverBase64
              ? Buffer.from(coverBase64, "base64")
              : Buffer.from("");

            await put(`${gameId}-cover.png`, coverBuffer, {
              access: "public",
            });
            push({ coverComplete: true });

            res();
          });

          const codePromise = new Promise<void>(async (res, rej) => {
            const codePrompt = `You are an expert JS developer. Produce only a single string containing the inner game loop function (no setup or imports).

IMPORTANT: JUST RETURN THE INNER CODE OF THE FUNCTION. IT NEEDS TO BE PARSEABLE BY "new Function()". NO MARKDOWN TICKS, NO EXTRA TEXT AROUND IT.

The canvas is 160x144, palette 4 grayscale. 

Assume no other code exists, except for the canvas and standard javascript. The only interface outwards is a global window.gameLoopAPI described as:

- window.gameLoopAPI.getCanvas(): HTMLCanvasElement - Get the canvas to draw the game on.
- window.gameLoopAPI.buttonState: Record<string, boolean> - Button states. They are "A", "B", "UP", "DOWN", "LEFT", "RIGHT"
- window.gameLoopAPI.getBitmapUrl(string): string -get a bitmap URL by their ID. Bitmap IDs available: ${plan.bitmaps
              .map((b: any) => b.id)
              .join(", ")}.
- window.gameLoopAPI.playSound(string): void - play a sound effect by their ID. Sound effect IDs available: ${plan.sfx
              .map((s: any) => s.id)
              .join(", ")}.

This is the game plan to code: ${plan.gameIdea}. Keep it concise.`;

            const codeResp = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{ text: codePrompt }],
            });

            await put(`${gameId}-code.js`, codeResp.text!, {
              access: "public",
            });

            push({ codeComplete: true });

            res();
          });

          const bitmapPromise = new Promise<void>(async (res, rej) => {
            const bitmapBuffers: { id: string; buffer: Buffer }[] = [];
            if (plan.bitmaps.length > 0) {
              const bitmapPromises = plan.bitmaps.map(async (b: any) => {
                try {
                  const img = await openAi.images.generate({
                    model: "gpt-image-1-mini",
                    prompt: `Gameboy-style bitmap of ${b.subject}. Use 4-shade grayscale suitable for Gameboy, transparent background when relevant.`,
                    size: "1024x1024",
                    background: "auto",
                  });
                  const b64 = img.data?.[0]?.b64_json;
                  const buf = b64
                    ? Buffer.from(b64, "base64")
                    : Buffer.from("");
                  const png = await sharp(buf).trim().png().toBuffer();

                  await put(`${gameId}-bitmap-${b.id}.png`, png, {
                    access: "public",
                  });

                  return { id: b.id, buffer: png };
                } catch (err: any) {
                  return { id: b.id, buffer: Buffer.from("") };
                }
              });

              const results = await Promise.all(bitmapPromises);
              bitmapBuffers.push(...results);
            }

            push({ bitmapsComplete: true });
            res();
          });

          const sfxPromise = new Promise<void>(async (res, rej) => {
            for (const s of plan.sfx) {
              try {
                const res = await elevenlabs.textToSoundEffects.convert({
                  text: `8-bit GameBoy sound effect according to this: ${s.description}`,
                  durationSeconds: 2,
                  outputFormat: "mp3_22050_32",
                });

                await put(`${gameId}-sfx-${s.id}.mp3`, res, {
                  access: "public",
                });
              } catch (err) {
                // ignore sfx generation errors
                console.log("SFX generation error:", err);
              }
            }

            push({ sfxComplete: true });

            res();
          });

          await Promise.all([
            coverPromise,
            codePromise,
            bitmapPromise,
            sfxPromise,
          ]);

          const info = {
            id: gameId,
            title: plan.title,
            gameIdea: plan.gameIdea,
            howToPlay: plan.howToPlay,
            educationalText: plan.educationalText,
            musicTheme: plan.musicTheme,
            createdAt: new Date().toISOString(),
          };

          console.log("Game info:", info);

          await put(`index-${gameId}.json`, JSON.stringify(info, null, 2), {
            access: "public",
          });

          // final
          push({ completed: true, gameId });
          controller.close();
        } catch (err: any) {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ error: String(err) }) + "\n"
            )
          );
          controller.close();
        }
      },
    });

    return stream;
  }

  const stream = createStream();

  // cast stream to BodyInit to avoid cross-environment ReadableStream typing mismatches
  return new Response(stream as unknown as BodyInit, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
