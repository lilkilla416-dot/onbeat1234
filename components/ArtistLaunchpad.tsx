"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import ControlPanel from "./launchpad/ControlPanel"
import PhonePreview from "./launchpad/PhonePreview"
import ExportModal from "./launchpad/ExportModal"

export interface ArtistData {
  name: string
  profilePicUrl: string
  spotifyUrl: string
  appleMusicUrl: string
  instagramUrl: string
  youtubeUrl: string
}

export default function ArtistLaunchpad() {
  const [data, setData] = useState<ArtistData>({
    name: "YOUR ARTIST NAME",
    profilePicUrl: "",
    spotifyUrl: "",
    appleMusicUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
  })
  const [showExport, setShowExport] = useState(false)

  const update = (key: keyof ArtistData) => (val: string) =>
    setData((prev) => ({ ...prev, [key]: val }))

  return (
    <div className="flex h-screen bg-[#080810] overflow-hidden">
      {/* Left control panel */}
      <div className="w-[380px] shrink-0 flex flex-col border-r border-[#1c1c30] overflow-hidden">
        <ControlPanel data={data} onChange={update} onExport={() => setShowExport(true)} />
      </div>

      {/* Right preview area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ background: "#05050c" }}
      >
        {/* Subtle grid backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <PhonePreview data={data} />
      </div>

      <AnimatePresence>
        {showExport && (
          <ExportModal data={data} onClose={() => setShowExport(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
