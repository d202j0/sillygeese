import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './BubbleBurst.module.css'

// ─── Themes ───────────────────────────────────────────
const THEMES = {
  purple: {
    label: 'Unicorns', emoji: '🦄', cardBack: '#7b2fff', accent: '#c77dff',
    bg: 'linear-gradient(180deg, #0d0020 0%, #2a0550 25%, #5c1490 55%, #8e3dbf 80%, #b06ad4 100%)',
    emojis: ['🦄','🌟','💜','🌈','🦋','💫','🍭','🌸','✨','🎀'],
    colors: [['#e0aaff','#9d4edd'],['#ffb3ff','#cc44cc'],['#c77dff','#7b2fff'],['#f8a8ff','#bf40bf'],['#aaffcc','#22aa66']],
  },
  blue: {
    label: 'Cars', emoji: '🚗', cardBack: '#0044cc', accent: '#33aaff',
    bg: 'linear-gradient(180deg, #000d1a 0%, #001f3f 25%, #003580 55%, #0057b7 80%, #1a7fd4 100%)',
    emojis: ['🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','🛻','🚚'],
    colors: [['#66ccff','#0066cc'],['#aae0ff','#0044aa'],['#55bbff','#0033bb'],['#88ddff','#0055cc'],['#ffdd88','#cc8800']],
  },
  pink: {
    label: 'Candy', emoji: '🍭', cardBack: '#cc0066', accent: '#ff6eb4',
    bg: 'linear-gradient(180deg, #1a0010 0%, #3d0025 25%, #7a0050 55%, #c2185b 80%, #e91e8c 100%)',
    emojis: ['🍭','🍬','🍫','🧁','🍰','🎂','🍩','🍪','🍦','💝'],
    colors: [['#ffb3d9','#cc0066'],['#ff80bf','#aa0044'],['#ff99cc','#dd0077'],['#ffccee','#ee0088'],['#ff66aa','#990055']],
  },
}

// ─── Phase config: how many bubbles per round ──────────
const PHASES = [
  { minLevel:1,  maxLevel:3,  count:3, label:'Smallest first!' },
  { minLevel:4,  maxLevel:6,  count:4, label:'Smallest first!' },
  { minLevel:7,  maxLevel:9,  count:5, label:'Smallest first!' },
  { minLevel:10, maxLevel:99, count:6, label:'Smallest first!' },
]
function getPhase(level) { return PHASES.find(p => level >= p.minLevel && level <= p.maxLevel) || PHASES[PHASES.length-1] }

const CONFETTI = ['#ff88ff','#ffdd44','#44aaff','#ff6644','#44ffaa','#ffffff']
const SIZE_LABELS = ['Tiny','Small','Medium','Big','Huge','Giant']

