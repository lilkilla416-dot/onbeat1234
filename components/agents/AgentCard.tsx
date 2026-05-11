"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, RotateCcw } from "lucide-react"
import type { AgentDef } from "./agentDefs"
import type { ArtistData } from "../ArtistLaunchpad"

type Status = "idle" | "thinking" | "streaming" | "done"

interface Props {
  agent: AgentDef
  artistData: ArtistData
  externalTrigger?: number
}

const STATUS_LABELS: Record<Status, string> = {
  idle: "READY",
  thinking: "THINKING",
  streaming: "WORKING",
  done: "DONE",
}

const STATUS_COLORS: Record<Status, string> = {
  idle: "#3a3a5a",
  thinking: "#fbbf24",
  streaming: "#4ade80",
  done: "#6c63ff",
}

function ThinkingDots({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-1.5 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block rounded-full"
          style={{ width: 6, height: 6, background: accent }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
      <span className="text-[11px] ml-1" style={{ color: accent }}>
        Agent is thinking…
      </span>
    </div>
  )
}

export default function AgentCard({ agent, artistData, externalTrigger }: Props) {
  const [status, setStatus] = useState<Status>("idle")
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const outputRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const thinkRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startRun = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (thinkRef.current) clearTimeout(thinkRef.current)
    setVisibleLines([])
    setStatus("thinking")
    thinkRef.current = setTimeout(() => setStatus("streaming"), 1500)
  }

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (thinkRef.current) clearTimeout(thinkRef.current)
    setVisibleLines([])
    setStatus("idle")
  }

  const isActive = status === "thinking" || status === "streaming"

  useEffect(() => {
    if (externalTrigger === undefined || externalTrigger === 0) return
    startRun()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTrigger])

  useEffect(() => {
    if (status !== "streaming") return
    const allLines = agent.generate(artistData).split("\n")
    let i = 0
    intervalRef.current = setInterval(() => {
      setVisibleLines(allLines.slice(0, i + 1))
      i++
      if (i >= allLines.length) {
        clearInterval(intervalRef.current!)
        setStatus("done")
      }
    }, 55)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    if (outputRef.current && (status === "streaming" || status === "done")) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [visibleLines, status])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (thinkRef.current) clearTimeout(thinkRef.current)
    }
  }, [])

  const statusColor = STATUS_COLORS[status]

  return (
    <div
      className="flex flex-col rounded-2xl border overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0e0e1c 0%, #080810 100%)",
        borderColor: status === "idle" ? "#1c1c30" : `${agent.accent}35`,
        boxShadow: isActive ? `0 0 24px ${agent.accent}18` : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 p-4 border-b" style={{ borderColor: "#1c1c30" }}>
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-black"
          style={{
            background: `${agent.accent}18`,
            border: `1px solid ${agent.accent}35`,
            color: agent.accent,
            boxShadow: status !== "idle" ? `0 0 12px ${agent.accent}30` : "none",
            transition: "box-shadow 0.3s",
          }}
        >
          {agent.name.charAt(0)}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-black text-white">{agent.name}</p>
            <span
              className="text-[8px] font-black tracking-[0.15em] uppercase px-1.5 py-0.5 rounded-full"
              style={{ background: `${statusColor}18`, color: statusColor, transition: "all 0.3s" }}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p className="text-[11px] font-bold" style={{ color: agent.accent }}>
            {agent.role}
          </p>
          <p className="text-[10px] text-[#3a3a5a] mt-0.5">{agent.specialty}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {status === "done" && (
            <motion.button
              onClick={reset}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", color: "#3a3a5a" }}
              title="Reset"
            >
              <RotateCcw size={12} />
            </motion.button>
          )}
          <motion.button
            onClick={startRun}
            whileHover={isActive ? {} : { scale: 1.05 }}
            whileTap={isActive ? {} : { scale: 0.95 }}
            disabled={isActive}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg"
            style={{
              background: isActive ? `${agent.accent}25` : agent.accent,
              color: isActive ? agent.accent : "#000",
              cursor: isActive ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            <Play size={9} />
            {status === "done" ? "Re-run" : "Run"}
          </motion.button>
        </div>
      </div>

      {/* Brief (shown when idle) */}
      <AnimatePresence>
        {status === "idle" && (
          <motion.div
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3"
          >
            <p className="text-[11px] text-[#3a3a5a] leading-relaxed">{agent.brief}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thinking animation */}
      <AnimatePresence>
        {status === "thinking" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4"
          >
            <ThinkingDots accent={agent.accent} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output terminal */}
      <AnimatePresence>
        {(status === "streaming" || status === "done") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.25 }}
            ref={outputRef}
            className="overflow-y-auto font-mono text-[11px] leading-relaxed px-4 py-3"
            style={{
              maxHeight: "260px",
              color: `${agent.accent}cc`,
              scrollbarWidth: "none",
            }}
          >
            {visibleLines.map((line, i) => (
              <div key={i} style={{ minHeight: "1.3em" }}>
                {line || " "}
              </div>
            ))}
            {status === "streaming" && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                style={{ color: agent.accent }}
              >
                ▋
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
