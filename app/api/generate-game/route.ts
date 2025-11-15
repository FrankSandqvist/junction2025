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

          push({
            wikipediaFetched: true,
            wikipediaArticle: randomWikipediaArticle.title,
            wikipediaThumbnail:
              randomWikipediaArticle.thumbnail?.source ?? null,
            wikipediaDescription: randomWikipediaArticle.description ?? null,
          });

          const planPrompt = `You are an expert game creator. Produce a compact JSON plan for a small 8-bit-style educational game from a wiki article.
          
Provide a creative, fun game idea that a coder can implement and a short "howToPlay" text (1-2 sentences).

Unless very suitable, avoid simple "collect the items" or "avoid" games.

The response must include these properties:
- gameIdea (1-2 sentences)
- howToPlay (1-2 sentences)
- educationalText (2 sentences)
- musicTheme (very short, music genre, ignore platform)
Avoid mentioning gameboy, chiptune or 8-bit, that's added automatically.

- bitmaps (array of {id,width,height,subject,frames?,animationDescription?})
You can make bitmaps for sprites and backgrounds, be creative.
Avoid making them smaller than 16x16 pixels. Make sure to use the full canvas for interesting graphics.
If its for an animation, include a "frames" property with number of frames, and "animationDescription". No more than 4 frames per bitmap.

- sfx (array of {id,description}, max length 3)
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
                    frames: { type: "number" },
                    animationDescription: { type: "string" },
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
            gameId: gameId,
            title: plan.title,
            gameIdea: plan.gameIdea,
            musicTheme: plan.musicTheme,
          });

          const coverPromise = new Promise<void>(async (res, rej) => {
            const coverResult = await openAi.images.generate({
              model: "gpt-image-1-mini",
              prompt: `Decorative art for a game. It should have a dark background with stark thin white lines for the subject. 
              
IMPORTANT: NO TEXT!

This is some information about the game for inspiration: ${randomWikipediaArticle.description} ${plan.gameIdea}.`,
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
            const codePrompt = `You are an expert JS game developer. Produce only a single string containing the inner game loop function (no setup or imports). Make sure the game is playable, fun and quirky!

IMPORTANT: JUST RETURN THE INNER CODE OF THE FUNCTION. IT NEEDS TO BE PARSEABLE BY "new Function()". NO MARKDOWN TICKS, NO EXTRA TEXT AROUND IT.

Graphics:
The canvas is 320w x 288h, palette 4 grayscale. Make sure you make full use of your real estate! 
Important: Scale the bitmap down to the specified size when drawing to the canvas. 
Some bitmaps may have multiple frames for animation (separate images denoted with "frame-x" postfix), use them if relevant.
DO NOT USE SPRITEMAPS.

Code:
Assume no other code exists, except for the canvas and standard javascript.

The only interface outwards is a global window.gameLoopAPI described as:

- window.gameLoopAPI.state: Record<string, any> - A persistent state object you can use to store game state between ticks.
- window.gameLoopAPI.getCanvas(): HTMLCanvasElement - Get the canvas to draw the game on.
- window.gameLoopAPI.buttonState: Record<string, boolean> - Button states. They are "A", "B", "UP", "DOWN", "LEFT", "RIGHT"
- window.gameLoopAPI.getBitmap(string): HTMLImageElement - get a bitmap HTML element. Bitmap IDs available: ${plan.bitmaps
              .flatMap((b: any) =>
                JSON.stringify(
                  b.frames && b.frames > 1
                    ? new Array(b.frames)
                        .fill(null)
                        .map((_, i) => `${b.id}-frame-${i}`)
                    : [b.id]
                )
              )
              .join("\n")}

- window.gameLoopAPI.playSound(string): void - play a sound effect by their ID. Sound effect IDs available: ${plan.sfx
              .map((s: any) => s.id)
              .join(", ")}.

This is the game plan to code: ${plan.gameIdea}.`;

            console.log(codePrompt);

            const codeResp = await ai.models.generateContent({
              model: "gemini-2.5-pro",
              contents: [{ text: codePrompt }],
            });

            await put(`${gameId}-code.js`, codeResp.text!, {
              access: "public",
            });

            push({ codeComplete: true });

            res();
          });

          const bitmapPromise = new Promise<void>(async (res, rej) => {
            if (plan.bitmaps.length > 0) {
              const bitmapPromises = plan.bitmaps.map(async (b: any) => {
                try {
                  const img = await openAi.images.generate({
                    model: "gpt-image-1-mini",
                    prompt: `Gameboy-style bitmap of ${
                      b.subject
                    }. Use 4-shade grayscale suitable for Gameboy, transparent background when relevant

${
  b.frames && b.frames > 1
    ? `Your task is to generate singular frames of an animation (${b.frames} in total). Make sure the frames clearly show the animation: ${b.animationDescription}`
    : ""
}`,
                    size: "1024x1024",
                    background: "auto",
                    n: b.frames ? b.frames : 1,
                  });
                  if (!img.data) {
                    res();
                    return;
                  }
                  for (
                    let f = 0;
                    f < (img.data.length ? img.data.length : 1);
                    f++
                  ) {
                    const frameB64 = img.data?.[f]?.b64_json;
                    const buf = Buffer.from(frameB64!, "base64");

                    const png = await sharp(buf)
                      .trim()
                      .resize(b.width * 4, b.height * 4)
                      .png()
                      .toBuffer();

                    await put(
                      `${gameId}-bitmap-${b.id}${
                        img.data.length > 1 ? `-frame-${f}` : ""
                      }.png`,
                      png,
                      {
                        access: "public",
                      }
                    );
                  }
                } catch (err: any) {
                  return { id: b.id, buffer: Buffer.from("") };
                }
              });
            }

            push({ bitmapsComplete: true });
            res();
          });

          const sfxPromise = new Promise<void>(async (res, rej) => {
            for (const s of plan.sfx) {
              try {
                const res = await elevenlabs.textToSoundEffects.convert({
                  text: `Pleasant sfx according to the description. Pleasant gamey sounds. Description: ${s.description}`,
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
            wikipediaArticle: randomWikipediaArticle.title,
            wikipediaThumbnail:
              randomWikipediaArticle.thumbnail?.source ?? null,
            wikipediaUrl: randomWikipediaArticle.content_urls.desktop.page,
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
