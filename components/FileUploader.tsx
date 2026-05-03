'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';

interface Props {
  label: string;
  accept?: string;
  onFile: (file: File) => void;
  loaded?: boolean;
  fileName?: string;
}

export default function FileUploader({ label, accept = 'audio/*', onFile, loaded, fileName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-2
        border-2 rounded-lg cursor-pointer select-none
        transition-all duration-200 p-4 min-h-[100px]
        ${dragging
          ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_16px_#00ffcc66]'
          : loaded
            ? 'border-cyan-600 bg-cyan-950/20 shadow-[0_0_8px_#00ffcc33]'
            : 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-500'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      <div className="text-xs font-mono uppercase tracking-widest text-zinc-400">
        {label}
      </div>

      {loaded && fileName ? (
        <>
          <div className="text-cyan-400 text-sm font-mono truncate max-w-full px-2">
            {fileName}
          </div>
          <div className="text-xs text-cyan-600 font-mono">LOADED ✓</div>
        </>
      ) : (
        <>
          <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
          <div className="text-zinc-500 text-xs font-mono">
            DROP MP3/WAV OR CLICK
          </div>
        </>
      )}
    </div>
  );
}
