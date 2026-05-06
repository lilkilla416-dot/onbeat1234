import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "On Beat // Rhythm Analyzer",
  description: "DSP-powered pocket detection — analyze BPM, timing groove and vocal accuracy against the beat.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full`}>
      <body className="h-full overflow-hidden bg-[#050508]">{children}</body>
    </html>
  );
}
