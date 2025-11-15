"use client";

import { listGames } from "@/actions/list-games";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    listGames().then(setGames);
    (window as any).musicAPI?.setMusicTheme("menu music");
  }, []);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      {/*<GameboyFrame />*/}
      <h1 className="text-7xl text-teal-200 font-jacquard text-center">
        LoreDash
      </h1>
      {games.length > 0 ? (
        <div className="p-6 max-w-2xl mx-auto">
          <h1 className="text-3xl mb-4">Available Games</h1>
          <ul className="space-y-4">
            {games.map((game) => (
              <li
                key={game.gameId}
                className="border p-4 rounded-lg flex items-row"
              >
                <div className="relative mix-blend-lighten rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-teal-400 mix-blend-color" />
                  <Image
                    unoptimized
                    src={
                      process.env.NEXT_PUBLIC_BLOB_BASE_URL +
                      `${game.id}-cover.png`
                    }
                    alt={`${game.title} cover`}
                    width={128}
                    height={128}
                  />
                </div>
                <Link
                  href={`/game/${game.id}`}
                  className="text-xl font-bold underline"
                >
                  {game.title}
                </Link>
                <p className="text-sm text-gray-600">
                  Created at: {new Date(game.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xl">No games available. Create a new game!</p>
      )}

      <Link href="/new-game" className="text-2xl underline">
        Create New Game
      </Link>
    </div>
  );
}
