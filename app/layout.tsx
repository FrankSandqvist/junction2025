import type { Metadata } from "next";
import { Cutive_Mono, Jacquard_12 } from "next/font/google";
import "./globals.css";
import { MusicStream } from "./music-stream";

const jac = Jacquard_12({
  weight: "400",
  subsets: ["latin"],
});
const cut = Cutive_Mono({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoreDash",
  description: "LoreDash",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-linear-to-b to-teal-950 from-black">
        {children}
        <MusicStream />
      </body>
    </html>
  );
}
