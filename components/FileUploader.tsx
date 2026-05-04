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
        relative flex flex-col items-center justify-center gap-1.5
        rounded-xl cursor-pointer select-none transition-all duration-200 py-3 px-3 min-h-[72px]
        ${dragging
          ? 'bg-indigo-500/15 border border-indigo-400/50'
          : loaded
            ? 'bg-emerald-500/8 border border-emerald-500/25 hover:bg-emerald-500/12'
            : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.055] hover:border-white/[0.13]'}
      `}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />

      <div className="text-[10px] text-white/30 uppercase tracking-widest font-medium">{label}</div>

      {loaded && fileName ? (
        <>
          <div className="text-xs text-white/70 truncate max-w-full px-2 text-center leading-tight"
            style={{ fontFamily: 'var(--font-geist-mono)' }}>
            {fileName.replace(/\.[^/.]+$/, '')}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Loaded
          </div>
        </>
      ) : (
        <>
          <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.1-1.343 2-3 2s-3-.9-3-2 1.343-2 3-2 3 .9 3 2zm12-3c0 1.1-1.343 2-3 2s-3-.9-3-2 1.343-2 3-2 3 .9 3 2z" />
          </svg>
          <div className="text-[10px] text-white/20">Drop or click</div>
        </>
      )}
    </div>
  );
}