function createAudio() {
  let ctx = null
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  }
  function pop(pitch) {
    try {
      init()
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'; o.frequency.value = pitch
      g.gain.setValueAtTime(0.35, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
      o.start(); o.stop(ctx.currentTime + 0.22)
    } catch(e) {}
  }
  function wrong() {
    try {
      init()
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sawtooth'; o.frequency.value = 180
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      o.start(); o.stop(ctx.currentTime + 0.3)
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
  return { init, pop, wrong, success }
}

// ─── ThemePicker ──────────────────────────────────────
function ThemePicker({ onPick }) {
  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <Link to="/" className={styles.pickerBack}>← Home</Link>
        <span className={styles.pickerTitle}>Bubble Burst</span>
      </div>
      <div className={styles.pickerBody}>
        <div className={styles.pickerEmoji}>🫧</div>
        <h2 className={styles.pickerHeading}>Pick your theme!</h2>
        <p className={styles.pickerSub}>Pop the bubbles smallest first!</p>
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

// ─── Game ─────────────────────────────────────────────
function BurstGame({ themeKey, onSwitchTheme }) {
  const theme = THEMES[themeKey]
  const audio = useRef(createAudio())

  const [bubbles,   setBubbles]   = useState([])   // array of {id, size, colorPair, emoji, popped}
  const [nextIdx,   setNextIdx]   = useState(0)    // index into sorted bubbles that should be popped next
  const [score,     setScore]     = useState(0)
  const [lives,     setLives]     = useState(3)
  const [level,     setLevel]     = useState(1)
  const [message,   setMessage]   = useState(null)
  const [roundDone, setRoundDone] = useState(false)
  const msgTimer = useRef(null)

  function showMsg(text, color = '#fff') {
    clearTimeout(msgTimer.current)
    setMessage({ text, color })
    msgTimer.current = setTimeout(() => setMessage(null), 1200)
  }

  function buildRound(lv) {
    const pd = getPhase(lv)
    const count = pd.count
    // Generate count distinct sizes, evenly spread between 60 and 180px
    const minSz = 55, maxSz = 175
    const step = (maxSz - minSz) / (count - 1)
    const sizes = Array.from({ length: count }, (_, i) => Math.round(minSz + i * step))
    // Shuffle positions — random x, y in a grid-ish layout
    const shuffled = [...sizes].sort(() => Math.random() - 0.5)
    return shuffled.map((size, i) => ({
      id: i,
      size,
      sortOrder: sizes.indexOf(size), // 0 = smallest
      colorPair: theme.colors[i % theme.colors.length],
      emoji: theme.emojis[Math.floor(Math.random() * theme.emojis.length)],
      x: 8 + (i % 3) * 30 + Math.random() * 8,   // rough grid columns %
      y: 15 + Math.floor(i / 3) * 35 + Math.random() * 8, // rough grid rows %
      popped: false,
    }))
  }

  useEffect(() => {
    audio.current.init()
    setBubbles(buildRound(1))
    setNextIdx(0)
  }, [])

  function handleTap(bubble) {
    if (bubble.popped) return
    audio.current.init()

    if (bubble.sortOrder === nextIdx) {
      // Correct!
      audio.current.pop(300 + nextIdx * 80)
      setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, popped: true } : b))
      const next = nextIdx + 1
      setNextIdx(next)
      setScore(s => s + 5)
      showMsg(SIZE_LABELS[bubble.sortOrder] + '! ✅', '#ffd93d')

      if (next === bubbles.length) {
        // Round complete!
        audio.current.success()
        setRoundDone(true)
      }
    } else {
      // Wrong order
      audio.current.wrong()
      const newLives = Math.max(0, lives - 1)
      setLives(newLives)
      showMsg('Not that one! 😬 Smallest first!', '#ff6b6b')
      if (newLives === 0) {
        setTimeout(() => {
          setLives(3); setScore(0); setLevel(1)
          setBubbles(buildRound(1)); setNextIdx(0); setRoundDone(false)
        }, 2000)
      }
    }
  }

  function nextRound() {
    const newLevel = Math.min(level + 1, 10)
    setLevel(newLevel)
    setBubbles(buildRound(newLevel))
    setNextIdx(0)
    setRoundDone(false)
  }

  const pd = getPhase(level)
  // Sort to find what's next
  const sortedBubbles = [...bubbles].sort((a, b) => a.sortOrder - b.sortOrder)
  const nextBubble = sortedBubbles[nextIdx]

  return (
    <div className={styles.game} style={{ background: theme.bg }}>

      {/* HUD */}
      <div className={styles.hud}>
        <Link to="/" className={styles.backBtn} style={{ color: theme.accent }}>← Home</Link>
        <div className={styles.levelBadge}>Level {level}</div>
        <div className={styles.score}>⭐ {score}</div>
        <div className={styles.lives}>{'❤️'.repeat(lives) || '💔'}</div>
        <button className={styles.switchBtn} style={{ color: theme.accent }} onClick={onSwitchTheme}>{theme.emoji} Switch</button>
      </div>

      {/* Instruction banner */}
      <div className={styles.banner}>
        <span className={styles.bannerText}>Pop smallest → biggest!</span>
        {nextBubble && !roundDone && (
          <span className={styles.bannerHint} style={{ color: theme.accent }}>
            Next: {SIZE_LABELS[nextBubble.sortOrder]}
          </span>
        )}
      </div>

      {/* Bubble play area */}
      <div className={styles.area}>
        {bubbles.map(b => (
          !b.popped && (
            <button
              key={b.id}
              className={`${styles.bubble} ${b.sortOrder === nextIdx ? styles.bubbleNext : ''}`}
              style={{
                width: b.size+'px', height: b.size+'px',
                left: b.x+'%', top: b.y+'%',
                background: `radial-gradient(circle at 32% 32%, ${b.colorPair[0]}, ${b.colorPair[1]})`,
                boxShadow: b.sortOrder === nextIdx
                  ? `inset -4px -4px 12px rgba(0,0,0,0.2), inset 4px 4px 12px rgba(255,255,255,0.3), 0 0 28px ${b.colorPair[0]}, 0 0 56px ${b.colorPair[0]}66`
                  : `inset -4px -4px 12px rgba(0,0,0,0.2), inset 4px 4px 12px rgba(255,255,255,0.2), 0 0 16px ${b.colorPair[0]}66`,
              }}
              onClick={() => handleTap(b)}
            >
              <span className={styles.bubbleEmoji} style={{ fontSize: Math.round(b.size*0.44)+'px' }}>{b.emoji}</span>
            </button>
          )
        ))}

        {/* Message */}
        {message && (
          <div className={styles.msg} style={{ color: message.color }}>{message.text}</div>
        )}

        {/* Round done overlay */}
        {roundDone && (
          <div className={styles.overlay}>
            <div className={styles.overlayBox}>
              <div className={styles.overlayEmoji}>🎉</div>
              <h2 className={styles.overlayTitle}>Amazing!</h2>
              <p className={styles.overlaySub}>You got them all in order!</p>
              <p className={styles.overlayScore}>Score: {score}</p>
              <button className={styles.overlayBtn} style={{ background: theme.cardBack }} onClick={nextRound}>
                Next round! →
              </button>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {lives === 0 && !roundDone && (
          <div className={styles.overlay}>
            <div className={styles.overlayBox}>
              <div className={styles.overlayEmoji}>😬</div>
              <h2 className={styles.overlayTitle}>Oops!</h2>
              <p className={styles.overlaySub}>Remember — smallest first!</p>
              <p className={styles.overlayScore}>Score: {score}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BubbleBurst() {
  const [themeKey, setThemeKey] = useState(null)
  if (!themeKey) return <ThemePicker onPick={setThemeKey} />
  return <BurstGame key={themeKey} themeKey={themeKey} onSwitchTheme={() => setThemeKey(null)} />
}
