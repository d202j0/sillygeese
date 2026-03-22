import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './ShapeSorter.module.css'

// ─── Themes ───────────────────────────────────────────
const THEMES = {
  blue: {
    label: 'Cars', emoji: '🚗', cardBack: '#0044cc', accent: '#33aaff',
    bg: 'linear-gradient(160deg, #000d1a 0%, #001f3f 40%, #0050a0 100%)',
  },
  orange: {
    label: 'Fire', emoji: '🔥', cardBack: '#cc5500', accent: '#ff9933',
    bg: 'linear-gradient(160deg, #1a0800 0%, #3d1500 40%, #8c3a00 100%)',
  },
  purple: {
    label: 'Unicorns', emoji: '🦄', cardBack: '#7b2fff', accent: '#c77dff',
    bg: 'linear-gradient(160deg, #0d0020 0%, #2a0550 40%, #6b1fa0 100%)',
  },
}

// ─── Shapes ───────────────────────────────────────────
const ALL_SHAPES = [
  { id: 'circle',   label: 'Circle',   path: <circle cx="40" cy="40" r="36" /> },
  { id: 'square',   label: 'Square',   path: <rect x="8" y="8" width="64" height="64" rx="6" /> },
  { id: 'triangle', label: 'Triangle', path: <polygon points="40,6 74,74 6,74" /> },
  { id: 'star',     label: 'Star',     path: <polygon points="40,4 49,32 78,32 55,50 63,78 40,61 17,78 25,50 2,32 31,32" /> },
  { id: 'heart',    label: 'Heart',    path: <path d="M40 70 C40 70 8 50 8 28 C8 16 16 8 26 8 C32 8 38 12 40 18 C42 12 48 8 54 8 C64 8 72 16 72 28 C72 50 40 70 40 70Z" /> },
  { id: 'diamond',  label: 'Diamond',  path: <polygon points="40,4 74,40 40,76 6,40" /> },
]

const LEVEL_CONFIGS = [
  { count: 3, shapes: ['circle','square','triangle'] },
  { count: 4, shapes: ['circle','square','triangle','star'] },
  { count: 5, shapes: ['circle','square','triangle','star','heart'] },
  { count: 6, shapes: ['circle','square','triangle','star','heart','diamond'] },
]

const COLORS = ['#ff6b6b','#4d96ff','#ffd93d','#6bcb77','#ff6eb4','#c77dff']

function createAudio() {
  let ctx = null
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  }
  function match() {
    try {
      init()
      ;[523,784].forEach((f,i) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'triangle'; o.frequency.value = f
        const t = ctx.currentTime + i*0.1
        g.gain.setValueAtTime(0.3,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.3)
        o.start(t); o.stop(t+0.3)
      })
    } catch(e) {}
  }
  function wrong() {
    try {
      init()
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sawtooth'; o.frequency.value = 200
      g.gain.setValueAtTime(0.25, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      o.start(); o.stop(ctx.currentTime + 0.25)
    } catch(e) {}
  }
  function success() {
    try {
      init()
      ;[523,659,784,1047,1319].forEach((f,i) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'triangle'; o.frequency.value = f
        const t = ctx.currentTime + i*0.1
        g.gain.setValueAtTime(0.28,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.3)
        o.start(t); o.stop(t+0.3)
      })
    } catch(e) {}
  }
  return { init, match, wrong, success }
}

