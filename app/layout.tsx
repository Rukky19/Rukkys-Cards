import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rukky's Card Table",
  description: "A personal deck. A table for learning card games with friends.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}