'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const OFFSET = '0.133'
const FADE   = '0.2'
const EXTS   = ['mov', 'mp4']

type Status = 'pending' | 'processing' | 'done' | 'error'
type DestMode = 'next_to' | 'subfolder' | 'download'

interface VFile { file: File; id: string; status: Status; progress: number }
interface OutBlob { name: string; blob: Blob; size: number }

const s = {
  // Layout
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '32px 28px 28px' },
  app:  { width: '100%', maxWidth: '480px' },

  // Header
  hdr:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  wordmark: { fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' },
  badge:    { fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono), monospace' },

  // Drop zone
  drop: (hov: boolean) => ({
    border: `1.5px ${hov ? 'solid' : 'dashed'} var(--border2)`,
    borderRadius: '10px',
    background: hov ? 'var(--bg3)' : 'var(--bg2)',
    padding: '48px 24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: '10px',
  }),
  dropIcon:  (hov: boolean) => ({ fontSize: '28px', color: hov ? 'var(--text)' : 'var(--text2)', display: 'block', marginBottom: '10px', transition: 'color 0.15s' }),
  dropTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' },
  dropSub:   { fontSize: '12px', color: 'var(--text3)' },

  // List header
  listHdr:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' },
  clearBtn: { background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },
  count:    { fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono), monospace' },

  // File list scroll
  scroll: { maxHeight: '120px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: '3px', marginBottom: '14px' },

  // File row
  row:      { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg2)', borderRadius: '6px', padding: '0 14px', height: '42px' },
  rowDot:   { color: 'var(--text3)', fontSize: '18px', flexShrink: 0 },
  rowName:  { flex: 1, fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, minWidth: 0 },
  rowProg:  { fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono), monospace', width: '36px', textAlign: 'right' as const, flexShrink: 0 },
  rowStat:  { width: '20px', textAlign: 'center' as const, fontSize: '14px', flexShrink: 0 },

  // Dest section
  destWrap:  { marginBottom: '14px' },
  destTitle: { fontSize: '11px', fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.04em', marginBottom: '8px', textTransform: 'uppercase' as const },
  destRow:   { display: 'flex', gap: '6px' },
  destBtn:   (active: boolean) => ({
    flex: 1,
    height: '38px',
    background: active ? 'var(--bg4)' : 'var(--bg2)',
    color: active ? 'var(--text)' : 'var(--text3)',
    border: `1px solid ${active ? 'var(--border2)' : 'var(--border)'}`,
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.12s',
  }),

  // Custom folder row
  folderRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' },
  folderLbl: { flex: 1, fontSize: '12px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  browseBtn: { height: '28px', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '6px', fontSize: '12px', padding: '0 10px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },

  // Status + progress
  statusTxt: { textAlign: 'center' as const, fontSize: '12px', color: 'var(--text3)', minHeight: '18px', marginBottom: '8px', fontFamily: 'var(--font-mono), monospace' },
  pbarWrap:  { height: '2px', background: 'var(--bg3)', borderRadius: '1px', marginBottom: '16px', overflow: 'hidden' },
  pbarFill:  (pct: number) => ({ height: '100%', background: 'var(--text)', borderRadius: '1px', width: `${pct}%`, transition: 'width 0.3s ease' }),

  // Fix button
  fixBtn: (enabled: boolean) => ({
    width: '100%',
    height: '48px',
    background: enabled ? 'var(--text)' : 'var(--bg3)',
    color: enabled ? 'var(--bg)' : 'var(--text3)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: enabled ? 'pointer' : 'default',
    fontFamily: 'inherit',
    transition: 'all 0.12s',
  }),

  // Done overlay
  overlay:   { position: 'fixed' as const, inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 100 },
  doneTitle: { fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', textAlign: 'center' as const },
  doneSub:   { fontSize: '13px', color: 'var(--text2)', textAlign: 'center' as const },
  doneFiles: { display: 'flex', flexDirection: 'column' as const, gap: '6px', width: '100%', maxWidth: '400px', maxHeight: '200px', overflowY: 'auto' as const },
  doneLink:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '10px 14px', textDecoration: 'none', transition: 'background 0.12s' },
  dlAllBtn:  { width: '100%', maxWidth: '400px', height: '40px', background: 'var(--green)', color: '#0a1a0f', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  againBtn:  { height: '44px', width: '190px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },

  // Loading
  loadWrap: { position: 'fixed' as const, inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 200 },
  loadTitle: { fontSize: '18px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' },
  loadDots:  { display: 'flex', gap: '6px' },
  dot:       { width: '6px', height: '6px', background: 'var(--text3)', borderRadius: '50%' },
  loadTxt:   { fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono), monospace' },
}

function fmt(b: number) { return b > 1048576 ? (b/1048576).toFixed(1)+' MB' : (b/1024).toFixed(0)+' KB' }

export default function FixTok() {
  const [loaded, setLoaded]       = useState(false)
  const [files, setFiles]         = useState<VFile[]>([])
  const [busy, setBusy]           = useState(false)
  const [dest, setDest]           = useState<DestMode>('next_to')
  const [customDir, setCustomDir] = useState<string>('')
  const [outputs, setOutputs]     = useState<OutBlob[]>([])
  const [done, setDone]           = useState(false)
  const [hov, setHov]             = useState(false)
  const [statusTxt, setStatusTxt] = useState('')
  const [totalPct, setTotalPct]   = useState(0)
  const [showProgress, setShowProgress] = useState(false)
  const ffRef = useRef<any>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { createFFmpeg } = await import('@ffmpeg/ffmpeg')
        const ff = createFFmpeg({ log: false, corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' })
        await ff.load()
        ffRef.current = ff
        setLoaded(true)
      } catch { setLoaded(false) }
    })()
  }, [])

  async function collectEntry(entry: any, out: File[]) {
    if (entry.isFile) {
      const f: File = await new Promise(r => entry.file(r))
      if (EXTS.includes(f.name.split('.').pop()!.toLowerCase())) out.push(f)
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries: any[] = await new Promise(r => reader.readEntries(r))
      for (const e of entries) await collectEntry(e, out)
    }
  }

  function addFiles(newFiles: File[]) {
    setFiles(prev => {
      const ex = new Set(prev.map(f => f.file.name + f.file.size))
      return [...prev, ...newFiles
        .filter(f => !ex.has(f.name + f.size))
        .map(f => ({ file: f, id: Math.random().toString(36).slice(2), status: 'pending' as Status, progress: 0 }))]
    })
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setHov(false)
    const collected: File[] = []
    for (const item of [...e.dataTransfer.items]) {
      if (item.kind === 'file') {
        const entry = (item as any).webkitGetAsEntry?.()
        if (entry) await collectEntry(entry, collected)
        else { const f = item.getAsFile(); if (f && EXTS.includes(f.name.split('.').pop()!.toLowerCase())) collected.push(f) }
      }
    }
    addFiles(collected)
  }, [])

  function pickFiles() {
    const inp = document.createElement('input')
    inp.type = 'file'; inp.multiple = true; inp.accept = '.mov,.MOV,.mp4,.MP4'
    inp.onchange = () => addFiles([...(inp.files || [])])
    inp.click()
  }

  async function run() {
    if (!ffRef.current || !files.length) return
    setBusy(true); setShowProgress(true)
    const ff = ffRef.current
    const { fetchFile } = await import('@ffmpeg/ffmpeg')
    const results: OutBlob[] = []

    for (let i = 0; i < files.length; i++) {
      const vf = files[i]
      setStatusTxt(`${i + 1} of ${files.length} — ${vf.file.name}`)
      setFiles(prev => prev.map(f => f.id === vf.id ? { ...f, status: 'processing' } : f))

      try {
        const ext     = vf.file.name.split('.').pop()!
        const inName  = `in_${i}.${ext}`
        const outName = `fixed_${vf.file.name.replace(/\.[^.]+$/, '')}.mp4`

        ff.setProgress(({ ratio }: { ratio: number }) => {
          const r = Math.max(0, ratio)
          setFiles(prev => prev.map(f => f.id === vf.id ? { ...f, progress: Math.round(r * 100) } : f))
          setTotalPct(((i + r) / files.length) * 100)
        })

        await ff.writeFile(inName, await fetchFile(vf.file))
        await ff.run(
          '-i', inName, '-itsoffset', OFFSET, '-i', inName,
          '-filter_complex', `[1:a]afade=t=in:ss=0:d=${FADE},areverse,afade=t=in:ss=0:d=${FADE},areverse[a]`,
          '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac',
          '-map_metadata', '-1', '-movflags', '+faststart', outName
        )

        const data = ff.FS('readFile', outName)
        const blob = new Blob([data.buffer], { type: 'video/mp4' })
        results.push({ name: outName, blob, size: blob.size })
        ff.FS('unlink', inName); ff.FS('unlink', outName)
        setFiles(prev => prev.map(f => f.id === vf.id ? { ...f, status: 'done', progress: 100 } : f))
      } catch {
        setFiles(prev => prev.map(f => f.id === vf.id ? { ...f, status: 'error' } : f))
      }
    }

    setTotalPct(100); setStatusTxt('')
    setOutputs(results); setDone(true); setBusy(false)
  }

  function reset() {
    setDone(false); setFiles([]); setOutputs([])
    setTotalPct(0); setStatusTxt(''); setShowProgress(false)
  }

  function downloadAll() {
    outputs.forEach(({ name, blob }) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
    })
  }

  const hasFiles = files.length > 0
  const canFix   = hasFiles && !busy && loaded

  // dest label for done screen
  function destLabel() {
    if (dest === 'next_to')   return 'Saved next to originals'
    if (dest === 'subfolder') return 'Saved in  fixed/  subfolder'
    if (dest === 'download')  return 'Files ready to download'
    return 'Saved'
  }

  return (
    <>
      {/* Loading */}
      {!loaded && (
        <div style={s.loadWrap}>
          <div style={s.loadTitle}>FixTok</div>
          <div style={s.loadDots}>
            <div style={s.dot} className="dot1" />
            <div style={s.dot} className="dot2" />
            <div style={s.dot} className="dot3" />
          </div>
          <div style={s.loadTxt}>Loading ffmpeg…</div>
        </div>
      )}

      {/* Done overlay */}
      {done && (
        <div style={s.overlay}>
          <svg width="80" height="80" viewBox="0 0 80 80" className="anim-done">
            <circle className="check-circle" cx="40" cy="40" r="36" />
            <polyline className="check-tick" points="24,40 35,52 56,28" />
          </svg>
          <div style={s.doneTitle}>{outputs.length} video{outputs.length !== 1 ? 's' : ''} fixed</div>
          <div style={s.doneSub}>{destLabel()}</div>
          <div style={s.doneFiles}>
            {outputs.map(({ name, blob, size }) => (
              <a key={name} href={URL.createObjectURL(blob)} download={name} style={s.doneLink}>
                <span style={{ fontSize: '12px', color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginLeft: '8px', flexShrink: 0 }}>{fmt(size)}</span>
                <span style={{ fontSize: '14px', color: 'var(--text3)', marginLeft: '8px', flexShrink: 0 }}>↓</span>
              </a>
            ))}
          </div>
          {outputs.length > 1 && <button style={s.dlAllBtn} onClick={downloadAll}>↓ Download all</button>}
          <button style={s.againBtn} onClick={reset}>Fix more videos</button>
        </div>
      )}

      {/* Main */}
      <div style={s.page}>
        <div style={s.app}>

          {/* Header */}
          <div style={s.hdr}>
            <div style={s.wordmark}>FixTok</div>
            <div style={s.badge}>v1.0</div>
          </div>

          {/* Drop zone */}
          <div
            style={s.drop(hov)}
            onDragOver={e => { e.preventDefault(); setHov(true) }}
            onDragLeave={() => setHov(false)}
            onDrop={onDrop}
            onClick={pickFiles}
          >
            <span style={s.dropIcon(hov)}>↑</span>
            <div style={s.dropTitle}>Drop videos or folders here</div>
            <div style={s.dropSub}>.MOV · .mp4 · subfolders included</div>
          </div>

          {/* File list header */}
          {hasFiles && (
            <div style={s.listHdr}>
              <button style={s.clearBtn} onClick={() => { if (!busy) setFiles([]) }}>← Clear all</button>
              <span style={s.count}>{files.length} file{files.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* File list */}
          {hasFiles && (
            <div style={s.scroll}>
              {files.map(vf => (
                <div key={vf.id} style={s.row}>
                  <span style={s.rowDot}>·</span>
                  <span style={s.rowName}>{vf.file.name}</span>
                  <span style={s.rowProg}>
                    {vf.status === 'processing' ? (vf.progress > 0 ? `${vf.progress}%` : '…') : ''}
                  </span>
                  <span style={s.rowStat}>
                    {vf.status === 'done'  && <span style={{ color: 'var(--green)' }}>✓</span>}
                    {vf.status === 'error' && <span style={{ color: 'var(--red)' }}>✗</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Save to – only shown when files are present */}
          {hasFiles && (
            <div style={s.destWrap}>
              <div style={s.destTitle}>Save to</div>
              <div style={s.destRow}>
                {(['next_to', 'subfolder', 'download'] as DestMode[]).map(m => (
                  <button key={m} style={s.destBtn(dest === m)} onClick={() => setDest(m)}>
                    {m === 'next_to' ? 'Next to original' : m === 'subfolder' ? 'New subfolder' : 'Download'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div style={s.statusTxt}>{statusTxt}</div>

          {/* Progress bar */}
          {showProgress && (
            <div style={s.pbarWrap}>
              <div style={s.pbarFill(totalPct)} />
            </div>
          )}

          {/* Fix button */}
          <button style={s.fixBtn(canFix)} disabled={!canFix} onClick={run}>
            {busy ? 'Processing…' : 'Fix videos'}
          </button>

        </div>
      </div>
    </>
  )
}
