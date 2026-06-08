import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bolao Copa 2026",
  description: "Bolao da Copa com ligas, palpites, ranking e administracao.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {user && (
          <Link
            href="/logout"
            className="absolute right-4 top-20 z-[9999] flex h-8 min-w-[3.6rem] items-center justify-center rounded-full border-2 border-white bg-[#e1a81d] px-3 text-[0.72rem] font-black uppercase text-white shadow-[0_8px_18px_rgba(0,0,0,0.24)] [text-shadow:0_1px_0_rgba(255,255,255,0.18)] sm:right-6 sm:top-6"
          >
            Sair
          </Link>
        )}
        {children}
      </body>
    </html>
  );
}
