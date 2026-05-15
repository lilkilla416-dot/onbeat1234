"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pencil, Check, ExternalLink } from "lucide-react"
import AgentCard from "./AgentCard"
import UploadZone from "./UploadZone"
import { AGENTS } from "./agentDefs"
import type { AgentContext } from "./agentDefs"

export default function AgentDashboard() {
  const [artist, setArtist] = useState("Your Artist")
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState("Your Artist")
  const [tikTok, setTikTok] = useState("")
  const [tikTokDraft, setTikTokDraft] = useState("")
  const [editingTikTok, setEditingTikTok] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [track, setTrack] = useState<File | null>(null)
  const [pdf, setPdf] = useState<File | null>(null)
  const [triggers, setTriggers] = useState<number[]>(AGENTS.map(() => 0))
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)
  const tikTokInputRef = useRef<HTMLInputElement>(null)

  const ctx: AgentContext = {
    artist,
    tikTok: tikTok.replace(/^@/, ""),
    photoName: photo?.name ?? "",
    trackName: track ? track.name.replace(/\.[^.]+$/, "") : "",
    pdfName: pdf?.name ?? "",
  }

  const briefAll = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = AGENTS.map((_, i) =>
      setTimeout(() => {
        setTriggers((prev) => { const n = [...prev]; n[i] = (n[i] ?? 0) + 1; return n })
      }, i * 320)
    )
  }

  const commitName = () => {
    const t = nameDraft.trim()
    if (t) setArtist(t)
    else setNameDraft(artist)
    setEditingName(false)
  }

  const commitTikTok = () => {
    setTikTok(tikTokDraft.trim().replace(/^@/, ""))
    setEditingTikTok(false)
  }

  useEffect(() => { if (editingName) nameInputRef.current?.focus() }, [editingName])
  useEffect(() => { if (editingTikTok) tikTokInputRef.current?.focus() }, [editingTikTok])
  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), [])

  const assetsReady = [photo, track, pdf].filter(Boolean).length

  return (
    <div className="min-h-screen" style={{ background: "#06060e" }}>

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{ background: "rgba(6,6,14,0.92)", backdropFilter: "blur(12px)", borderColor: "#12122a" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          {/* Logo mark */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-1">
              {["#c8ff00", "#ff5e78", "#34d399"].map((c) => (
                <span key={c} className="block w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 5px ${c}` }} />
              ))}
            </div>
            <span className="text-[10px] font-black tracking-[0.4em] text-white uppercase hidden sm:block">
              Drop Desk
            </span>
          </div>

          <div className="w-px h-4 bg-[#1c1c30] shrink-0" />

          {/* Artist name */}
          <div className="flex items-center gap-1.5 min-w-0">
            {editingName ? (
              <>
                <input
                  ref={nameInputRef}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setNameDraft(artist); setEditingName(false) } }}
                  className="text-[13px] font-black text-white bg-transparent border-b outline-none w-36 pb-0.5"
                  style={{ borderColor: "#c8ff00" }}
                  placeholder="Artist name"
                />
                <motion.button onClick={commitName} whileTap={{ scale: 0.9 }}
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: "#c8ff00" }}>
                  <Check size={10} color="#000" />
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={() => { setNameDraft(artist); setEditingName(true) }}
                whileHover={{ opacity: 0.75 }}
                className="flex items-center gap-1.5 text-[13px] font-black text-white truncate"
              >
                {artist}<Pencil size={10} className="text-[#32324a] shrink-0" />
              </motion.button>
            )}
          </div>

          <div className="flex-1" />

          {/* Brief All */}
          <motion.button
            onClick={briefAll}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-black px-4 py-2.5 rounded-xl shrink-0"
            style={{
              background: "linear-gradient(135deg, #c8ff00 0%, #34d399 100%)",
              boxShadow: "0 0 20px rgba(200,255,0,0.2)",
            }}
          >
            <Play size={10} />
            Brief All Agents
          </motion.button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6">

        {/* ── HERO ── */}
        <div className="pt-12 pb-8">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-[10px] font-black tracking-[0.5em] uppercase mb-3" style={{ color: "#c8ff00" }}>
              Music Label · Promo Suite
            </p>
            <h1 className="text-[44px] sm:text-[56px] font-black leading-none tracking-tight text-white mb-4">
              THE DROP<br />
              <span style={{
                backgroundImage: "linear-gradient(135deg, #c8ff00 0%, #34d399 60%, #7c9eff 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>DESK</span>
            </h1>
            <p className="text-[13px] max-w-xl leading-relaxed" style={{ color: "#38385a" }}>
              Upload your cover art, track, and press kit — then brief your five specialist agents
              to generate a full marketing and promotion plan in seconds.
            </p>
          </motion.div>
        </div>

        {/* ── UPLOAD STEPS ── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase text-white">Upload Your Assets</p>
            {assetsReady > 0 && (
              <span
                className="text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
                style={{ background: "#c8ff0018", color: "#c8ff00" }}
              >
                {assetsReady}/3 ready
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <UploadZone
                step={1}
                label="Cover Art"
                subLabel="Promo photo or single artwork"
                accept={["jpeg", "jpg", "png", "image/jpeg", "image/png"]}
                acceptDesc="JPEG · PNG"
                color="#ff5e78"
                preview="image"
                file={photo}
                onFile={setPhoto}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <UploadZone
                step={2}
                label="Your Track"
                subLabel="MP3 or WAV to preview and pitch"
                accept={["mp3", "wav", "audio/mpeg", "audio/wav"]}
                acceptDesc="MP3 · WAV"
                color="#ffb347"
                preview="audio"
                file={track}
                onFile={setTrack}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <UploadZone
                step={3}
                label="Press Kit"
                subLabel="One-sheet or EPK for media pitching"
                accept={["pdf", "application/pdf"]}
                acceptDesc="PDF"
                color="#7c9eff"
                preview="pdf"
                file={pdf}
                onFile={setPdf}
              />
            </motion.div>
          </div>
        </section>

        {/* ── TIKTOK ── */}
        <section className="mb-12">
          <div
            className="rounded-2xl border p-5"
            style={{ background: "#0b0b14", borderColor: tikTok ? "#25F4EE28" : "#12122a" }}
          >
            <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
              {/* TikTok logo block */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-[11px]"
                style={{ background: "linear-gradient(135deg, #25F4EE20 0%, #FE2C5520 100%)", color: "#25F4EE" }}
              >
                TT
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-white mb-0.5">Connect TikTok Account</p>
                <p className="text-[10px] mb-3" style={{ color: "#38385a" }}>
                  Your handle unlocks TikTok-specific strategy in every agent's output.
                </p>

                {editingTikTok ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold" style={{ color: "#25F4EE" }}>@</span>
                    <input
                      ref={tikTokInputRef}
                      value={tikTokDraft}
                      onChange={(e) => setTikTokDraft(e.target.value.replace(/^@/, ""))}
                      onKeyDown={(e) => { if (e.key === "Enter") commitTikTok(); if (e.key === "Escape") setEditingTikTok(false) }}
                      placeholder="yourhandle"
                      className="bg-transparent outline-none text-[13px] font-bold text-white border-b flex-1"
                      style={{ borderColor: "#25F4EE" }}
                    />
                    <motion.button onClick={commitTikTok} whileTap={{ scale: 0.9 }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "#25F4EE" }}>
                      <Check size={12} color="#000" />
                    </motion.button>
                  </div>
                ) : tikTok ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#25F4EE", boxShadow: "0 0 6px #25F4EE" }}
                      />
                      <span className="text-[13px] font-black text-white">@{tikTok}</span>
                    </div>
                    <a
                      href={"https://tiktok.com/@" + tikTok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold"
                      style={{ color: "#25F4EE" }}
                    >
                      View profile <ExternalLink size={9} />
                    </a>
                    <button
                      onClick={() => { setTikTokDraft(tikTok); setEditingTikTok(true) }}
                      className="text-[10px] font-bold"
                      style={{ color: "#38385a" }}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => { setTikTokDraft(""); setEditingTikTok(true) }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="text-[11px] font-black tracking-wide px-4 py-2 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, #25F4EE18 0%, #FE2C5518 100%)",
                      border: "1px solid #25F4EE30",
                      color: "#25F4EE",
                    }}
                  >
                    + Add TikTok handle
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── AGENT TEAM ── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black tracking-[0.4em] uppercase text-white">Agent Team</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#38385a" }}>
                Agents use your uploads and TikTok handle to personalise every output.
              </p>
            </div>
            <AnimatePresence>
              {(assetsReady > 0 || tikTok) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full"
                  style={{ background: "#c8ff0012", color: "#c8ff00", border: "1px solid #c8ff0025" }}
                >
                  <span className="w-1 h-1 rounded-full bg-[#c8ff00]" />
                  Assets loaded
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <AgentCard agent={agent} ctx={ctx} externalTrigger={triggers[i]} />
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
