"use client";

import { listGames } from "@/actions/list-games";
import { DicesIcon } from "lucide-react";
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
    <div className="max-h-screen items-center justify-center overflow-y-scroll">
      {/*<GameboyFrame />*/}
      <div className="sticky top-0 bg-black/50 z-10 backdrop-blur-xl">
        <h1 className="text-7xl text-teal-200 font-jacquard text-center pt-4">
          LoreDash
        </h1>
        <div className="text-3xl text-teal-200/80 font-jacquard text-center pb-4 ">
          Where Curiosity Sparks Games
        </div>
      </div>
      {games.length > 0 ? (
        <div className="w-full p-6 max-w-2xl mx-auto">
          <Link
            className="flex gap-4 border-2 border-teal-200 text-teal-200 p-4 mb-12 items-center justify-center hover:brightness-110 hover:shadow-lg hover:shadow-teal-200/50 duration-300 group"
            href={`/new-game`}
          >
            <Image
              src="/wikipedia.svg"
              alt="Wikipedia Logo"
              width={30}
              height={30}
            />
            Generate a new Dash from the Rabbit Hole
          </Link>

          <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-4">
            <div>
              <h2 className="font-jacquard text-teal-200 text-3xl mb-4 text-left">
                Dash Cache
              </h2>
              <div className="text-teal-200/80 text-left">
                Pre-made Dashes for you to explore and play!
              </div>
            </div>

            <Link
              className="relative flex items-center justify-center border-2 border-teal-200 duration-300 hover:shadow-teal-200/50 hover:brightness-110 hover:shadow-lg"
              href={`/game/${
                games[Math.floor(Math.random() * games.length)].id
              }`}
            >
              <DicesIcon className="h-24 w-24 text-teal-200" />
              <div className="absolute text-teal-200 font-jacquard text-lg right-2 bottom-2 leading-tight text-right">
                Random
              </div>
            </Link>
            {games.map((game) => (
              <Link
                key={game.id}
                className="border-2 border-teal-200 flex items-row duration-300 hover:shadow-teal-200/50 hover:brightness-110 hover:shadow-lg"
                href={`/game/${game.id}`}
              >
                <div className="relative w-full rounded-2xl overflow-hidden h-32">
                  <Image
                    unoptimized
                    src={
                      process.env.NEXT_PUBLIC_BLOB_BASE_URL +
                      `${game.id}-cover.png`
                    }
                    alt={`${game.title} cover`}
                    className="object-cover h-32 w-full"
                    fill
                  />
                  <div className="absolute w-full h-full bg-teal-400 mix-blend-color" />
                  <div className="absolute w-full h-full from-transparent to-black bg-linear-to-br" />
                  <div className="absolute text-teal-200 font-jacquard text-lg right-2 bottom-2 leading-tight text-right">
                    {game.title}
                  </div>
                </div>
              </Link>
            ))}
          </div>
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

export const dynamic = "force-dynamic";