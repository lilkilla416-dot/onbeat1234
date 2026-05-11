"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, RotateCcw } from "lucide-react"
import type { AgentDef } from "./agentDefs"

type Status = "idle" | "thinking" | "streaming" | "done"

interface Props {
  agent: AgentDef
  artistName: string
  externalTrigger?: number
}

function ThinkingDots({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-2 py-4 px-5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block rounded-full"
          style={{ width: 7, height: 7, background: accent }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}
      <span className="text-[11px] ml-1 font-semibold" style={{ color: accent }}>
        Thinking…
      </span>
    </div>
  )
}

export default function AgentCard({ agent, artistName, externalTrigger }: Props) {
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
    if (!externalTrigger) return
    startRun()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTrigger])

  useEffect(() => {
    if (status !== "streaming") return
    const allLines = agent.generate(artistName || "Your Artist").split("\n")
    let i = 0
    intervalRef.current = setInterval(() => {
      setVisibleLines(allLines.slice(0, i + 1))
      i++
      if (i >= allLines.length) {
        clearInterval(intervalRef.current!)
        setStatus("done")
      }
    }, 52)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    if (outputRef.current && status !== "idle") {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [visibleLines, status])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (thinkRef.current) clearTimeout(thinkRef.current)
    }
  }, [])

  const statusMeta = {
    idle: { label: "READY", color: "#2a2a44" },
    thinking: { label: "THINKING", color: "#fbbf24" },
    streaming: { label: "WORKING", color: "#4ade80" },
    done: { label: "DONE", color: "#6c63ff" },
  }[status]

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "#0b0b17",
        border: `1px solid ${status === "idle" ? "#1a1a2e" : agent.accent + "30"}`,
        boxShadow: isActive ? `0 0 28px ${agent.accent}15` : "none",
        transition: "border-color 0.35s, box-shadow 0.35s",
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-[3px] w-full"
        style={{
          background: status === "idle"
            ? "#1a1a2e"
            : `linear-gradient(90deg, ${agent.accent} 0%, ${agent.accent}40 100%)`,
          transition: "background 0.35s",
        }}
      />

      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[15px] font-black"
          style={{
            background: agent.accent + "15",
            border: `1px solid ${agent.accent}30`,
            color: agent.accent,
            boxShadow: status !== "idle" ? `0 0 14px ${agent.accent}25` : "none",
            transition: "box-shadow 0.35s",
          }}
        >
          {agent.name.charAt(0)}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[14px] font-black text-white">{agent.name}</span>
            <span
              className="text-[8px] font-black tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
              style={{
                background: statusMeta.color + "18",
                color: statusMeta.color,
                transition: "all 0.3s",
              }}
            >
              {statusMeta.label}
            </span>
          </div>
          <p className="text-[12px] font-bold" style={{ color: agent.accent }}>
            {agent.role}
          </p>
          <p className="text-[10px] text-[#3a3a5a] mt-0.5 font-medium">{agent.specialty}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {status === "done" && (
            <motion.button
              onClick={reset}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#ffffff08", color: "#3a3a5a" }}
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
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl"
            style={{
              background: isActive ? agent.accent + "20" : agent.accent,
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

      {/* Divider */}
      <div className="mx-5 h-px bg-[#1a1a2e]" />

      {/* Body */}
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.p
            key="brief"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 text-[11px] text-[#3a3a5a] leading-relaxed"
          >
            {agent.brief}
          </motion.p>
        )}

        {status === "thinking" && (
          <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ThinkingDots accent={agent.accent} />
          </motion.div>
        )}

        {(status === "streaming" || status === "done") && (
          <motion.div
            key="output"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            ref={outputRef}
            className="overflow-y-auto font-mono text-[11px] leading-[1.55] px-5 py-3"
            style={{ maxHeight: "280px", color: agent.accent + "cc", scrollbarWidth: "none" }}
          >
            {visibleLines.map((line, i) => (
              <div key={i} style={{ minHeight: "1.55em" }}>
                {line || " "}
              </div>
            ))}
            {status === "streaming" && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.55, repeat: Infinity }}
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
