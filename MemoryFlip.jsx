import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './MemoryFlip.module.css'

// ─── Themes ───────────────────────────────────────────
const THEMES = {
  purple: {
    label: 'Unicorns',
    emoji: '🦄',
    bg: 'linear-gradient(160deg, #0d0020 0%, #2a0550 40%, #6b1fa0 100%)',
    cardBack: '#7b2fff',
    cardFront: '#f0e6ff',
    accent: '#c77dff',
    text: '#4a0099',
  },
  pink: {
    label: 'Candy',
    emoji: '🍭',
    bg: 'linear-gradient(160deg, #1a0010 0%, #3d0025 40%, #8c1a5a 100%)',
    cardBack: '#cc0066',
    cardFront: '#ffe4f0',
    accent: '#ff6eb4',
    text: '#880044',
  },
  blue: {
    label: 'Cars',
    emoji: '🚗',
    bg: 'linear-gradient(160deg, #000d1a 0%, #001f3f 40%, #0050a0 100%)',
    cardBack: '#0044cc',
    cardFront: '#e0f2ff',
    accent: '#33aaff',
    text: '#002299',
  },
  cards: {
    label: 'Cards',
    emoji: '🃏',
    bg: 'radial-gradient(ellipse at center, #2d5a27 0%, #1a3d16 50%, #0f2a0c 100%)',
    cardBack: '#1a237e',
    cardFront: '#ffffff',
    accent: '#ffd700',
    text: '#111',
    isCards: true,
  },
}

// ─── Playing card definitions ─────────────────────────
const PLAYING_CARDS = [
  { val: 'A♠', suit: '♠', rank: 'A', color: '#111' },
  { val: 'K♥', suit: '♥', rank: 'K', color: '#cc0000' },
  { val: 'Q♦', suit: '♦', rank: 'Q', color: '#cc0000' },
  { val: 'J♣', suit: '♣', rank: 'J', color: '#111' },
  { val: 'A♥', suit: '♥', rank: 'A', color: '#cc0000' },
  { val: 'K♠', suit: '♠', rank: 'K', color: '#111' },
  { val: 'Q♣', suit: '♣', rank: 'Q', color: '#111' },
  { val: 'J♦', suit: '♦', rank: 'J', color: '#cc0000' },
  { val: 'A♣', suit: '♣', rank: 'A', color: '#111' },
  { val: 'A♦', suit: '♦', rank: 'A', color: '#cc0000' },
  { val: 'K♦', suit: '♦', rank: 'K', color: '#cc0000' },
  { val: 'K♣', suit: '♣', rank: 'K', color: '#111' },
]

// ─── Card pool ────────────────────────────────────────
const CARD_POOL = [
  '🦄','🌈','⭐','🎀','🦋','🍭','🍬','🌸',
  '🚗','🚀','🏆','🎉','🎨','🎸','🍕','🐶',
  '🐱','🦊','🐸','🌺','A','B','C','D',
  'E','F','G','H','1','2','3','4',
  '5','6','7','8','9','10',
]

// ─── Grid levels ──────────────────────────────────────
const LEVELS = [
  { cols: 3, rows: 2, pairs: 3,  label: 'Level 1' },
  { cols: 4, rows: 3, pairs: 6,  label: 'Level 2' },
  { cols: 4, rows: 4, pairs: 8,  label: 'Level 3' },
  { cols: 5, rows: 4, pairs: 10, label: 'Level 4' },
  { cols: 6, rows: 4, pairs: 12, label: 'Level 5' },
]

// ─── Audio ────────────────────────────────────────────
function useAudio() {
  const ctx = useRef(null)
  const init = useCallback(() => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.current.state === 'suspended') ctx.current.resume()
  }, [])
  const tone = useCallback((freq, type, dur, gain, delay = 0) => {
    try {
      init()
      const o = ctx.current.createOscillator()
      const g = ctx.current.createGain()
      o.connect(g); g.connect(ctx.current.destination)
      o.type = type; o.frequency.value = freq
      const t = ctx.current.currentTime + delay
      g.gain.setValueAtTime(gain, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + dur)
      o.start(t); o.stop(t + dur)
    } catch(e) {}
  }, [init])

  const flip    = useCallback(() => tone(440, 'sine', 0.12, 0.2), [tone])
  const match   = useCallback(() => { [523,659,784].forEach((f,i) => tone(f,'triangle',0.25,0.25,i*0.1)) }, [tone])
  const noMatch = useCallback(() => tone(200, 'sawtooth', 0.15, 0.2), [tone])
  const win     = useCallback(() => { [523,659,784,1047,1319,1568].forEach((f,i) => tone(f,'triangle',0.3,0.28,i*0.1)) }, [tone])

  return { init, flip, match, noMatch, win }
}

