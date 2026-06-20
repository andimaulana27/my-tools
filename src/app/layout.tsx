// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Tools - AI Workspace",
  description: "Private AI productivity suite and metadata engine for digital creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-[#050505] text-zinc-200 antialiased selection:bg-white/10 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}