"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Play, Pencil, Check } from "lucide-react"
import AgentCard from "./AgentCard"
import { AGENTS } from "./agentDefs"

export default function AgentDashboard() {
  const [artistName, setArtistName] = useState("Your Artist")
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(artistName)
  const [triggers, setTriggers] = useState<number[]>(AGENTS.map(() => 0))
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const briefAll = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = AGENTS.map((_, i) =>
      setTimeout(() => {
        setTriggers((prev) => {
          const next = [...prev]
          next[i] = (next[i] ?? 0) + 1
          return next
        })
      }, i * 320)
    )
  }

  const commitName = () => {
    const trimmed = draft.trim()
    if (trimmed) setArtistName(trimmed)
    else setDraft(artistName)
    setEditing(false)
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#07070f",
        backgroundImage:
          "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(108,99,255,0.10) 0%, transparent 60%)",
      }}
    >
      {/* Top nav */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b backdrop-blur-sm"
        style={{ borderColor: "#14142a", background: "rgba(7,7,15,0.88)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {["#6c63ff", "#ff3cac", "#4ade80"].map((c) => (
              <span
                key={c}
                className="block w-2 h-2 rounded-full"
                style={{ background: c, boxShadow: `0 0 6px ${c}` }}
              />
            ))}
          </div>
          <span className="text-[11px] font-black tracking-[0.35em] text-white uppercase">
            Label Agent Team
          </span>
        </div>

        {/* Artist name editor */}
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName()
                  if (e.key === "Escape") { setDraft(artistName); setEditing(false) }
                }}
                className="text-[13px] font-black text-white bg-transparent border-b border-[#6c63ff] outline-none w-40 pb-0.5"
                placeholder="Artist name"
              />
              <motion.button
                onClick={commitName}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-[#6c63ff]"
              >
                <Check size={11} color="#000" />
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={() => { setDraft(artistName); setEditing(true) }}
              whileHover={{ opacity: 0.8 }}
              className="flex items-center gap-1.5 text-[12px] font-black text-white"
            >
              {artistName}
              <Pencil size={11} className="text-[#3a3a5a]" />
            </motion.button>
          )}
        </div>

        {/* Brief All CTA */}
        <motion.button
          onClick={briefAll}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-black px-5 py-2.5 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #6c63ff 0%, #4ade80 100%)",
            boxShadow: "0 0 20px rgba(108,99,255,0.3), 0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <Play size={10} />
          Brief All Agents
        </motion.button>
      </header>

      {/* Hero */}
      <div className="px-6 pt-10 pb-6 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[10px] font-black tracking-[0.4em] text-[#6c63ff] uppercase mb-2">
            Marketing &amp; Promotion
          </p>
          <h1 className="text-[40px] font-black text-white leading-none tracking-tight mb-3">
            YOUR LABEL
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #6c63ff 0%, #ff3cac 50%, #4ade80 100%)" }}
            >
              AGENT TEAM
            </span>
          </h1>
          <p className="text-[13px] text-[#3a3a5a] max-w-lg leading-relaxed">
            Five specialist agents covering brand, social media, PR, playlist pitching, and campaign
            direction. Run them one by one or brief the entire team at once.
          </p>
        </motion.div>
      </div>

      {/* Agent grid */}
      <main className="flex-1 px-6 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              <AgentCard
                agent={agent}
                artistName={artistName}
                externalTrigger={triggers[i]}
              />
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 pb-6 text-center">
        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#1c1c30]">
          Label Agent Team · Marketing Engine
        </p>
      </footer>
    </div>
  )
}