// ─── ThemePicker ──────────────────────────────────────
function ThemePicker({ onPick }) {
  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <Link to="/" className={styles.pickerBack}>← Home</Link>
        <span className={styles.pickerTitle}>Shape Sorter</span>
      </div>
      <div className={styles.pickerBody}>
        <div className={styles.pickerEmoji}>🔷</div>
        <h2 className={styles.pickerHeading}>Pick your theme!</h2>
        <p className={styles.pickerSub}>Drag each shape to its matching hole!</p>
        <div className={styles.themeGrid}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} className={styles.themeBtn}
              style={{ background: t.cardBack, boxShadow: `0 8px 24px ${t.cardBack}88` }}
              onClick={() => onPick(key)}
            >
              <span className={styles.themeBtnEmoji}>{t.emoji}</span>
              <span className={styles.themeBtnLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Shape component ──────────────────────────────────
function Shape({ shape, color, size = 70, filled = true, dimmed = false, style = {}, onPointerDown }) {
  return (
    <div
      className={`${styles.shape} ${dimmed ? styles.shapeDimmed : ''}`}
      style={{ width: size, height: size, cursor: onPointerDown ? 'grab' : 'default', ...style }}
      onPointerDown={onPointerDown}
    >
      <svg viewBox="0 0 80 80" width={size} height={size}>
        {filled
          ? <g fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth="2">{shape.path}</g>
          : <g fill="none" stroke={color} strokeWidth="5" strokeDasharray="6 4">{shape.path}</g>
        }
      </svg>
    </div>
  )
}

// ─── Game ─────────────────────────────────────────────
function SorterGame({ themeKey, onSwitchTheme }) {
  const theme = THEMES[themeKey]
  const audio = useRef(createAudio())

  const [levelIdx,  setLevelIdx]  = useState(0)
  const [score,     setScore]     = useState(0)
  const [matched,   setMatched]   = useState([])  // shape ids that are matched
  const [dragging,  setDragging]  = useState(null) // { shapeId, x, y }
  const [wrongHole, setWrongHole] = useState(null)
  const [roundDone, setRoundDone] = useState(false)
  const [message,   setMessage]   = useState(null)
  const msgTimer = useRef(null)

  const config = LEVEL_CONFIGS[Math.min(levelIdx, LEVEL_CONFIGS.length-1)]
  const shapes = config.shapes.map((id, i) => ({
    ...ALL_SHAPES.find(s => s.id === id),
    color: COLORS[i],
  }))

  // Shuffled order for the draggable pieces at bottom
  const [pieceOrder] = useState(() => [...shapes].sort(() => Math.random()-0.5))
  const pieces = useRef(pieceOrder)
  pieces.current = shapes.filter(s => !matched.includes(s.id))
    .sort((a,b) => pieceOrder.findIndex(p=>p.id===a.id) - pieceOrder.findIndex(p=>p.id===b.id))

  function showMsg(text) {
    clearTimeout(msgTimer.current)
    setMessage(text)
    msgTimer.current = setTimeout(() => setMessage(null), 1200)
  }

  function handleDragStart(e, shapeId) {
    e.preventDefault()
    audio.current.init()
    const pt = e.touches?.[0] || e
    setDragging({ shapeId, x: pt.clientX, y: pt.clientY })
  }

  function handleDragMove(e) {
    if (!dragging) return
    const pt = e.touches?.[0] || e
    setDragging(d => ({ ...d, x: pt.clientX, y: pt.clientY }))
  }

  function handleDragEnd(e) {
    if (!dragging) return
    // Find which hole we're over
    const holes = document.querySelectorAll('[data-hole]')
    let dropped = false
    holes.forEach(hole => {
      const rect = hole.getBoundingClientRect()
      if (dragging.x >= rect.left && dragging.x <= rect.right &&
          dragging.y >= rect.top  && dragging.y <= rect.bottom) {
        const holeId = hole.dataset.hole
        if (holeId === dragging.shapeId) {
          // Match!
          audio.current.match()
          setMatched(m => {
            const next = [...m, dragging.shapeId]
            if (next.length === shapes.length) {
              audio.current.success()
              setRoundDone(true)
              setScore(s => s + shapes.length * 5)
            }
            return next
          })
          dropped = true
        } else {
          // Wrong hole
          audio.current.wrong()
          setWrongHole(holeId)
          showMsg('Not quite! Try another hole 👆')
          setTimeout(() => setWrongHole(null), 500)
          dropped = true
        }
      }
    })
    if (!dropped) showMsg('Drop it on a shape! 👆')
    setDragging(null)
  }

  function nextRound() {
    setLevelIdx(i => Math.min(i+1, LEVEL_CONFIGS.length-1))
    setMatched([]); setRoundDone(false); setDragging(null)
  }

  const draggingShape = dragging ? shapes.find(s => s.id === dragging.shapeId) : null

  return (
    <div
      className={styles.game}
      style={{ background: theme.bg }}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onTouchMove={e => { e.preventDefault(); handleDragMove(e) }}
      onTouchEnd={handleDragEnd}
    >
      {/* HUD */}
      <div className={styles.hud}>
        <Link to="/" className={styles.backBtn} style={{ color: theme.accent }}>← Home</Link>
        <div className={styles.levelBadge}>Level {levelIdx+1}</div>
        <div className={styles.score}>⭐ {score}</div>
        <button className={styles.switchBtn} style={{ color: theme.accent }} onClick={onSwitchTheme}>{theme.emoji} Switch</button>
      </div>

      <div className={styles.instruction}>Match each shape to its outline!</div>

      {/* Holes area */}
      <div className={styles.holesArea}>
        {shapes.map(s => (
          <div
            key={s.id}
            data-hole={s.id}
            className={`${styles.hole} ${matched.includes(s.id) ? styles.holeFilled : ''} ${wrongHole === s.id ? styles.holeWrong : ''}`}
            style={{ borderColor: s.color }}
          >
            {matched.includes(s.id)
              ? <Shape shape={s} color={s.color} size={64} filled={true} />
              : <Shape shape={s} color={s.color} size={64} filled={false} />
            }
          </div>
        ))}
      </div>

      {/* Message */}
      {message && <div className={styles.message}>{message}</div>}

      {/* Pieces tray */}
      <div className={styles.tray}>
        {pieces.current.map(s => (
          <div
            key={s.id}
            className={styles.piece}
            onPointerDown={(e) => handleDragStart(e, s.id)}
            onTouchStart={(e) => { e.preventDefault(); handleDragStart(e, s.id) }}
          >
            <Shape shape={s} color={s.color} size={68} filled={true} />
          </div>
        ))}
      </div>

      {/* Floating dragged shape */}
      {dragging && draggingShape && (
        <div className={styles.dragging} style={{ left: dragging.x, top: dragging.y }}>
          <Shape shape={draggingShape} color={draggingShape.color} size={80} filled={true} />
        </div>
      )}

      {/* Round done overlay */}
      {roundDone && (
        <div className={styles.overlay}>
          <div className={styles.overlayBox}>
            <div className={styles.overlayEmoji}>🎉</div>
            <h2 className={styles.overlayTitle}>All matched!</h2>
            <p className={styles.overlaySub}>You sorted all the shapes!</p>
            <p className={styles.overlayScore}>Score: {score}</p>
            <button className={styles.overlayBtn} style={{ background: theme.cardBack }} onClick={nextRound}>
              {levelIdx < LEVEL_CONFIGS.length-1 ? 'More shapes! →' : 'Play again! →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ShapeSorter() {
  const [themeKey, setThemeKey] = useState(null)
  if (!themeKey) return <ThemePicker onPick={setThemeKey} />
  return <SorterGame key={themeKey} themeKey={themeKey} onSwitchTheme={() => setThemeKey(null)} />
}
