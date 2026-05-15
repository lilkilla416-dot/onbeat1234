"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, RotateCcw } from "lucide-react"
import type { AgentDef, AgentContext } from "./agentDefs"

type Status = "idle" | "thinking" | "streaming" | "done"

interface Props {
  agent: AgentDef
  ctx: AgentContext
  externalTrigger?: number
}

function Dots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block rounded-full"
          style={{ width: 6, height: 6, background: color }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
      <span className="text-[11px] font-semibold ml-1" style={{ color }}>Thinking…</span>
    </div>
  )
}

export default function AgentCard({ agent, ctx, externalTrigger }: Props) {
  const [status, setStatus] = useState<Status>("idle")
  const [lines, setLines] = useState<string[]>([])
  const outputRef = useRef<HTMLDivElement>(null)
  const ivlRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tmrRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startRun = () => {
    if (ivlRef.current) clearInterval(ivlRef.current)
    if (tmrRef.current) clearTimeout(tmrRef.current)
    setLines([])
    setStatus("thinking")
    tmrRef.current = setTimeout(() => setStatus("streaming"), 1400)
  }

  const reset = () => {
    if (ivlRef.current) clearInterval(ivlRef.current)
    if (tmrRef.current) clearTimeout(tmrRef.current)
    setLines([])
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
    const all = agent.generate(ctx).split("\n")
    let i = 0
    ivlRef.current = setInterval(() => {
      setLines(all.slice(0, i + 1))
      i++
      if (i >= all.length) { clearInterval(ivlRef.current!); setStatus("done") }
    }, 50)
    return () => { if (ivlRef.current) clearInterval(ivlRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    if (outputRef.current && status !== "idle") {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines, status])

  useEffect(() => () => {
    if (ivlRef.current) clearInterval(ivlRef.current)
    if (tmrRef.current) clearTimeout(tmrRef.current)
  }, [])

  const badge = { idle: "READY", thinking: "THINKING", streaming: "WORKING", done: "DONE" }[status]
  const badgeColor = { idle: "#2a2a44", thinking: "#ffb347", streaming: "#34d399", done: agent.accent }[status]

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "#0b0b14",
        border: `1px solid ${status === "idle" ? "#18182a" : agent.accent + "28"}`,
        boxShadow: isActive ? `0 0 32px ${agent.accent}10` : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          height: 2,
          background: status === "idle"
            ? "#18182a"
            : `linear-gradient(90deg, ${agent.accent} 0%, transparent 100%)`,
          transition: "background 0.3s",
        }}
      />

      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-black"
          style={{
            background: agent.accent + "12",
            border: `1px solid ${agent.accent}25`,
            color: agent.accent,
          }}
        >
          {agent.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-black text-white">{agent.name}</span>
            <span
              className="text-[8px] font-black tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
              style={{ background: badgeColor + "18", color: badgeColor, transition: "all 0.3s" }}
            >
              {badge}
            </span>
          </div>
          <p className="text-[11px] font-bold" style={{ color: agent.accent }}>{agent.role}</p>
          <p className="text-[10px] text-[#32324a] mt-0.5">{agent.specialty}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {status === "done" && (
            <motion.button
              onClick={reset}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#ffffff08", color: "#3a3a5a" }}
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

      <div style={{ height: 1, background: "#18182a", margin: "0 20px" }} />

      {/* Body */}
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.p key="brief" initial={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 text-[11px] leading-relaxed" style={{ color: "#38385a" }}>
            {agent.brief}
          </motion.p>
        )}
        {status === "thinking" && (
          <motion.div key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dots color={agent.accent} />
          </motion.div>
        )}
        {(status === "streaming" || status === "done") && (
          <motion.div key="out" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            ref={outputRef}
            className="overflow-y-auto font-mono text-[11px] leading-[1.6] px-5 py-3"
            style={{ maxHeight: 270, color: agent.accent + "bb", scrollbarWidth: "none" }}
          >
            {lines.map((line, i) => <div key={i} style={{ minHeight: "1.6em" }}>{line || " "}</div>)}
            {status === "streaming" && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ color: agent.accent }}
              >▋</motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
