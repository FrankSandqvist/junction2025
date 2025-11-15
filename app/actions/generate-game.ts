"use server";

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import sharp from "sharp";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateGame() {
  const randomWikipediaArticle = /*{
    type: "standard",
    title: "Diaminocyclohexanetetraacetic acid",
    displaytitle:
      '<span class="mw-page-title-main">Diaminocyclohexanetetraacetic acid</span>',
    namespace: { id: 0, text: "" },
    wikibase_item: "Q135971437",
    titles: {
      canonical: "Diaminocyclohexanetetraacetic_acid",
      normalized: "Diaminocyclohexanetetraacetic acid",
      display:
        '<span class="mw-page-title-main">Diaminocyclohexanetetraacetic acid</span>',
    },
    pageid: 80708327,
    thumbnail: {
      source:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/H4Cydta.svg/320px-H4Cydta.svg.png",
      width: 320,
      height: 123,
    },
    originalimage: {
      source:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/H4Cydta.svg/276px-H4Cydta.svg.png",
      width: 276,
      height: 106,
    },
    lang: "en",
    dir: "ltr",
    revision: "1305428981",
    tid: "4d66fe02-7718-11f0-8620-d11fd27dcceb",
    timestamp: "2025-08-12T01:04:31Z",
    description: "Chemical compound",
    description_source: "local",
    content_urls: {
      desktop: {
        page: "https://en.wikipedia.org/wiki/Diaminocyclohexanetetraacetic_acid",
        revisions:
          "https://en.wikipedia.org/wiki/Diaminocyclohexanetetraacetic_acid?action=history",
        edit: "https://en.wikipedia.org/wiki/Diaminocyclohexanetetraacetic_acid?action=edit",
        talk: "https://en.wikipedia.org/wiki/Talk:Diaminocyclohexanetetraacetic_acid",
      },
      mobile: {
        page: "https://en.wikipedia.org/wiki/Diaminocyclohexanetetraacetic_acid",
        revisions:
          "https://en.wikipedia.org/wiki/Special:History/Diaminocyclohexanetetraacetic_acid",
        edit: "https://en.wikipedia.org/wiki/Diaminocyclohexanetetraacetic_acid?action=edit",
        talk: "https://en.wikipedia.org/wiki/Talk:Diaminocyclohexanetetraacetic_acid",
      },
    },
    extract:
      "Diaminocyclohexanetetraacetic acid is an organic compound with the formula C6H10(N 2)2. It is an aminopolycarboxylic acid, structurally related to EDTA but with a chiral backbone derived from trans-1,2-diaminocyclohexane.",
    extract_html:
      '<p><b>Diaminocyclohexanetetraacetic acid</b> is an organic compound with the formula <span class="chemf nowrap">C<sub class="template-chem2-sub">6</sub>H<sub class="template-chem2-sub">10</sub>(N <sub class="template-chem2-sub">2</sub>)<sub class="template-chem2-sub">2</sub></span>. It is an aminopolycarboxylic acid, structurally related to EDTA but with a chiral backbone derived from <span><i>trans</i>-1,2-diaminocyclohexane</span>.</p>',
  };*/ await fetch(
    "https://en.wikipedia.org/api/rest_v1/page/random/summary"
  ).then((res) => res.json());

  const jsonSchema = {
    type: "object",
    properties: {
      gameLoopCode: {
        type: "string",
        description: "The complete JavaScript code for the game loop.",
      },
      educationalText: {
        type: "string",
        description: "A brief educational text related to the game's theme.",
      },
      musicTheme: {
        type: "string",
        description: "A description of the music theme for the game.",
      },
      bitmaps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            width: {
              type: "number",
              description: "Width of the bitmap in pixels.",
            },
            height: {
              type: "number",
              description: "Height of the bitmap in pixels.",
            },
            subject: {
              type: "string",
              description: "A brief description of the bitmap's subject.",
            },
            id: {
              type: "string",
              description: "A brief description of the bitmap's subject.",
            },
          },
          required: ["width", "height", "subject"],
        },
        description: "An array of bitmap definitions needed for the game.",
      },
    },
    required: ["gameLoopCode", "educationalText", "musicTheme", "bitmaps"],
  };

  const systemInstruction = `You are an expert game developer specializing in creating simple educational games for the Gameboy platform using JavaScript.
You should generate the gameLoopCode, educationalText, musicTheme, and bitmaps based on the user's prompt.

The resolution of the screen is 160x144 pixels, and the color palette is limited to 4 shades of gray. Use black (#000000), dark gray (#555555), light gray (#AAAAAA), and white (#FFFFFF).

## gameLoopCode

This is a loop that is run at 30 fps. It has access to a global "gameLoopAPI" object with the following properties:
- window.gameLoopAPI.getCanvas(): HTMLCanvasElement - Get the canvas to draw the game on.
- window.gameLoopAPI.addScore(score: number): void - Add score to the player's score.
- window.gameLoopAPI.buttonState: Record<string, boolean> - Button states. They are "A", "B", "UP", "DOWN", "LEFT", "RIGHT"
- window.gameLoopAPI.bitmapDataURLs: Record<string, string> - bitmaps by their ID, returns the data URL (incl. mime type).

IMPORTANT: Only do the inner function of the game loop. Do NOT include any setup code, imports, or anything outside the main loop function. 

## educationalText

This is a brief text (2-3 sentences) that teaches the player something related to the game's theme. It should be engaging and informative.

## musicTheme

This is a short description of the music theme for the game. It should evoke the mood and setting of the game.

## bitmaps

An array of bitmap definitions needed for the game. Each bitmap should have a id, width, height, and a brief description of its subject.

You can also make foregrounds and backgrounds to make the game more interesting.
`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        text: `Make a really unique game loop code for a simple educational Gameboy-style game based on the following Wikipedia article summary.

Be creative, don't always make simple quiz or "catch the falling object" games. Try to make the game mechanics relate to the article in interesting ways. (Unless such a game is very suitable)

Subject to make the game about:

${randomWikipediaArticle.extract}`,
      },
    ],
    config: {
      responseMimeType: "application/json",

      responseSchema: jsonSchema,
      systemInstruction,
    },
  });

  console.log(response.text);

  const { gameLoopCode, educationalText, musicTheme, bitmaps } = JSON.parse(
    response.text!
  );

  const results = await Promise.all(
    bitmaps.map(async (bitmap: any) => {
      //
      // Use OpenAI for this, as it can do transparent background
      const bitmapImage = await openAi.images.generate({
        model: "gpt-image-1-mini",
        prompt: `Create a Gameboy-style bitmap (${bitmap.width}x${bitmap.height}) of ${bitmap.subject}. Use a 4-shade grayscale palette suitable for Gameboy graphics. Transparent background if relevant. For the inner section of the bitmap, for to-be-white sections, use a slightly of white, so that it doesn't become transparent by accident.`,
        background: "transparent",
      });

      const processed = await sharp(
        Buffer.from(bitmapImage.data![0].b64_json!, "base64")
      )
        .trim()
        .toBuffer();

      return {
        id: bitmap.id,
        dataURL: `data:image/png;base64,${processed.toString("base64")}`,
      };
    })
  );
  const bitmapDataURLs: Record<string, string> = {};
  for (const r of results) {
    bitmapDataURLs[r.id] = r.dataURL;
  }

  return {
    gameLoopCode,
    educationalText,
    musicTheme,
    bitmapDataURLs,
  };
}