// ─── Confetti ─────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    dur: 1.5 + Math.random() * 1,
    color: ['#ff88ff','#ffdd44','#44aaff','#ff6644','#44ffaa','#c77dff'][i % 6],
    size: 8 + Math.random() * 8,
  }))
  return (
    <div className={styles.confettiWrap} aria-hidden>
      {pieces.map(p => (
        <div key={p.id} className={styles.confettiPiece} style={{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.dur + 's',
          background: p.color,
          width: p.size + 'px',
          height: p.size + 'px',
        }} />
      ))}
    </div>
  )
}

// ─── Playing card face ────────────────────────────────
function PlayingCardFace({ val }) {
  const card = PLAYING_CARDS.find(c => c.val === val)
  if (!card) return <span className={styles.cardVal}>{val}</span>
  return (
    <div className={styles.playingCard}>
      <div className={styles.playingCardCorner} style={{ color: card.color }}>
        <div className={styles.playingCardRank}>{card.rank}</div>
        <div className={styles.playingCardSuit}>{card.suit}</div>
      </div>
      <div className={styles.playingCardCenter} style={{ color: card.color }}>
        {card.suit}
      </div>
      <div className={`${styles.playingCardCorner} ${styles.playingCardCornerBR}`} style={{ color: card.color }}>
        <div className={styles.playingCardRank}>{card.rank}</div>
        <div className={styles.playingCardSuit}>{card.suit}</div>
      </div>
    </div>
  )
}

