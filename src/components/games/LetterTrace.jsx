import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Link } from 'react-router-dom'
import styles from './LetterTrace.module.css'

// ─── Letter path data ─────────────────────────────────
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

// ─── Digit path data (200×260 viewBox) ────────────────
const DIGITS = {
  '0': { strokes: ['M 100,22 C 152,22 185,72 185,130 C 185,190 152,240 100,240 C 48,240 15,190 15,130 C 15,72 48,22 100,22'] },
  '1': { strokes: ['M 62,68 L 100,22 L 100,240'] },
  '2': { strokes: ['M 28,78 C 28,22 172,22 172,82 C 172,132 32,180 28,240 L 172,240'] },
  '3': { strokes: ['M 28,42 C 48,10 172,10 172,82 C 172,132 108,132 108,132 C 172,132 175,198 168,218 C 152,255 45,258 28,225'] },
  '4': { strokes: ['M 145,22 L 22,168 L 172,168', 'M 145,22 L 145,240'] },
  '5': { strokes: ['M 168,22 L 45,22 L 40,130 C 60,108 95,103 122,112 C 168,128 172,182 148,215 C 130,248 45,252 25,218'] },
  '6': { strokes: ['M 155,45 C 130,15 28,48 28,142 C 28,218 65,248 108,248 C 152,248 178,205 172,162 C 165,125 138,105 100,105 C 62,105 28,138 32,172 C 35,208 65,242 100,242 C 138,242 172,212 172,175'] },
  '7': { strokes: ['M 28,22 L 172,22 L 72,240'] },
  '8': { strokes: ['M 100,22 C 58,22 28,50 28,82 C 28,110 62,130 100,130 C 138,130 172,110 172,82 C 172,50 142,22 100,22', 'M 100,130 C 58,130 25,162 25,200 C 25,235 62,252 100,252 C 138,252 175,235 175,200 C 175,162 142,130 100,130'] },
  '9': { strokes: ['M 172,88 C 172,48 140,20 100,20 C 60,20 28,48 28,88 C 28,130 60,158 100,158 C 140,158 172,130 172,88 L 172,222 C 172,250 140,260 112,252'] },
}

// ─── Coordinate transformer ────────────────────────────
// Rewrites all `x,y` pairs in a path string using a linear transform.
function transformPath(d, sx, sy, tx, ty) {
  return d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) =>
    `${(parseFloat(x) * sx + tx).toFixed(1)},${(parseFloat(y) * sy + ty).toFixed(1)}`
  )
}

// ─── Two-column layout for two-digit numbers ──────────
// Source path bounds: x 10–190 (width 180), y 10–260 (height 250)
// Left column: x 1–93,  right column: x 107–199
const NUM2_SX = 88 / 180
const NUM2_SY = 233 / 250
const NUM2_TY = 15 - 10 * NUM2_SY
const NUM2_TX = [1 - 10 * NUM2_SX, 107 - 10 * NUM2_SX]
const leftPath  = d => transformPath(d, NUM2_SX, NUM2_SY, NUM2_TX[0], NUM2_TY)
const rightPath = d => transformPath(d, NUM2_SX, NUM2_SY, NUM2_TX[1], NUM2_TY)

// ─── Multi-letter layout for words ────────────────────
// 3-letter: cols 0-65, 68-133, 136-201 (sx = 65/180)
// 4-letter: cols 0-48, 50-98, 100-148, 150-198 (sx = 46/180)
const WORD_SY = 233 / 250
const WORD_TY = 15 - 10 * WORD_SY
const WORD_TX = {
  3: [1   - 10 * (65 / 180), 68  - 10 * (65 / 180), 136 - 10 * (65 / 180)],
  4: [0   - 10 * (46 / 180), 50  - 10 * (46 / 180), 100 - 10 * (46 / 180), 150 - 10 * (46 / 180)],
}
const WORD_SX = { 3: 65 / 180, 4: 46 / 180 }

function wordStrokes(word) {
  const n  = word.length
  const sx = WORD_SX[n]
  return word.split('').flatMap((ch, i) =>
    LETTERS[ch].strokes.map(d => transformPath(d, sx, WORD_SY, WORD_TX[n][i], WORD_TY))
  )
}

// ─── Data sets ────────────────────────────────────────
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const NUMBERS = Array.from({ length: 29 }, (_, i) => {
  const n     = i + 1
  const label = String(n)
  if (n <= 9) return { label, strokes: DIGITS[label].strokes }
  const tens = String(Math.floor(n / 10))
  const ones = String(n % 10)
  return {
    label,
    strokes: [
      ...DIGITS[tens].strokes.map(leftPath),
      ...DIGITS[ones].strokes.map(rightPath),
    ],
  }
})

