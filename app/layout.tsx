import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "600", "700", "900"],
})

export const metadata: Metadata = {
  title: "Artist Launchpad",
  description: "Build your professional artist landing page in minutes.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full overflow-hidden" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
        {children}
      </body>
    </html>
  )
}
