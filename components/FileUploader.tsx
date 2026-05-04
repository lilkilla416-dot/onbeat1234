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

  const bg = dragging
    ? 'rgba(99,102,241,0.12)'
    : loaded
      ? 'rgba(16,185,129,0.07)'
      : 'var(--s2)';

  const border = dragging
    ? '1px solid rgba(99,102,241,0.55)'
    : loaded
      ? '1px solid rgba(16,185,129,0.3)'
      : '1px solid var(--b2)';

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="relative flex flex-col items-center justify-center gap-1.5
        rounded-xl cursor-pointer select-none py-3 px-3 min-h-[72px]
        transition-all duration-200"
      style={{ background: bg, border }}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />

      <div className="text-[10px] font-medium uppercase tracking-widest"
        style={{ color: 'var(--text-3)' }}>{label}</div>

      {loaded && fileName ? (
        <>
          <div className="text-xs truncate max-w-full px-2 text-center leading-tight"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-geist-mono)' }}>
            {fileName.replace(/\.[^/.]+$/, '')}
          </div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: '#10b981' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
            Loaded
          </div>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" style={{ color: 'var(--text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.1-1.343 2-3 2s-3-.9-3-2 1.343-2 3-2 3 .9 3 2zm12-3c0 1.1-1.343 2-3 2s-3-.9-3-2 1.343-2 3-2 3 .9 3 2z" />
          </svg>
          <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>Drop or click</div>
        </>
      )}
    </div>
  );
}
