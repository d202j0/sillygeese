import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './Piano.module.css'

// ─── Constants ────────────────────────────────────────
const FALL_SECONDS = 3.5
const MIN_GAP_MS   = 250
const KEY_COUNT    = 8

// ─── Note frequencies ─────────────────────────────────
const NOTE_FREQ = {
  C4:261.63, D4:293.66, E4:329.63, F4:349.23,
  G4:392.00, A4:440.00, B4:493.88, C5:523.25,
}

// ─── Fixed 8-key layout ───────────────────────────────
const KEYS = [
  { note:'C4', black:false }, { note:'D4', black:false },
  { note:'E4', black:false }, { note:'F4', black:false },
  { note:'G4', black:false }, { note:'A4', black:false },
  { note:'B4', black:false }, { note:'C5', black:false },
]

const WHITE_COUNT = KEYS.filter(k => !k.black).length

// ─── Songs ────────────────────────────────────────────
const SONGS = [
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    emoji: '🎂',
    bpm: 80,
    notes: [
      ['G4',0.75],['G4',0.25],['A4',1],['G4',1],['C5',1],['B4',2],
      ['G4',0.75],['G4',0.25],['A4',1],['G4',1],['A4',1],['G4',2],
      ['G4',0.75],['G4',0.25],['G4',1],['E4',1],['C5',1],['B4',1],['A4',2],
      ['F4',0.75],['F4',0.25],['E4',1],['C5',1],['A4',1],['G4',2],
    ],
  },
  {
    id: 'mary-lamb',
    title: 'Mary Had a Little Lamb',
    emoji: '🐑',
    bpm: 100,
    notes: [
      ['E4',1],['D4',1],['C4',1],['D4',1],['E4',1],['E4',1],['E4',2],
      ['D4',1],['D4',1],['D4',2],['E4',1],['G4',1],['G4',2],
      ['E4',1],['D4',1],['C4',1],['D4',1],['E4',1],['E4',1],['E4',1],['E4',1],
      ['D4',1],['D4',1],['E4',1],['D4',1],['C4',2],
    ],
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    emoji: '🎵',
    bpm: 100,
    notes: [
      ['E4',1],['E4',1],['F4',1],['G4',1],['G4',1],['F4',1],['E4',1],['D4',1],
      ['C4',1],['C4',1],['D4',1],['E4',1],['E4',1.5],['D4',0.5],['D4',2],
      ['E4',1],['E4',1],['F4',1],['G4',1],['G4',1],['F4',1],['E4',1],['D4',1],
      ['C4',1],['C4',1],['D4',1],['E4',1],['D4',1.5],['C4',0.5],['C4',2],
    ],
  },
  {
    id: 'hot-cross-buns',
    title: 'Hot Cross Buns',
    emoji: '🥐',
    bpm: 100,
    notes: [
      ['E4',1],['D4',1],['C4',2],
      ['E4',1],['D4',1],['C4',2],
      ['C4',0.5],['C4',0.5],['C4',0.5],['C4',0.5],['D4',0.5],['D4',0.5],['D4',0.5],['D4',0.5],
      ['E4',1],['D4',1],['C4',2],
    ],
  },
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle',
    emoji: '⭐',
    bpm: 100,
    notes: [
      ['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['A4',1],['G4',2],
      ['F4',1],['F4',1],['E4',1],['E4',1],['D4',1],['D4',1],['C4',2],
      ['G4',1],['G4',1],['F4',1],['F4',1],['E4',1],['E4',1],['D4',2],
      ['G4',1],['G4',1],['F4',1],['F4',1],['E4',1],['E4',1],['D4',2],
      ['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['A4',1],['G4',2],
      ['F4',1],['F4',1],['E4',1],['E4',1],['D4',1],['D4',1],['C4',2],
    ],
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    emoji: '🌿',
    bpm: 80,
    notes: [
      ['A4',1],
      ['C5',1.5],['D4',0.5],['E4',0.75],['D4',0.25],['C5',1],
      ['A4',1.5],['A4',0.5],['F4',1],['G4',0.5],['A4',0.5],
      ['B4',1.5],['G4',0.5],['E4',1],['F4',0.5],['G4',0.5],
      ['E4',1.5],['C4',0.5],['D4',1],['E4',0.5],['F4',0.5],
      ['E4',1.5],['D4',0.5],['C4',1],['A4',1],
    ],
  },
]

