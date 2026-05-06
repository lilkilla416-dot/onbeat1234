"use client"

import { motion } from "framer-motion"
import { Shirt, Sparkles, Crown } from "lucide-react"

export interface MerchItemConfig {
  id: "hoodie" | "stickers" | "cap"
  name: string
  badge: string
}

interface Props {
  item: MerchItemConfig
  artistName: string
}

const STYLES = {
  hoodie: {
    Icon: Shirt,
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    thumbGradient: "linear-gradient(135deg, #6c63ff22 0%, #6c63ff44 100%)",
    accent: "#6c63ff",
    glow: "rgba(108,99,255,0.25)",
  },
  stickers: {
    Icon: Sparkles,
    gradient: "linear-gradient(135deg, #1c0a22 0%, #2a1050 100%)",
    thumbGradient: "linear-gradient(135deg, #ff3cac22 0%, #ff3cac44 100%)",
    accent: "#ff3cac",
    glow: "rgba(255,60,172,0.25)",
  },
  cap: {
    Icon: Crown,
    gradient: "linear-gradient(135deg, #111800 0%, #1e2a00 100%)",
    thumbGradient: "linear-gradient(135deg, #ffd70022 0%, #ffd70044 100%)",
    accent: "#ffd700",
    glow: "rgba(255,215,0,0.2)",
  },
} as const

export default function MerchItem({ item, artistName }: Props) {
  const s = STYLES[item.id]
  const { Icon } = s
  const displayName = artistName.trim() || "ARTIST"
  const subject = encodeURIComponent(`Merch Inquiry: ${displayName} - ${item.name}`)
  const href = `mailto:Lilkilla416@gmail.com?subject=${subject}`

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        background: s.gradient,
        borderColor: `${s.accent}25`,
      }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Product thumbnail mockup */}
        <div
          className="w-[60px] h-[60px] rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden"
          style={{ background: s.thumbGradient }}
        >
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(${s.accent}30 1px, transparent 1px)`,
              backgroundSize: "8px 8px",
            }}
          />
          {/* Artist initial watermark */}
          <span
            className="absolute text-[32px] font-black leading-none select-none"
            style={{ color: `${s.accent}18`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
          >
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span
            className="relative z-10 flex"
            style={{ color: s.accent, filter: `drop-shadow(0 0 4px ${s.accent})` }}
          >
            <Icon size={22} />
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="text-[12px] font-bold text-white leading-tight">{item.name}</p>
            <span
              className="text-[8px] font-black tracking-[0.12em] uppercase shrink-0 px-2 py-0.5 rounded-full"
              style={{ background: `${s.accent}18`, color: s.accent }}
            >
              {item.badge}
            </span>
          </div>
          <p
            className="text-[10px] font-semibold tracking-widest truncate mb-2"
            style={{ color: `${s.accent}60` }}
          >
            {displayName.toUpperCase()} × OFFICIAL
          </p>
          <motion.a
            href={href}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center text-[10px] font-black tracking-[0.1em] uppercase text-black px-3 py-1.5 rounded-lg"
            style={{
              background: s.accent,
              boxShadow: `0 0 10px ${s.glow}`,
            }}
          >
            Custom Order
          </motion.a>
        </div>
      </div>
    </div>
  )
}
