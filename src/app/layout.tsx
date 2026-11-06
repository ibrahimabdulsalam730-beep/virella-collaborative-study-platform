import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Virella Study — Collaborative Real-Time Mastery Platform",
  description:
    "Next-generation collaborative study rooms with 3D living progress, synchronized Pomodoro, shared whiteboard, Feynman rounds, and AI-powered active recall.",
  keywords: [
    "study room",
    "collaborative learning",
    "pomodoro sync",
    "shared whiteboard",
    "feynman technique",
    "active recall",
    "proctored tests",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#05050a] text-[#f8fafc] font-sans antialiased selection:bg-[#b4f000] selection:text-[#05050a]"
        suppressHydrationWarning
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