// ─── Note colours ─────────────────────────────────────
const NOTE_COLORS = {
  C4: '#ff6b6b', D4: '#ff9f43', E4: '#ffd93d',
  F4: '#6bcb77', G4: '#4d96ff', A4: '#c77dff',
  B4: '#ff6eb4', C5: '#44ddcc',
}

// ─── Audio ────────────────────────────────────────────
function createAudio() {
  let ctx = null
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  }
  function playNote(note, dur = 0.6) {
    const freq = NOTE_FREQ[note]; if (!freq) return
    try {
      init()
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator()
      const g  = ctx.createGain(), f = ctx.createBiquadFilter()
      f.type = 'lowpass'; f.frequency.value = 2000
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(ctx.destination)
      o1.type = 'triangle'; o1.frequency.value = freq
      o2.type = 'sine';     o2.frequency.value = freq * 2
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01)
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.15)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + Math.max(dur, 0.3))
      o1.start(); o1.stop(ctx.currentTime + Math.max(dur, 0.3))
      o2.start(); o2.stop(ctx.currentTime + Math.max(dur, 0.3))
    } catch(e) {}
  }
  function playSuccess() {
    try {
      init()
      ;[523,659,784,1047].forEach((f,i) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'triangle'; o.frequency.value = f
        const t = ctx.currentTime + i * 0.1
        g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
        o.start(t); o.stop(t + 0.35)
      })
    } catch(e) {}
  }
  return { init, playNote, playSuccess }
}

