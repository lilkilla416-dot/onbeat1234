import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "600", "700", "900"],
})

export const metadata: Metadata = {
  title: "The Drop Desk — Label Agent Team",
  description:
    "Upload your cover art, track, and press kit, connect TikTok, and brief five specialist marketing agents.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
