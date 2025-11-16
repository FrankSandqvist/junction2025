"use server";

import { list } from "@vercel/blob";

export const listGames = async () => {
  const games = await list({
    prefix: "index-game-",
  });

  return await Promise.all(
    games.blobs
      .filter((b) => b.pathname.endsWith(".json"))
      .map((b) => fetch(b.downloadUrl, { cache: 'no-store' }).then((res) => res.json()))
  );
};
