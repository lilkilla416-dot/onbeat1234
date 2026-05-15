"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload } from "lucide-react"

interface Props {
  step: number
  label: string
  subLabel: string
  accept: string[]
  acceptDesc: string
  color: string
  file: File | null
  preview: "image" | "audio" | "pdf"
  onFile: (f: File | null) => void
}

export default function UploadZone({
  step, label, subLabel, accept, acceptDesc, color, file, preview, onFile,
}: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const objUrl = file ? URL.createObjectURL(file) : null

  const validate = (f: File) =>
    accept.some((a) => f.type.includes(a) || f.name.toLowerCase().endsWith(a))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && validate(f)) onFile(f)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && validate(f)) onFile(f)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Step label */}
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
          style={{ background: color, color: "#000" }}
        >
          {step}
        </div>
        <div>
          <p className="text-[13px] font-black text-white tracking-wide">{label}</p>
          <p className="text-[10px] font-semibold" style={{ color: color + "99" }}>
            {subLabel}
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className="relative rounded-xl overflow-hidden transition-all duration-200"
        style={{
          border: `1.5px dashed ${dragging ? color : file ? color + "60" : "#232336"}`,
          background: dragging ? color + "08" : file ? color + "05" : "#0c0c18",
          cursor: file ? "default" : "pointer",
          minHeight: preview === "image" ? "180px" : "100px",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept.map((a) => (a.startsWith(".") ? a : "." + a)).join(",")}
          onChange={handleChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-2 p-6 h-full"
              style={{ minHeight: "inherit" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: color + "15" }}
              >
                <Upload size={18} style={{ color }} />
              </div>
              <p className="text-[11px] font-bold text-center" style={{ color: "#404060" }}>
                Drop file here or{" "}
                <span style={{ color }}>browse</span>
              </p>
              <p className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "#2a2a40" }}>
                {acceptDesc}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="filled"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Clear button */}
              <button
                onClick={(e) => { e.stopPropagation(); onFile(null) }}
                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#1a1a2e", border: "1px solid #2a2a44" }}
              >
                <X size={11} color="#888" />
              </button>

              {/* Image preview */}
              {preview === "image" && objUrl && (
                <img
                  src={objUrl}
                  alt="Cover"
                  className="w-full object-cover rounded-xl"
                  style={{ maxHeight: "200px" }}
                />
              )}

              {/* Audio preview */}
              {preview === "audio" && objUrl && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: color + "20" }}
                    >
                      <span style={{ color, fontSize: 14 }}>♪</span>
                    </div>
                    <p className="text-[12px] font-bold text-white truncate">{file.name}</p>
                  </div>
                  <audio controls src={objUrl} className="w-full" style={{ height: 32 }} />
                </div>
              )}

              {/* PDF preview */}
              {preview === "pdf" && (
                <div className="flex items-center gap-3 p-4">
                  <div
                    className="w-10 h-12 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black"
                    style={{ background: color + "20", color }}
                  >
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">{file.name}</p>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: color + "99" }}>
                      {(file.size / 1024).toFixed(0)} KB · Press Kit ready
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
