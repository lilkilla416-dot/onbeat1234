"use client"

import { motion } from "framer-motion"
import {
  User,
  ImageIcon,
  Music,
  Music2,
  Camera,
  CirclePlay,
  Code2,
  ChevronRight,
  Link2,
} from "lucide-react"
import type { ArtistData } from "../ArtistLaunchpad"

interface Props {
  data: ArtistData
  onChange: (key: keyof ArtistData) => (val: string) => void
  onExport: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] font-black tracking-[0.25em] text-[#6c63ff] uppercase mb-3">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-[#3a3a5a] uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="relative flex items-center">
        <Icon size={13} className="absolute left-3 text-[#3a3a5a] pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0c0c18] border border-[#1c1c30] rounded-lg pl-8 pr-3 py-2.5 text-[13px] text-[#c0c0d8] placeholder:text-[#28283e] focus:outline-none focus:border-[#6c63ff] focus:bg-[#0e0e1c] transition-all duration-150"
        />
      </div>
    </div>
  )
}

export default function ControlPanel({ data, onChange, onExport }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-5 border-b border-[#1c1c30] shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#6c63ff]"
            style={{ boxShadow: "0 0 6px #6c63ff, 0 0 12px #6c63ff80" }}
          />
          <span className="text-[9px] font-black tracking-[0.4em] text-[#6c63ff] uppercase">
            Artist Launchpad
          </span>
        </div>
        <h1 className="text-[22px] font-black text-white leading-none tracking-tight">
          BUILD YOUR PAGE
        </h1>
        <p className="text-[11px] text-[#3a3a5a] mt-1.5">
          Edit on the left · live preview on the right
        </p>
      </div>

      {/* Scrollable inputs */}
      <div className="flex-1 overflow-y-auto">
        <Section title="Identity">
          <InputField
            icon={User}
            label="Artist Name"
            value={data.name}
            onChange={onChange("name")}
            placeholder="e.g. LilKilla416"
          />
          <InputField
            icon={ImageIcon}
            label="Profile Picture URL"
            value={data.profilePicUrl}
            onChange={onChange("profilePicUrl")}
            placeholder="https://..."
          />
        </Section>

        <div className="mx-5 h-px bg-[#1c1c30]" />

        <Section title="Links">
          <InputField
            icon={Music}
            label="Spotify"
            value={data.spotifyUrl}
            onChange={onChange("spotifyUrl")}
            placeholder="https://open.spotify.com/..."
          />
          <InputField
            icon={Music2}
            label="Apple Music"
            value={data.appleMusicUrl}
            onChange={onChange("appleMusicUrl")}
            placeholder="https://music.apple.com/..."
          />
          <InputField
            icon={Camera}
            label="Instagram"
            value={data.instagramUrl}
            onChange={onChange("instagramUrl")}
            placeholder="https://instagram.com/..."
          />
        </Section>

        <div className="mx-5 h-px bg-[#1c1c30]" />

        <Section title="The Drop">
          <InputField
            icon={CirclePlay}
            label="YouTube Link"
            value={data.youtubeUrl}
            onChange={onChange("youtubeUrl")}
            placeholder="https://youtube.com/watch?v=..."
          />
          <p className="text-[11px] text-[#2e2e48] leading-relaxed">
            Drop a music video or trailer — it embeds automatically in the preview.
          </p>
        </Section>

        <div className="mx-5 h-px bg-[#1c1c30]" />

        {/* Merch callout */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-black tracking-[0.25em] text-[#6c63ff] uppercase mb-3">
            Merch Engine
          </p>
          <div
            className="rounded-xl p-4 border border-[#6c63ff]/20"
            style={{
              background:
                "linear-gradient(135deg, rgba(108,99,255,0.08) 0%, rgba(255,60,172,0.04) 100%)",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Link2 size={12} className="text-[#6c63ff]" />
              <span className="text-[11px] font-bold text-white">Auto-wired to your email</span>
            </div>
            <p className="text-[10px] text-[#4a4a6a] leading-relaxed">
              Every &ldquo;Custom Order&rdquo; button opens an email to{" "}
              <span className="text-[#6c63ff]">Lilkilla416@gmail.com</span> — your 24/7 lead
              generation machine.
            </p>
          </div>
        </div>
      </div>

      {/* Generate Code CTA */}
      <div className="px-5 py-4 border-t border-[#1c1c30] shrink-0">
        <motion.button
          onClick={onExport}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-between text-white font-black text-[13px] px-5 py-3.5 rounded-xl tracking-wide"
          style={{
            background: "linear-gradient(135deg, #6c63ff 0%, #8b5cf6 100%)",
            boxShadow: "0 0 20px rgba(108,99,255,0.35), 0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Code2 size={15} />
            <span>GENERATE CODE</span>
          </div>
          <ChevronRight size={15} />
        </motion.button>
        <p className="text-[10px] text-[#28283e] text-center mt-2">
          Export a standalone HTML file you can host anywhere
        </p>
      </div>
    </div>
  )
}
