"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Play } from "lucide-react"
import AgentCard from "./AgentCard"
import { AGENTS } from "./agentDefs"
import type { ArtistData } from "../ArtistLaunchpad"

interface Props {
  data: ArtistData
  onBack: () => void
}

export default function AgentTeam({ data, onBack }: Props) {
  // Per-agent trigger counters — incrementing one fires that agent's run
  const [triggers, setTriggers] = useState<number[]>(AGENTS.map(() => 0))
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const briefAll = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = AGENTS.map((_, i) =>
      setTimeout(() => {
        setTriggers((prev) => {
          const next = [...prev]
          next[i] = next[i] + 1
          return next
        })
      }, i * 350)
    )
  }

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-[#080810] overflow-hidden">
      {/* Top bar */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "#1c1c30" }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-[11px] font-bold text-[#3a3a5a] hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Launchpad
          </motion.button>

          <div className="w-px h-4 bg-[#1c1c30]" />

          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"
              style={{ boxShadow: "0 0 6px #4ade80" }}
            />
            <span className="text-[9px] font-black tracking-[0.4em] text-[#4ade80] uppercase">
              Agent Team · Online
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-black text-white leading-none">
              {data.name.trim() || "YOUR ARTIST NAME"}
            </p>
            <p className="text-[10px] text-[#3a3a5a] mt-0.5">Active roster</p>
          </div>

          <motion.button
            onClick={briefAll}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-black px-4 py-2 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #6c63ff 0%, #4ade80 100%)",
              boxShadow: "0 0 18px rgba(108,99,255,0.35)",
            }}
          >
            <Play size={10} />
            Brief All Agents
          </motion.button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* Hero */}
        <div className="px-6 pt-8 pb-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-[28px] font-black text-white leading-none tracking-tight mb-1">
              LABEL AGENT TEAM
            </h1>
            <p className="text-[12px] text-[#3a3a5a]">
              Five specialist agents covering every angle of your marketing and promotion.{" "}
              <span className="text-[#3a3a5a]">
                Run them individually or hit{" "}
                <span className="text-white">Brief All Agents</span> to fire the full team.
              </span>
            </p>
          </div>
        </div>

        {/* Agent grid */}
        <div className="px-6 pb-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <AgentCard
                  agent={agent}
                  artistData={data}
                  externalTrigger={triggers[i]}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
