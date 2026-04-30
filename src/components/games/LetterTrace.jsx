import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './LetterTrace.module.css'

// ─── Letter path data ─────────────────────────────────
// All paths in a 200×260 SVG viewBox. Each entry is an array of
// SVG path `d` strings — one per stroke, in stroke order.
const LETTERS = {
  A: { strokes: ['M 100,22 L 22,238', 'M 100,22 L 178,238', 'M 50,158 L 150,158'] },
  B: { strokes: ['M 45,22 L 45,238', 'M 45,22 C 160,22 160,128 45,128 C 165,128 165,238 45,238'] },
  C: { strokes: ['M 182,72 C 160,22 55,22 27,98 C 2,165 35,228 95,242 C 132,252 175,236 188,205'] },
  D: { strokes: ['M 45,22 L 45,238', 'M 45,22 C 175,22 192,90 192,130 C 192,172 170,238 45,238'] },
  E: { strokes: ['M 165,22 L 40,22 L 40,238 L 165,238', 'M 40,130 L 145,130'] },
  F: { strokes: ['M 165,22 L 40,22 L 40,238', 'M 40,130 L 145,130'] },
  G: { strokes: ['M 188,72 C 165,22 60,22 30,98 C 5,165 38,228 100,242 C 148,252 190,228 190,186 L 118,186'] },
  H: { strokes: ['M 40,22 L 40,238', 'M 160,22 L 160,238', 'M 40,130 L 160,130'] },
  I: { strokes: ['M 72,22 L 128,22', 'M 100,22 L 100,238', 'M 72,238 L 128,238'] },
  J: { strokes: ['M 72,22 L 128,22', 'M 128,22 L 128,200 C 128,242 48,252 40,212'] },
  K: { strokes: ['M 40,22 L 40,238', 'M 168,22 L 40,130 L 168,238'] },
  L: { strokes: ['M 40,22 L 40,238 L 175,238'] },
  M: { strokes: ['M 22,238 L 22,22 L 100,118 L 178,22 L 178,238'] },
  N: { strokes: ['M 40,238 L 40,22 L 160,238 L 160,22'] },
  O: { strokes: ['M 100,22 C 147,22 185,71 185,130 C 185,191 147,242 100,242 C 53,242 15,191 15,130 C 15,71 53,22 100,22'] },
  P: { strokes: ['M 45,22 L 45,238', 'M 45,22 C 165,22 168,72 168,100 C 168,128 155,152 45,152'] },
  Q: { strokes: ['M 100,22 C 147,22 185,71 185,130 C 185,191 147,242 100,242 C 53,242 15,191 15,130 C 15,71 53,22 100,22', 'M 128,198 L 185,252'] },
  R: { strokes: ['M 45,22 L 45,238', 'M 45,22 C 165,22 168,72 168,100 C 168,128 155,152 45,152', 'M 45,152 L 178,238'] },
  S: { strokes: ['M 175,58 C 165,15 65,15 45,58 C 25,100 155,160 155,202 C 155,245 55,245 25,218'] },
  T: { strokes: ['M 15,22 L 185,22', 'M 100,22 L 100,238'] },
  U: { strokes: ['M 40,22 L 40,188 C 40,248 160,248 160,188 L 160,22'] },
  V: { strokes: ['M 15,22 L 100,248 L 185,22'] },
  W: { strokes: ['M 10,22 L 55,242 L 100,142 L 145,242 L 190,22'] },
  X: { strokes: ['M 22,22 L 178,242', 'M 178,22 L 22,242'] },
  Y: { strokes: ['M 22,22 L 100,132', 'M 178,22 L 100,132 L 100,242'] },
  Z: { strokes: ['M 25,22 L 175,22 L 25,242 L 175,242'] },
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const PALETTE = [
  '#ff6b6b', '#ff9f43', '#ffd93d', '#6bcb77',
  '#4d96ff', '#c77dff', '#ff6eb4', '#44ddcc',
]

const getColor = (idx) => PALETTE[idx % PALETTE.length]

// ─── Helpers ──────────────────────────────────────────
function getStartPoint(pathD) {
  const m = pathD.match(/M\s*([-\d.]+)[,\s]+([-\d.]+)/)
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 }
}

function screenToSVG(svgEl, clientX, clientY) {
  const pt = svgEl.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  return pt.matrixTransform(svgEl.getScreenCTM().inverse())
}

function calcAccuracy(svgEl, trailPts) {
  if (trailPts.length < 3) return 0
  const TOLERANCE_SQ = 26 * 26
  const pathEls = [...svgEl.querySelectorAll('[data-trace]')]
  if (!pathEls.length) return 0

  let total = 0, covered = 0
  pathEls.forEach(el => {
    const len = el.getTotalLength()
    const n   = Math.max(20, Math.ceil(len / 5))
    for (let i = 0; i <= n; i++) {
      const pt = el.getPointAtLength((i / n) * len)
      total++
      if (trailPts.some(tp => (tp.x - pt.x) ** 2 + (tp.y - pt.y) ** 2 < TOLERANCE_SQ)) covered++
    }
  })
  return total > 0 ? covered / total : 0
}

function getStars(acc) {
  if (acc >= 0.70) return 3
  if (acc >= 0.40) return 2
  if (acc >= 0.15) return 1
  return 0
}

