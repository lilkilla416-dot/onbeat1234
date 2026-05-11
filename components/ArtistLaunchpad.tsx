"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Users } from "lucide-react"
import ControlPanel from "./launchpad/ControlPanel"
import PhonePreview from "./launchpad/PhonePreview"
import ExportModal from "./launchpad/ExportModal"
import AgentTeam from "./agents/AgentTeam"

export interface ArtistData {
  name: string
  profilePicUrl: string
  spotifyUrl: string
  appleMusicUrl: string
  instagramUrl: string
  youtubeUrl: string
}

type View = "launchpad" | "agents"

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
  const [view, setView] = useState<View>("launchpad")

  const update = (key: keyof ArtistData) => (val: string) =>
    setData((prev) => ({ ...prev, [key]: val }))

  if (view === "agents") {
    return <AgentTeam data={data} onBack={() => setView("launchpad")} />
  }

  return (
    <div className="flex h-screen bg-[#080810] overflow-hidden">
      {/* Left control panel */}
      <div className="w-[380px] shrink-0 flex flex-col border-r border-[#1c1c30] overflow-hidden">
        <ControlPanel data={data} onChange={update} onExport={() => setShowExport(true)} />

        {/* Agent Team entry point */}
        <div className="px-5 py-4 border-t border-[#1c1c30] shrink-0">
          <motion.button
            onClick={() => setView("agents")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-between text-white font-black text-[13px] px-5 py-3.5 rounded-xl tracking-wide border"
            style={{
              background: "linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(108,99,255,0.08) 100%)",
              borderColor: "rgba(74,222,128,0.2)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <Users size={15} className="text-[#4ade80]" />
              <span className="text-[#4ade80]">LABEL AGENT TEAM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"
                style={{ boxShadow: "0 0 5px #4ade80" }}
              />
              <span className="text-[9px] text-[#4ade80] font-black tracking-widest">5 ONLINE</span>
            </div>
          </motion.button>
          <p className="text-[10px] text-[#28283e] text-center mt-2">
            Marketing · PR · Playlists · Campaigns
          </p>
        </div>
      </div>

      {/* Right preview area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ background: "#05050c" }}
      >
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