// ─── Song picker screen ───────────────────────────────
function SongPicker({ onStart }) {
  const [mode, setMode] = useState(null)
  const [song, setSong] = useState(null)
  const audio = useRef(createAudio())

  return (
    <div className={styles.setup}>
      <div className={styles.setupHeader}>
        <Link to="/" className={styles.setupBack}>← Home</Link>
        <span className={styles.setupTitle}>🎹 Piano</span>
      </div>
      <div className={styles.setupBody}>
        <div className={styles.setupEmoji}>🎹</div>
        <h2 className={styles.setupHeading}>Let's play piano!</h2>

        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>What do you want to do?</div>
          <div className={styles.setupBtnRow}>
            <button
              className={`${styles.setupBtn} ${mode==='free' ? styles.setupBtnActive : ''}`}
              onClick={() => { audio.current.init(); setMode('free'); setSong(null) }}
            >
              🎵 Free play
            </button>
            <button
              className={`${styles.setupBtn} ${mode==='song' ? styles.setupBtnActive : ''}`}
              onClick={() => { audio.current.init(); setMode('song') }}
            >
              🎼 Play a song
            </button>
          </div>
        </div>

        {mode === 'song' && (
          <div className={styles.setupSection}>
            <div className={styles.setupLabel}>Pick a song</div>
            <div className={styles.songGrid}>
              {SONGS.map(s => (
                <button key={s.id}
                  className={`${styles.songBtn} ${song?.id===s.id ? styles.songBtnActive : ''}`}
                  onClick={() => setSong(s)}
                >
                  <span className={styles.songEmoji}>{s.emoji}</span>
                  <span className={styles.songTitle}>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(mode === 'free' || (mode === 'song' && song)) && (
          <button
            className={styles.startBtn}
            onClick={() => onStart({ mode, song })}
          >
            {mode === 'free' ? 'Start playing! 🎵' : `Play ${song.title}! 🎼`}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Falling note ─────────────────────────────────────
function FallingNote({ id, note, beats, bpm, color, onHit, onMiss, areaHeight, pianoHeight }) {
  const ref    = useRef(null)
  const hitRef = useRef(false)

  const keyIdx   = KEYS.findIndex(k => k.note === note)
  const travelPx = areaHeight
  const beatPx   = travelPx / (FALL_SECONDS * (bpm / 60))
  const noteH    = Math.max(32, beats * beatPx * 0.85)
  const leftPct  = (keyIdx / KEY_COUNT) * 100 + (100 / KEY_COUNT) * 0.1
  const widthPct = (100 / KEY_COUNT) * 0.8

  useEffect(() => {
    const t = setTimeout(() => {
      if (!hitRef.current) onMiss(id)
    }, FALL_SECONDS * 1000 + 400)
    return () => clearTimeout(t)
  }, [])

  const hit = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    if (hitRef.current) return
    hitRef.current = true
    if (ref.current) ref.current.style.opacity = '0'
    onHit(note, id)
  }, [note, id, onHit])

  return (
    <div
      ref={ref}
      className={styles.fallingNote}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        height: `${noteH}px`,
        background: color,
        animationDuration: `${FALL_SECONDS}s`,
        '--travel': `${travelPx}px`,
      }}
      onPointerDown={hit}
    >
      <span className={styles.fallingNoteLabel}>{note.replace(/[0-9]/g, '')}</span>
    </div>
  )
}

// ─── Piano key ────────────────────────────────────────
function PianoKey({ note, black, onPlay, glowColor }) {
  const [pressed, setPressed] = useState(false)
  const color = NOTE_COLORS[note]

  const handlePress = useCallback((e) => {
    e.preventDefault()
    setPressed(true)
    onPlay(note)
    setTimeout(() => setPressed(false), 150)
  }, [note, onPlay])

  const glowing = !!glowColor

  return (
    <div
      className={`${styles.key} ${black ? styles.keyBlack : styles.keyWhite} ${pressed ? styles.keyPressed : ''} ${glowing ? styles.keyGlowing : ''}`}
      style={glowing ? { boxShadow: `0 0 24px ${color}, 0 0 48px ${color}88`, background: color } : {}}
      onPointerDown={handlePress}
    >
      <span className={styles.keyLabel}>{note.replace(/[0-9]/g, '')}</span>
    </div>
  )
}

// ─── Game ─────────────────────────────────────────────
function PianoGame({ config, onBack }) {
  const { mode, song } = config
  const audio = useRef(createAudio())

  const [fallingNotes, setFallingNotes] = useState([])
  const [glowingKeys,  setGlowingKeys]  = useState({})
  const [score,        setScore]        = useState(0)
  const [combo,        setCombo]        = useState(0)
  const [songDone,     setSongDone]     = useState(false)
  const [message,      setMessage]      = useState(null)

  const containerRef = useRef(null)
  const pianoRef     = useRef(null)
  const noteIdRef    = useRef(0)
  const msgTimer     = useRef(null)
  const timersRef    = useRef([])

  const showMsg = useCallback((text, color = '#ffd93d') => {
    clearTimeout(msgTimer.current)
    setMessage({ text, color })
    msgTimer.current = setTimeout(() => setMessage(null), 800)
  }, [])

  const glowKey = useCallback((note, durationMs = 700) => {
    setGlowingKeys(g => ({ ...g, [note]: true }))
    setTimeout(() => setGlowingKeys(g => { const n = { ...g }; delete n[note]; return n }), durationMs)
  }, [])

  const playKey = useCallback((note) => {
    audio.current.init()
    audio.current.playNote(note, 0.5)
    glowKey(note, 300)
  }, [glowKey])

  const onHit = useCallback((note, id) => {
    playKey(note)
    setFallingNotes(fn => fn.filter(n => n.id !== id))
    setScore(s => s + 10)
    setCombo(c => {
      const next = c + 1
      showMsg(next >= 5 ? '🔥 On fire!' : next >= 3 ? '✨ Great!' : '👍 Good!', '#ffd93d')
      return next
    })
  }, [playKey, showMsg])

  const onMiss = useCallback((id) => {
    setFallingNotes(fn => fn.filter(n => n.id !== id))
    setCombo(0)
    showMsg('Miss!', '#ff6b6b')
  }, [showMsg])

  // Schedule song
  useEffect(() => {
    if (mode !== 'song' || !song) return
    audio.current.init()
    const beatMs = 60000 / song.bpm
    const timers = []
    let elapsed = 0
    let lastSpawn = -MIN_GAP_MS

    song.notes.forEach(([note, beats]) => {
      if (!NOTE_FREQ[note]) { elapsed += beats * beatMs; return }
      const spawnMs = Math.max(elapsed, lastSpawn + MIN_GAP_MS)
      lastSpawn = spawnMs

      // Spawn falling note
      timers.push(setTimeout(() => {
        const id = ++noteIdRef.current
        setFallingNotes(fn => [...fn, { id, note, beats, color: NOTE_COLORS[note] || '#fff' }])
      }, spawnMs))

      // Glow key just before it arrives
      timers.push(setTimeout(() => {
        glowKey(note, 900)
      }, spawnMs + (FALL_SECONDS - 0.8) * 1000))

      elapsed += beats * beatMs
    })

    // Song end
    timers.push(setTimeout(() => {
      setSongDone(true)
      audio.current.playSuccess()
    }, elapsed + FALL_SECONDS * 1000))

    timersRef.current = timers
    return () => timers.forEach(clearTimeout)
  }, [mode, song, glowKey])

  const areaHeight   = (containerRef.current?.offsetHeight || 600) - (pianoRef.current?.offsetHeight || 140)
  const pianoHeight  = pianoRef.current?.offsetHeight || 140

  return (
    <div className={styles.game} ref={containerRef}>

      {/* HUD */}
      <div className={styles.hud}>
        <button className={styles.hudBtn} onClick={onBack}>← Back</button>
        <div className={styles.hudCenter}>
          <span className={styles.hudSong}>
            {mode === 'free' ? '🎵 Free Play' : `${song.emoji} ${song.title}`}
          </span>
        </div>
        {mode === 'song' && (
          <div className={styles.hudScore}>
            <span className={styles.scoreNum}>{score}</span>
            {combo >= 2 && <span className={styles.combo}>×{combo}</span>}
          </div>
        )}
      </div>

      {/* Falling area */}
      <div className={styles.fallingArea}>
        {/* Lane guides */}
        {KEYS.map((k, i) => (
          <div key={k.note} className={styles.lane}
            style={{ left: `${(i / KEY_COUNT) * 100}%`, width: `${100 / KEY_COUNT}%`, background: `${NOTE_COLORS[k.note]}11` }}
          />
        ))}

        {mode === 'song' && fallingNotes.map(fn => (
          <FallingNote
            key={fn.id}
            id={fn.id}
            note={fn.note}
            beats={fn.beats}
            bpm={song.bpm}
            color={fn.color}
            onHit={onHit}
            onMiss={onMiss}
            areaHeight={areaHeight}
            pianoHeight={pianoHeight}
          />
        ))}

        {message && (
          <div className={styles.hitMsg} style={{ color: message.color }}>{message.text}</div>
        )}

        {songDone && (
          <div className={styles.songDoneOverlay}>
            <div className={styles.songDoneBox}>
              <div className={styles.songDoneEmoji}>🎉</div>
              <h2 className={styles.songDoneTitle}>Amazing!</h2>
              <p className={styles.songDoneSub}>You played {song.title}!</p>
              <p className={styles.songDoneScore}>Score: {score}</p>
              <button className={styles.songDoneBtn} onClick={onBack}>Pick another song</button>
            </div>
          </div>
        )}
      </div>

      {/* Piano */}
      <div className={styles.piano} ref={pianoRef}>
        <div className={styles.keys} style={{ '--white-count': WHITE_COUNT }}>
          {KEYS.map(({ note, black }) => (
            <PianoKey
              key={note}
              note={note}
              black={black}
              onPlay={playKey}
              glowColor={glowingKeys[note] ? NOTE_COLORS[note] : null}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── Root ─────────────────────────────────────────────
export default function Piano() {
  const [config, setConfig] = useState(null)
  if (!config) return <SongPicker onStart={setConfig} />
  return <PianoGame key={config.song?.id || 'free'} config={config} onBack={() => setConfig(null)} />
}