// ─── Tracing SVG ──────────────────────────────────────
function TracingSVG({ strokes, color, onFinish }) {
  const svgRef     = useRef(null)
  const trailElRef = useRef(null)
  const trailPts   = useRef([])
  const drawing    = useRef(false)

  function pushPoint(clientX, clientY) {
    const pt = screenToSVG(svgRef.current, clientX, clientY)
    trailPts.current.push(pt)
    if (trailElRef.current) {
      trailElRef.current.setAttribute(
        'points',
        trailPts.current.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      )
    }
  }

  const onDown = useCallback((e) => {
    e.preventDefault()
    drawing.current = true
    trailPts.current = []
    pushPoint(e.clientX, e.clientY)
  }, [])

  const onMove = useCallback((e) => {
    if (!drawing.current) return
    e.preventDefault()
    pushPoint(e.clientX, e.clientY)
  }, [])

  const onUp = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    if (trailPts.current.length < 3) return
    const acc   = calcAccuracy(svgRef.current, trailPts.current)
    onFinish(getStars(acc))
  }, [onFinish])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 260"
      className={styles.svg}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* Ghost base — very faint solid so overall shape is readable */}
      {strokes.map((d, i) => (
        <path key={`g${i}`} d={d} fill="none"
          stroke={color} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"
          opacity="0.10" />
      ))}

      {/* Dashed guide */}
      {strokes.map((d, i) => (
        <path key={`d${i}`} d={d} data-trace fill="none"
          stroke={color} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="22 13" opacity="0.50" />
      ))}

      {/* Numbered start dots — one per stroke */}
      {strokes.map((d, i) => {
        const { x, y } = getStartPoint(d)
        return (
          <g key={`s${i}`}>
            <circle cx={x} cy={y} r={15} fill={color} opacity={0.95} />
            <text x={x} y={y + 5.5} textAnchor="middle" fill="white"
              fontSize={15} fontWeight="bold"
              style={{ pointerEvents: 'none', fontFamily: 'Nunito, sans-serif' }}>
              {i + 1}
            </text>
          </g>
        )
      })}

      {/* Finger trail */}
      <polyline ref={trailElRef} points="" fill="none"
        stroke={color} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"
        opacity="0.88" />
    </svg>
  )
}

// ─── Root ─────────────────────────────────────────────
export default function LetterTrace() {
  const [letterIdx, setLetterIdx] = useState(0)
  const [phase,     setPhase]     = useState('trace')  // 'trace' | 'result' | 'done'
  const [stars,     setStars]     = useState(0)
  const [trailKey,  setTrailKey]  = useState(0)

  const letter = ALPHABET[letterIdx]
  const color  = getColor(letterIdx)
  const data   = LETTERS[letter]

  const handleFinish = useCallback((s) => {
    setStars(s)
    setPhase('result')
  }, [])

  function next() {
    if (letterIdx >= 25) { setPhase('done'); return }
    setLetterIdx(i => i + 1)
    setPhase('trace')
    setTrailKey(k => k + 1)
  }

  function retry() {
    setPhase('trace')
    setTrailKey(k => k + 1)
  }

  function restart() {
    setLetterIdx(0)
    setPhase('trace')
    setTrailKey(k => k + 1)
  }

  if (phase === 'done') {
    return (
      <div className={styles.done}>
        <div className={styles.doneEmoji}>🎉</div>
        <h2 className={styles.doneTitle}>You know your ABCs!</h2>
        <p className={styles.doneSub}>Amazing work — you traced all 26 letters!</p>
        <button className={styles.doneBtn} onClick={restart}>Go again! 🔄</button>
        <Link to="/" className={styles.doneHome}>← Back to games</Link>
      </div>
    )
  }

  const MESSAGES = ['Keep trying! 💪', 'Good try! 👍', 'Great job! ✨', 'Perfect! 🎉']

  return (
    <div className={styles.game}>

      {/* HUD */}
      <div className={styles.hud}>
        <Link to="/" className={styles.hudBack}>← Home</Link>
        <div className={styles.progress}>
          {ALPHABET.map((l, i) => (
            <span key={l}
              className={`${styles.dot} ${i < letterIdx ? styles.dotDone : ''} ${i === letterIdx ? styles.dotCurrent : ''}`}
            />
          ))}
        </div>
        <button className={styles.hudClear} onClick={retry}>Clear</button>
      </div>

      {/* Hint */}
      <p className={styles.hint}>
        Trace the letter <span style={{ color, fontWeight: 900 }}>{letter}</span> — start at&nbsp;①
      </p>

      {/* Tracing area */}
      <div className={styles.canvasWrap}>
        <TracingSVG
          key={trailKey}
          strokes={data.strokes}
          color={color}
          onFinish={handleFinish}
        />
      </div>

      {/* Result overlay */}
      {phase === 'result' && (
        <div className={styles.overlay}>
          <div className={styles.resultBox} style={{ borderColor: color }}>
            <div className={styles.resultStars}>
              {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
            </div>
            <p className={styles.resultMsg}>{MESSAGES[stars]}</p>
            <div className={styles.resultBtns}>
              <button className={styles.nextBtn} style={{ background: color }} onClick={next}>
                {letterIdx >= 25 ? 'Finish! 🎉' : `Next: ${ALPHABET[letterIdx + 1]} →`}
              </button>
              <button className={styles.retryBtn} onClick={retry}>Try again</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