// ─── Card back pattern ────────────────────────────────
function CardBackPattern() {
  return (
    <div className={styles.cardBackPattern}>
      <div className={styles.cardBackInner}>
        {'♠♥♦♣'.split('').map((s, i) => (
          <span key={i} className={styles.cardBackSuit}>{s}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────
export default function MemoryFlip() {
  const [themeKey, setThemeKey]         = useState(null)
  const [levelIdx, setLevelIdx]         = useState(0)
  const [cards, setCards]               = useState([])
  const [flipped, setFlipped]           = useState([])
  const [matched, setMatched]           = useState([])
  const [locked, setLocked]             = useState(false)
  const [winState, setWinState]         = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [moves, setMoves]               = useState(0)
  const audio = useAudio()

  const theme = themeKey ? THEMES[themeKey] : null

  // ─── Build grid ───────────────────────────────────
  const buildGrid = useCallback((lvlIdx) => {
    const lvl = LEVELS[lvlIdx]
    let pool
    if (themeKey === 'cards') {
      pool = [...PLAYING_CARDS]
        .sort(() => Math.random() - 0.5)
        .slice(0, lvl.pairs)
        .map(c => c.val)
    } else {
      pool = [...CARD_POOL].sort(() => Math.random() - 0.5).slice(0, lvl.pairs)
    }
    const doubled = [...pool, ...pool].sort(() => Math.random() - 0.5)
    return doubled.map((val, i) => ({ id: i, val }))
  }, [themeKey])

  // ─── Start / reset ────────────────────────────────
  const startLevel = useCallback((lvlIdx) => {
    setCards(buildGrid(lvlIdx))
    setFlipped([])
    setMatched([])
    setLocked(false)
    setWinState(false)
    setShowConfetti(false)
    setMoves(0)
    setLevelIdx(lvlIdx)
  }, [buildGrid])

  useEffect(() => {
    if (themeKey) startLevel(0)
  }, [themeKey]) // eslint-disable-line

  // ─── Tap a card ───────────────────────────────────
  const onCardTap = useCallback((idx) => {
    if (locked) return
    if (flipped.includes(idx)) return
    if (matched.includes(idx)) return
    audio.init()
    audio.flip()

    const newFlipped = [...flipped, idx]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setLocked(true)
      setMoves(m => m + 1)
      const [a, b] = newFlipped
      if (cards[a].val === cards[b].val) {
        setTimeout(() => {
          audio.match()
          const newMatched = [...matched, a, b]
          setMatched(newMatched)
          setFlipped([])
          setLocked(false)
          if (newMatched.length === cards.length) {
            setTimeout(() => { audio.win(); setWinState(true); setShowConfetti(true) }, 400)
          }
        }, 300)
      } else {
        setTimeout(() => { audio.noMatch(); setFlipped([]); setLocked(false) }, 900)
      }
    }
  }, [locked, flipped, matched, cards, audio])

  const nextLevel = useCallback(() => {
    const next = Math.min(levelIdx + 1, LEVELS.length - 1)
    startLevel(next)
  }, [levelIdx, startLevel])

  const replay = useCallback(() => startLevel(levelIdx), [levelIdx, startLevel])

  // ─── Theme picker ─────────────────────────────────
  if (!themeKey) {
    return (
      <div className={styles.page} style={{ background: 'linear-gradient(160deg, #0d0020 0%, #1a0535 50%, #0a1a40 100%)' }}>
        <div className={styles.pickerHeader}>
          <Link to="/" className={styles.backBtn}>← Home</Link>
          <span className={styles.pickerTitle}>Memory Flip</span>
        </div>
        <div className={styles.pickerBody}>
          <div className={styles.pickerEmoji}>🃏</div>
          <h2 className={styles.pickerHeading}>Pick your theme!</h2>
          <div className={styles.themeGrid}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                className={styles.themeBtn}
                style={{ background: t.cardBack, boxShadow: `0 8px 24px ${t.cardBack}88` }}
                onClick={() => { audio.init(); setThemeKey(key) }}
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

  const lvl = LEVELS[levelIdx]
  const isCards = theme.isCards

  return (
    <div className={styles.page} style={{ background: theme.bg }}>
      <Confetti active={showConfetti} />

      {/* Green baize texture overlay for cards theme */}
      {isCards && <div className={styles.baize} />}

      {/* HUD */}
      <div className={styles.hud} style={isCards ? { background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,215,0,0.2)' } : {}}>
        <Link to="/" className={styles.backBtn} style={{ color: theme.accent }}>← Home</Link>
        <div className={styles.hudMid}>
          <span className={styles.levelBadge} style={{ background: theme.cardBack }}>{lvl.label}</span>
          <span className={styles.movesBadge}>🔄 {moves}</span>
        </div>
        <button className={styles.themeSwitch} onClick={() => setThemeKey(null)} style={{ color: theme.accent }}>
          {theme.emoji} Switch
        </button>
      </div>

      {/* Grid */}
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${lvl.cols}, 1fr)` }}>
        {cards.map((card, idx) => {
          const isFaceUp = flipped.includes(idx) || matched.includes(idx)
          const isMatched = matched.includes(idx)
          return (
            <div
              key={card.id}
              className={`${styles.cardWrap} ${isFaceUp ? styles.faceUp : ''} ${isMatched ? styles.matched : ''} ${isCards ? styles.cardWrapPlaying : ''}`}
              onClick={() => onCardTap(idx)}
            >
              <div className={styles.cardInner}>
                {/* Card back */}
                <div className={styles.cardBack} style={{ background: theme.cardBack }}>
                  {isCards
                    ? <CardBackPattern />
                    : <span className={styles.cardBackEmoji}>{theme.emoji}</span>
                  }
                </div>
                {/* Card front */}
                <div className={styles.cardFront} style={{ background: theme.cardFront, color: theme.text }}>
                  {isCards
                    ? <PlayingCardFace val={card.val} />
                    : <span className={styles.cardVal}>{card.val}</span>
                  }
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Win overlay */}
      {winState && (
        <div className={styles.winOverlay}>
          <div className={styles.winBox}>
            <div className={styles.winEmoji}>{isCards ? '♠️' : '🎉'}</div>
            <h2 className={styles.winTitle}>You did it!</h2>
            <p className={styles.winSub}>{lvl.label} cleared in {moves} moves!</p>
            <div className={styles.winBtns}>
              {levelIdx < LEVELS.length - 1 && (
                <button className={styles.winBtn} style={{ background: theme.cardBack }} onClick={nextLevel}>
                  Next level →
                </button>
              )}
              <button className={`${styles.winBtn} ${styles.winBtnSecondary}`} onClick={replay}>Play again</button>
              <button className={`${styles.winBtn} ${styles.winBtnSecondary}`} onClick={() => setThemeKey(null)}>Change theme</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
