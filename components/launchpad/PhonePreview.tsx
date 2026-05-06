"use client"

import { motion } from "framer-motion"
import { Music, Music2, Camera, ExternalLink } from "lucide-react"
import type { ArtistData } from "../ArtistLaunchpad"
import MerchItem, { type MerchItemConfig } from "./MerchItem"

interface Props {
  data: ArtistData
}

const MERCH_ITEMS: MerchItemConfig[] = [
  { id: "hoodie", name: "Custom Tour Hoodie", badge: "LIMITED" },
  { id: "stickers", name: "Limited Sticker Pack", badge: "DROPS SOON" },
  { id: "cap", name: "Artist Signature Cap", badge: "EXCLUSIVE" },
]

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url.trim()) return null
  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return `https://www.youtube.com/embed/${m[1]}`
  }
  return null
}

function SocialLink({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-150 group"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      <span style={{ color, display: "flex" }}><Icon size={15} /></span>
      <span className="text-[13px] font-semibold text-white flex-1">{label}</span>
      <ExternalLink
        size={11}
        className="text-white/20 group-hover:text-white/50 transition-colors"
      />
    </a>
  )
}

export default function PhonePreview({ data }: Props) {
  const embedUrl = getYouTubeEmbedUrl(data.youtubeUrl)
  const initial = (data.name.trim() || "A").charAt(0).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
      style={{ width: "305px" }}
    >
      {/* Ambient glow behind the phone */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "-24px",
          background: "radial-gradient(ellipse at 50% 50%, rgba(108,99,255,0.12) 0%, transparent 70%)",
          borderRadius: "60px",
        }}
      />

      {/* Phone chassis */}
      <div
        className="relative"
        style={{
          borderRadius: "46px",
          background: "linear-gradient(160deg, #1e1e28 0%, #0d0d14 40%, #090910 100%)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.07), 0 32px 64px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)",
          padding: "11px",
        }}
      >
        {/* Side buttons (decorative) */}
        <div
          className="absolute"
          style={{
            right: "-3px",
            top: "120px",
            width: "3px",
            height: "50px",
            background: "#1a1a22",
            borderRadius: "0 2px 2px 0",
          }}
        />
        <div
          className="absolute"
          style={{
            left: "-3px",
            top: "100px",
            width: "3px",
            height: "30px",
            background: "#1a1a22",
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          className="absolute"
          style={{
            left: "-3px",
            top: "140px",
            width: "3px",
            height: "50px",
            background: "#1a1a22",
            borderRadius: "2px 0 0 2px",
          }}
        />

        {/* Dynamic Island */}
        <div
          className="absolute z-20"
          style={{
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "88px",
            height: "24px",
            background: "#000",
            borderRadius: "12px",
          }}
        />

        {/* Screen bezel */}
        <div
          style={{
            borderRadius: "36px",
            overflow: "hidden",
            height: "630px",
            background: "#080812",
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-7 pt-3 pb-0 relative z-10">
            <span className="text-[11px] font-semibold text-white/60">9:41</span>
            <div className="flex items-center gap-1">
              {/* Signal bars */}
              {[3, 5, 7, 9].map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-[1px] bg-white/60"
                  style={{ height: `${h}px` }}
                />
              ))}
              {/* Wifi */}
              <div className="ml-1 w-[15px] h-[11px] relative flex items-end justify-center gap-[2px]">
                {[10, 7, 4].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-full border-t-2 border-white/60 absolute"
                    style={{
                      width: `${s}px`,
                      height: `${s}px`,
                      bottom: 0,
                      borderLeftColor: "transparent",
                      borderRightColor: "transparent",
                    }}
                  />
                ))}
              </div>
              {/* Battery */}
              <div className="ml-1 relative flex items-center">
                <div
                  className="border border-white/60 rounded-[2px] relative overflow-hidden"
                  style={{ width: "20px", height: "11px" }}
                >
                  <div className="absolute inset-[2px] right-[4px] bg-white/60 rounded-[1px]" />
                </div>
                <div
                  className="absolute bg-white/40 rounded-r-[1px]"
                  style={{ right: "-3px", width: "2px", height: "5px" }}
                />
              </div>
            </div>
          </div>

          {/* Scrollable page content */}
          <div
            className="overflow-y-auto"
            style={{ height: "calc(100% - 28px)", scrollbarWidth: "none" }}
          >
            {/* Hero section */}
            <div className="relative pt-10 pb-6 px-5 flex flex-col items-center text-center">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(108,99,255,0.22) 0%, rgba(8,8,18,0) 65%)",
                }}
              />

              {/* Profile image */}
              <div className="relative z-10 mb-3">
                {data.profilePicUrl.trim() ? (
                  <img
                    src={data.profilePicUrl}
                    alt="Artist"
                    className="w-[76px] h-[76px] rounded-full object-cover"
                    style={{ border: "2px solid rgba(108,99,255,0.5)" }}
                  />
                ) : (
                  <div
                    className="w-[76px] h-[76px] rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #6c63ff 0%, #ff3cac 100%)",
                      boxShadow: "0 0 20px rgba(108,99,255,0.4)",
                    }}
                  >
                    <span className="text-[28px] font-black text-white">{initial}</span>
                  </div>
                )}
              </div>

              {/* Artist name — animates on change */}
              <motion.h1
                key={data.name}
                initial={{ opacity: 0.4, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 text-[17px] font-black text-white tracking-widest uppercase leading-tight"
              >
                {data.name.trim() || "YOUR ARTIST NAME"}
              </motion.h1>
              <p
                className="relative z-10 text-[10px] font-bold tracking-[0.3em] uppercase mt-1"
                style={{ color: "#6c63ff" }}
              >
                Official Artist Page
              </p>
            </div>

            {/* Social links */}
            {(data.spotifyUrl || data.appleMusicUrl || data.instagramUrl) && (
              <div className="px-5 space-y-2 mb-5">
                {data.spotifyUrl && (
                  <SocialLink
                    href={data.spotifyUrl}
                    icon={Music}
                    label="Listen on Spotify"
                    color="#1DB954"
                  />
                )}
                {data.appleMusicUrl && (
                  <SocialLink
                    href={data.appleMusicUrl}
                    icon={Music2}
                    label="Apple Music"
                    color="#fc3c44"
                  />
                )}
                {data.instagramUrl && (
                  <SocialLink
                    href={data.instagramUrl}
                    icon={Camera}
                    label="Follow on Instagram"
                    color="#E1306C"
                  />
                )}
              </div>
            )}

            {/* YouTube embed */}
            {embedUrl && (
              <div className="px-5 mb-5">
                <div
                  className="relative overflow-hidden rounded-2xl bg-black"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Merch section */}
            <div className="px-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-black tracking-[0.2em] text-white uppercase">
                  Official Merch
                </h2>
                <span
                  className="text-[8px] font-black tracking-[0.12em] uppercase px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(108,99,255,0.15)", color: "#6c63ff" }}
                >
                  Custom Order
                </span>
              </div>
              <div className="space-y-2.5">
                {MERCH_ITEMS.map((item) => (
                  <MerchItem key={item.id} item={item} artistName={data.name} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-8 text-center">
              <div className="h-px bg-[#1c1c30] mb-4" />
              <p className="text-[9px] font-semibold tracking-widest text-[#28283e] uppercase">
                Merch inquiries → Lilkilla416@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Home indicator */}
      <div
        className="absolute bottom-[14px] left-1/2 -translate-x-1/2 rounded-full"
        style={{ width: "100px", height: "4px", background: "rgba(255,255,255,0.18)" }}
      />

      <p
        className="text-center mt-4 text-[9px] font-black tracking-[0.35em] uppercase"
        style={{ color: "#22223a" }}
      >
        Live Preview
      </p>
    </motion.div>
  )
}
