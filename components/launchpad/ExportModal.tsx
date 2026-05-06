"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Copy, Check, Download, Zap } from "lucide-react"
import type { ArtistData } from "../ArtistLaunchpad"

interface Props {
  data: ArtistData
  onClose: () => void
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function generateHtml(data: ArtistData): string {
  const { name, profilePicUrl, spotifyUrl, appleMusicUrl, instagramUrl, youtubeUrl } = data
  const displayName = name.trim() || "Artist"
  const initial = displayName.charAt(0).toUpperCase()

  const profileBlock = profilePicUrl.trim()
    ? `<img src="${profilePicUrl}" alt="${displayName}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid rgba(108,99,255,0.5);">`
    : `<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#6c63ff,#ff3cac);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;flex-shrink:0;">${initial}</div>`

  const linkRow = (color: string, icon: string, label: string, href: string) =>
    `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;text-decoration:none;color:#e2e2f0;font-weight:600;font-size:13px;margin-bottom:8px;">
      <span style="color:${color};font-size:16px;">${icon}</span>
      <span>${label}</span>
      <span style="margin-left:auto;opacity:.3;">↗</span>
    </a>`

  const linksBlock = [
    spotifyUrl && linkRow("#1DB954", "♫", "Listen on Spotify", spotifyUrl),
    appleMusicUrl && linkRow("#fc3c44", "♫", "Apple Music", appleMusicUrl),
    instagramUrl && linkRow("#E1306C", "◈", "Follow on Instagram", instagramUrl),
  ]
    .filter(Boolean)
    .join("\n")

  const ytId = extractYouTubeId(youtubeUrl)
  const videoBlock = ytId
    ? `<div style="padding:0 20px 24px;">
        <div style="position:relative;padding-bottom:56.25%;height:0;border-radius:14px;overflow:hidden;background:#000;">
          <iframe src="https://www.youtube.com/embed/${ytId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>
        </div>
      </div>`
    : ""

  const MERCH = [
    { id: "hoodie", name: "Custom Tour Hoodie", badge: "LIMITED", bg: "#1a1a2e", accent: "#6c63ff" },
    { id: "stickers", name: "Limited Sticker Pack", badge: "DROPS SOON", bg: "#1c0a22", accent: "#ff3cac" },
    { id: "cap", name: "Artist Signature Cap", badge: "EXCLUSIVE", bg: "#111800", accent: "#ffd700" },
  ]

  const merchRows = MERCH.map(({ name: itemName, badge, bg, accent }) => {
    const subject = encodeURIComponent(`Merch Inquiry: ${displayName} - ${itemName}`)
    return `
      <div style="display:flex;align-items:center;gap:12px;background:${bg};border:1px solid ${accent}25;border-radius:14px;padding:12px;margin-bottom:10px;">
        <div style="width:52px;height:52px;border-radius:10px;background:${accent}18;border:1px solid ${accent}28;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:${accent}30;">${initial}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px;">
            <span style="font-size:12px;font-weight:700;color:#fff;">${itemName}</span>
            <span style="font-size:8px;font-weight:800;letter-spacing:.1em;color:${accent};background:${accent}18;padding:2px 7px;border-radius:20px;white-space:nowrap;">${badge}</span>
          </div>
          <p style="font-size:10px;color:${accent}60;font-weight:600;letter-spacing:.1em;margin:0 0 8px;">${displayName.toUpperCase()} × OFFICIAL</p>
          <a href="mailto:Lilkilla416@gmail.com?subject=${subject}" style="display:inline-block;background:${accent};color:#000;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;padding:5px 12px;border-radius:7px;">Custom Order</a>
        </div>
      </div>`
  }).join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${displayName} – Official Page</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Inter',sans-serif;background:#080810;color:#e2e2f0;min-height:100vh;display:flex;justify-content:center;}
    .wrap{width:100%;max-width:480px;padding-bottom:60px;}
    .hero{background:linear-gradient(180deg,rgba(108,99,255,.2) 0%,#080810 60%);padding:64px 20px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;}
    .name{font-size:22px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#fff;margin:14px 0 4px;}
    .sub{font-size:10px;font-weight:700;color:#6c63ff;letter-spacing:.3em;text-transform:uppercase;}
    .links{padding:0 20px 20px;}
    .merch-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
    .merch-title{font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#fff;}
    .merch-badge{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6c63ff;background:rgba(108,99,255,.12);padding:3px 9px;border-radius:20px;}
    .merch{padding:0 20px 32px;}
    .foot{text-align:center;font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.12);padding:16px 20px 0;border-top:1px solid rgba(255,255,255,.05);}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      ${profileBlock}
      <h1 class="name">${displayName}</h1>
      <p class="sub">Official Artist Page</p>
    </div>
    ${linksBlock ? `<div class="links">${linksBlock}</div>` : ""}
    ${videoBlock}
    <div class="merch">
      <div class="merch-head">
        <h2 class="merch-title">Official Merch</h2>
        <span class="merch-badge">Custom Order</span>
      </div>
      ${merchRows}
    </div>
    <p class="foot">Merch inquiries → Lilkilla416@gmail.com</p>
  </div>
</body>
</html>`
}

export default function ExportModal({ data, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const html = generateHtml(data)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const handleDownload = () => {
    const slug = (data.name.trim() || "artist").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${slug}-page.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 12 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden border"
        style={{ background: "#0c0c18", borderColor: "#1c1c30" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "#1c1c30" }}
        >
          <div>
            <h2 className="text-[15px] font-black text-white tracking-wide">EXPORT YOUR PAGE</h2>
            <p className="text-[11px] text-[#3a3a5a] mt-0.5">
              Paste into any host — merch links stay wired to your email forever.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 text-[12px] font-black text-white px-4 py-2 rounded-lg tracking-wide"
              style={{ background: copied ? "#22c55e" : "#6c63ff" }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy HTML"}
            </motion.button>
            <motion.button
              onClick={handleDownload}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 text-[12px] font-bold text-white px-4 py-2 rounded-lg tracking-wide"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <Download size={13} />
              Download
            </motion.button>
            <button
              onClick={onClose}
              className="ml-1 text-[#3a3a5a] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Code block */}
        <div
          className="overflow-y-auto p-5"
          style={{ height: "320px", background: "#07070f" }}
        >
          <pre
            className="text-[11px] leading-relaxed whitespace-pre-wrap break-all font-mono"
            style={{ color: "#6c63ffbb" }}
          >
            {html}
          </pre>
        </div>

        {/* Footer note */}
        <div
          className="flex items-center gap-3 px-6 py-3 border-t"
          style={{ borderColor: "#1c1c30", background: "#0a0a14" }}
        >
          <Zap size={13} className="text-[#6c63ff] shrink-0" />
          <p className="text-[11px] text-[#3a3a5a]">
            All &ldquo;Custom Order&rdquo; buttons are hard-coded to{" "}
            <span style={{ color: "#6c63ff" }}>Lilkilla416@gmail.com</span> — your lead
            generation works even when you&apos;re offline.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
