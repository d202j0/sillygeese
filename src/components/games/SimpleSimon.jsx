import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './SimpleSimon.module.css'

// ─── Themes ───────────────────────────────────────────
const THEMES = {
  purple: {
    label: 'Unicorns',
    emoji: '🦄',
    bg: 'linear-gradient(160deg, #0d0020 0%, #2a0550 40%, #6b1fa0 100%)',
    cardBack: '#7b2fff',
    accent: '#c77dff',
    buttons: [
      { id: 0, emoji: '🦄', color: '#c77dff', dark: '#5a1fd4', freq: 261 },
      { id: 1, emoji: '🌟', color: '#ffd93d', dark: '#cc9900', freq: 329 },
      { id: 2, emoji: '🌈', color: '#ff6eb4', dark: '#cc0066', freq: 392 },
      { id: 3, emoji: '✨', color: '#44ddcc', dark: '#00998a', freq: 523 },
    ],
  },
  blue: {
    label: 'Cars',
    emoji: '🚗',
    bg: 'linear-gradient(160deg, #000d1a 0%, #001f3f 40%, #0050a0 100%)',
    cardBack: '#0044cc',
    accent: '#33aaff',
    buttons: [
      { id: 0, emoji: '🚗', color: '#33aaff', dark: '#0044cc', freq: 261 },
      { id: 1, emoji: '🚀', color: '#ff6b6b', dark: '#cc0000', freq: 329 },
      { id: 2, emoji: '✈️', color: '#ffd93d', dark: '#cc9900', freq: 392 },
      { id: 3, emoji: '🚛', color: '#6bcb77', dark: '#007733', freq: 523 },
    ],
  },
  green: {
    label: 'Nature',
    emoji: '🌿',
    bg: 'linear-gradient(160deg, #001a00 0%, #003300 40%, #005500 100%)',
    cardBack: '#007733',
    accent: '#44cc77',
    buttons: [
      { id: 0, emoji: '🐸', color: '#44cc77', dark: '#007733', freq: 261 },
      { id: 1, emoji: '🌸', color: '#ff6eb4', dark: '#cc0066', freq: 329 },
      { id: 2, emoji: '🌻', color: '#ffd93d', dark: '#cc9900', freq: 392 },
      { id: 3, emoji: '🦋', color: '#4d96ff', dark: '#0044cc', freq: 523 },
    ],
  },
}

// ─── Audio ────────────────────────────────────────────
function createAudio() {
  let ctx = null
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  }
  function playTone(freq, duration = 0.4) {
    try {
      init()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0.4, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      o.start(); o.stop(ctx.currentTime + duration)
    } catch(e) {}
  }
  function playWrong() {
    try {
      init()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(200, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4)
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.start(); o.stop(ctx.currentTime + 0.4)
    } catch(e) {}
  }
  function playSuccess() {
    try {
      init()
      ;[523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'triangle'; o.frequency.value = f
        const t = ctx.currentTime + i * 0.1
        g.gain.setValueAtTime(0.3, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        o.start(t); o.stop(t + 0.3)
      })
    } catch(e) {}
  }
  return { init, playTone, playWrong, playSuccess }
}

