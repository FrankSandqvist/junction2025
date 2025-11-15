"use client";

import { listGames } from "@/actions/list-games";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    listGames().then(setGames);
    (window as any).musicAPI?.setMusicTheme("menu music");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/*<GameboyFrame />*/}
      {games.length > 0 ? (
        <div className="p-6 max-w-2xl mx-auto">
          <h1 className="text-3xl mb-4">Available Games</h1>
          <ul className="space-y-4">
            {games.map((game) => (
              <li
                key={game.gameId}
                className="border p-4 rounded-lg bg-white shadow"
              >
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
