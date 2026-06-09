import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { LogoutButton } from "@/app/logout/logout-button";
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
        {user && <LogoutButton />}
        {children}
      </body>
    </html>
  );
}