// ─── Theme Picker ─────────────────────────────────────
function ThemePicker({ onPick }) {
  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <Link to="/" className={styles.pickerBack}>← Home</Link>
        <span className={styles.pickerTitle}>Simple Simon</span>
      </div>
      <div className={styles.pickerBody}>
        <div className={styles.pickerEmoji}>🧠</div>
        <h2 className={styles.pickerHeading}>Pick your theme!</h2>
        <p className={styles.pickerSub}>Watch the pattern, then copy it back!</p>
        <div className={styles.themeGrid}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              className={styles.themeBtn}
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

// ─── Game states ──────────────────────────────────────
// idle → showing → input → gameover

function SimonGame({ themeKey, onSwitchTheme }) {
  const theme   = THEMES[themeKey]
  const audio   = useRef(createAudio())

  const [sequence,   setSequence]   = useState([])
  const [phase,      setPhase]      = useState('idle')   // idle | showing | input | gameover
  const [litButton,  setLitButton]  = useState(null)
  const [inputIdx,   setInputIdx]   = useState(0)
  const [score,      setScore]      = useState(0)
  const [bestScore,  setBestScore]  = useState(0)
  const [message,    setMessage]    = useState('Tap Start to play!')
  const [wrongBtn,   setWrongBtn]   = useState(null)

  const timersRef = useRef([])

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const t = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }, [])

  // ─── Light up a button ────────────────────────────
  const flashButton = useCallback((btnId, duration = 500) => {
    const btn = theme.buttons[btnId]
    setLitButton(btnId)
    audio.current.playTone(btn.freq, duration / 1000)
    return new Promise(res => {
      t(() => { setLitButton(null); res() }, duration)
    })
  }, [theme, t])

  // ─── Play sequence ────────────────────────────────
  const playSequence = useCallback(async (seq) => {
    setPhase('showing')
    setMessage('Watch carefully! 👀')
    setInputIdx(0)

    // Pause before showing
    await new Promise(res => t(res, 600))

    for (let i = 0; i < seq.length; i++) {
      await flashButton(seq[i], 500)
      await new Promise(res => t(res, 200))
    }

    setPhase('input')
    setMessage('Your turn! 👆')
  }, [flashButton, t])

  // ─── Start / next round ───────────────────────────
  const startRound = useCallback((existingSeq = []) => {
    clearTimers()
    const nextBtn = Math.floor(Math.random() * 4)
    const newSeq  = [...existingSeq, nextBtn]
    setSequence(newSeq)
    setScore(newSeq.length - 1)
    playSequence(newSeq)
  }, [playSequence])

  const handleStart = useCallback(() => {
    audio.current.init()
    setScore(0)
    setWrongBtn(null)
    startRound([])
  }, [startRound])

  // ─── Handle button tap ────────────────────────────
  const handleButtonTap = useCallback((btnId) => {
    if (phase !== 'input') return
    audio.current.init()

    const expected = sequence[inputIdx]

    if (btnId === expected) {
      // Correct
      flashButton(btnId, 350)
      const nextIdx = inputIdx + 1

      if (nextIdx === sequence.length) {
        // Completed the sequence!
        const newScore = sequence.length
        setScore(newScore)
        setBestScore(b => Math.max(b, newScore))
        audio.current.playSuccess()
        setPhase('showing')
        setMessage(`✅ Round ${newScore} done!`)
        t(() => startRound(sequence), 1200)
      } else {
        setInputIdx(nextIdx)
      }
    } else {
      // Wrong!
      setWrongBtn(btnId)
      audio.current.playWrong()
      setPhase('gameover')
      setBestScore(b => Math.max(b, sequence.length - 1))
      setMessage('Oh no! 😬')
      t(() => setWrongBtn(null), 600)
    }
  }, [phase, sequence, inputIdx, flashButton, startRound, t])

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [])

  const isIdle     = phase === 'idle'
  const isGameOver = phase === 'gameover'
  const isShowing  = phase === 'showing'
  const isInput    = phase === 'input'

  return (
    <div className={styles.game} style={{ background: theme.bg }}>

      {/* HUD */}
      <div className={styles.hud}>
        <Link to="/" className={styles.backBtn} style={{ color: theme.accent }}>← Home</Link>
        <div className={styles.hudCenter}>
          <span className={styles.scoreLabel}>Round</span>
          <span className={styles.scoreNum} style={{ color: theme.accent }}>{score}</span>
          {bestScore > 0 && <span className={styles.bestScore}>Best: {bestScore}</span>}
        </div>
        <button className={styles.switchBtn} style={{ color: theme.accent }} onClick={onSwitchTheme}>
          {theme.emoji} Switch
        </button>
      </div>

      {/* Message */}
      <div className={styles.messageBar}>
        <span className={`${styles.message} ${isInput ? styles.messageInput : ''}`}>
          {message}
        </span>
      </div>

      {/* Buttons grid */}
      <div className={`${styles.buttonsWrap} ${isShowing ? styles.buttonsWatching : ''}`}>
        <div className={styles.buttons}>
          {theme.buttons.map(btn => {
            const isLit   = litButton === btn.id
            const isWrong = wrongBtn === btn.id
            return (
              <button
                key={btn.id}
                className={`${styles.btn} ${isLit ? styles.btnLit : ''} ${isWrong ? styles.btnWrong : ''} ${isInput ? styles.btnActive : ''}`}
                style={{
                  '--btn-color': btn.color,
                  '--btn-dark':  btn.dark,
                  background: isLit ? btn.color : btn.dark,
                  boxShadow: isLit
                    ? `0 0 40px ${btn.color}, 0 0 80px ${btn.color}66, inset 0 2px 8px rgba(255,255,255,0.3)`
                    : `inset 0 4px 12px rgba(0,0,0,0.4)`,
                }}
                onClick={() => handleButtonTap(btn.id)}
                disabled={!isInput}
              >
                <span className={styles.btnEmoji}>{btn.emoji}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Start / game over */}
      {(isIdle || isGameOver) && (
        <div className={styles.overlay}>
          {isGameOver && (
            <div className={styles.gameOverScore}>
              <div className={styles.gameOverEmoji}>😬</div>
              <div className={styles.gameOverTitle}>Game over!</div>
              <div className={styles.gameOverSub}>You got to round {sequence.length - 1}</div>
              {bestScore > 0 && <div className={styles.gameOverBest}>Best: {bestScore}</div>}
            </div>
          )}
          <button
            className={styles.startBtn}
            style={{ background: theme.cardBack, boxShadow: `0 0 24px ${theme.cardBack}88` }}
            onClick={handleStart}
          >
            {isIdle ? 'Start! 🧠' : 'Try again! 🔄'}
          </button>
        </div>
      )}

      {/* Sequence indicator dots */}
      {!isIdle && !isGameOver && (
        <div className={styles.dots}>
          {sequence.map((btnId, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i < inputIdx ? styles.dotDone : ''} ${i === inputIdx && isInput ? styles.dotCurrent : ''}`}
              style={{ background: i < inputIdx ? theme.buttons[btnId].color : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>
      )}

    </div>
  )
}

// ─── Root ─────────────────────────────────────────────
export default function SimpleSimon() {
  const [themeKey, setThemeKey] = useState(null)
  if (!themeKey) return <ThemePicker onPick={setThemeKey} />
  return <SimonGame key={themeKey} themeKey={themeKey} onSwitchTheme={() => setThemeKey(null)} />
}