const WORD_LIST = [
  'CAT', 'DOG', 'SUN', 'HAT', 'BUG', 'HEN', 'PIG', 'COW', 'ANT', 'BEE',
  'FOX', 'OWL', 'BEAR', 'DUCK', 'FISH', 'FROG', 'CAKE', 'BALL', 'STAR', 'MOON',
].map(w => ({ label: w, strokes: wordStrokes(w) }))

const PALETTE  = ['#ff6b6b','#ff9f43','#ffd93d','#6bcb77','#4d96ff','#c77dff','#ff6eb4','#44ddcc']
const getColor = idx => PALETTE[idx % PALETTE.length]

// Timer durations:
// letters / single-digit numbers: 8s
// two-digit numbers: 13s
// 3-letter words: 18s
// 4-letter words: 23s
function getDuration(mode, idx) {
  if (mode === 'letters') return 8000
  if (mode === 'numbers') return NUMBERS[idx].label.length === 1 ? 8000 : 13000
  return WORD_LIST[idx].label.length === 3 ? 18000 : 23000
}

// ─── Helpers ──────────────────────────────────────────
function screenToSVG(svgEl, clientX, clientY) {
  const pt = svgEl.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  return pt.matrixTransform(svgEl.getScreenCTM().inverse())
}

function calcAccuracy(svgEl, trailPts) {
  if (trailPts.length < 2) return 0
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
const TracingSVG = forwardRef(function TracingSVG({ strokes, color }, ref) {
  const svgRef     = useRef(null)
  const trailElRef = useRef(null)
  const segments   = useRef([])
  const isDown     = useRef(false)

  useImperativeHandle(ref, () => ({
    finish() {
      const allPts = segments.current.flat()
      return getStars(calcAccuracy(svgRef.current, allPts))
    }
  }))

  function buildPathD() {
    return segments.current
      .filter(seg => seg.length > 0)
      .map(seg =>
        `M ${seg[0].x.toFixed(1)},${seg[0].y.toFixed(1)}` +
        seg.slice(1).map(p => ` L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('')
      )
      .join(' ')
  }

  const onDown = useCallback((e) => {
    e.preventDefault()
    isDown.current = true
    const pt = screenToSVG(svgRef.current, e.clientX, e.clientY)
    segments.current = [...segments.current, [pt]]
    if (trailElRef.current) trailElRef.current.setAttribute('d', buildPathD())
  }, [])

  const onMove = useCallback((e) => {
    if (!isDown.current) return
    e.preventDefault()
    const pt = screenToSVG(svgRef.current, e.clientX, e.clientY)
    segments.current[segments.current.length - 1].push(pt)
    if (trailElRef.current) trailElRef.current.setAttribute('d', buildPathD())
  }, [])

  const onUp = useCallback(() => { isDown.current = false }, [])

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
      {strokes.map((d, i) => (
        <path key={`g${i}`} d={d} fill="none"
          stroke={color} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"
          opacity="0.10" />
      ))}
      {strokes.map((d, i) => (
        <path key={`d${i}`} d={d} data-trace fill="none"
          stroke={color} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="22 13" opacity="0.50" />
      ))}
      <path ref={trailElRef} d="" fill="none"
        stroke={color} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"
        opacity="0.88" />
    </svg>
  )
})

// ─── Root ─────────────────────────────────────────────
export default function LetterTrace() {
  const [mode,      setMode]      = useState('letters')
  const [phase,     setPhase]     = useState('pick')
  const [itemIdx,   setItemIdx]   = useState(0)
  const [stars,     setStars]     = useState(0)
  const [trailKey,  setTrailKey]  = useState(0)
  const [timerFrac, setTimerFrac] = useState(1)

  const tracingRef = useRef(null)

  const items = mode === 'letters' ? ALPHABET : mode === 'numbers' ? NUMBERS : WORD_LIST
  const item  = items[itemIdx]

  let strokes, color
  if (mode === 'letters') {
    color   = getColor(itemIdx)
    strokes = LETTERS[item].strokes
  } else {
    color   = getColor(itemIdx)
    strokes = item.strokes
  }

  const duration = getDuration(mode, itemIdx)

  useEffect(() => {
    if (phase !== 'trace') return
    const start = Date.now()
    let fired = false
    const id = setInterval(() => {
      if (fired) return
      const elapsed = Date.now() - start
      const frac = Math.max(0, 1 - elapsed / duration)
      setTimerFrac(frac)
      if (elapsed >= duration) {
        fired = true
        clearInterval(id)
        const s = tracingRef.current?.finish() ?? 0
        setStars(s)
        setPhase('result')
      }
    }, 50)
    return () => { fired = true; clearInterval(id) }
  }, [phase, trailKey, duration])

  function startMode(m) {
    setMode(m)
    setItemIdx(0)
    setPhase('trace')
    setTimerFrac(1)
    setTrailKey(k => k + 1)
  }

  function next() {
    setTimerFrac(1)
    if (itemIdx >= items.length - 1) { setPhase('done'); return }
    setItemIdx(i => i + 1)
    setPhase('trace')
    setTrailKey(k => k + 1)
  }

  function retry() {
    setTimerFrac(1)
    setPhase('trace')
    setTrailKey(k => k + 1)
  }

  function goToPicker() {
    setPhase('pick')
    setItemIdx(0)
    setTimerFrac(1)
  }

  // ─── Mode picker ──────────────────────────────────────
  if (phase === 'pick') {
    return (
      <div className={styles.modePicker}>
        <div className={styles.modePickerEmoji}>✏️</div>
        <h2 className={styles.modeTitle}>What would you like to trace?</h2>
        <div className={styles.modeBtns}>
          <button
            className={styles.modeBtn}
            style={{ background: 'linear-gradient(135deg, #4d96ff, #2563eb)' }}
            onClick={() => startMode('letters')}
          >
            🔤 Letters A–Z
          </button>
          <button
            className={styles.modeBtn}
            style={{ background: 'linear-gradient(135deg, #6bcb77, #2d9e3a)' }}
            onClick={() => startMode('numbers')}
          >
            🔢 Numbers 1–29
          </button>
          <button
            className={styles.modeBtn}
            style={{ background: 'linear-gradient(135deg, #ff9f43, #e07b15)' }}
            onClick={() => startMode('words')}
          >
            📝 Words
          </button>
        </div>
        <Link to="/" className={styles.doneHome}>← Back to games</Link>
      </div>
    )
  }

  // ─── Done screen ──────────────────────────────────────
  if (phase === 'done') {
    const doneData = {
      letters: { emoji: '🎉', title: 'You know your ABCs!',  sub: 'Amazing — you traced all 26 letters!' },
      numbers: { emoji: '🔢', title: 'You can count to 29!', sub: 'Incredible — you traced all the numbers!' },
      words:   { emoji: '⭐', title: "You're a word wizard!", sub: 'Brilliant — you traced all the words!' },
    }[mode]
    return (
      <div className={styles.done}>
        <div className={styles.doneEmoji}>{doneData.emoji}</div>
        <h2 className={styles.doneTitle}>{doneData.title}</h2>
        <p className={styles.doneSub}>{doneData.sub}</p>
        <button className={styles.doneBtn} onClick={goToPicker}>Choose again 🔄</button>
        <Link to="/" className={styles.doneHome}>← Back to games</Link>
      </div>
    )
  }

  // ─── Hint ─────────────────────────────────────────────
  let hint
  if (mode === 'letters') {
    hint = <>Trace the letter <span style={{ color, fontWeight: 900 }}>{item}</span>!</>
  } else if (mode === 'numbers') {
    hint = <>Trace the number <span style={{ color, fontWeight: 900 }}>{item.label}</span>!</>
  } else {
    hint = <>Trace the word <span style={{ color, fontWeight: 900 }}>{item.label}</span>!</>
  }

  // ─── Next button label ────────────────────────────────
  let nextLabel
  if (mode === 'letters') {
    nextLabel = itemIdx >= ALPHABET.length - 1 ? 'Finish! 🎉' : `Next: ${ALPHABET[itemIdx + 1]} →`
  } else if (mode === 'numbers') {
    nextLabel = itemIdx >= NUMBERS.length - 1 ? 'Finish! 🎉' : `Next: ${NUMBERS[itemIdx + 1].label} →`
  } else {
    nextLabel = itemIdx >= WORD_LIST.length - 1 ? 'Finish! 🎉' : `Next: ${WORD_LIST[itemIdx + 1].label} →`
  }

  const timerColor = timerFrac > 0.5 ? '#6bcb77' : timerFrac > 0.25 ? '#ffd93d' : '#ff6b6b'
  const MESSAGES   = ['Keep trying! 💪', 'Good try! 👍', 'Great job! ✨', 'Perfect! 🎉']

  return (
    <div className={styles.game}>

      {/* HUD */}
      <div className={styles.hud}>
        <button className={styles.hudBack} onClick={goToPicker}>← Modes</button>
        <div className={styles.progress}>
          {items.map((_, i) => (
            <span key={i}
              className={`${styles.dot} ${i < itemIdx ? styles.dotDone : ''} ${i === itemIdx ? styles.dotCurrent : ''}`}
            />
          ))}
        </div>
        <button className={styles.hudClear} onClick={retry}>Clear</button>
      </div>

      {/* Countdown bar */}
      <div className={styles.timerTrack}>
        <div
          className={styles.timerFill}
          style={{ width: `${timerFrac * 100}%`, background: timerColor }}
        />
      </div>

      {/* Hint */}
      <p className={styles.hint}>{hint}</p>

      {/* Tracing area */}
      <div className={styles.canvasWrap}>
        <TracingSVG
          key={trailKey}
          ref={tracingRef}
          strokes={strokes}
          color={color}
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
                {nextLabel}
              </button>
              <button className={styles.retryBtn} onClick={retry}>Try again</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
