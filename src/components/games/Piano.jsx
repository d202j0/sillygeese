import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './Piano.module.css'

// ─── Constants ────────────────────────────────────────
const MIN_GAP_MS     = 250
const KEY_COUNT      = 8
const ZONE_OPEN_FRAC = 0.80  // note enters hit zone at 80% through fall
const ZONE_CLOSE_MS  = 350   // grace ms after note reaches bottom

const DIFFICULTY = {
  easy:   { label: 'Easy',   emoji: '🐣', bpmMult: 0.65, fallSeconds: 4.5 },
  normal: { label: 'Normal', emoji: '🎵', bpmMult: 1.0,  fallSeconds: 3.5 },
  hard:   { label: 'Hard',   emoji: '🔥', bpmMult: 1.3,  fallSeconds: 2.5 },
}

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
    } catch { /* noop — audio unsupported */ }
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
    } catch { /* noop — audio unsupported */ }
  }
  return { init, playNote, playSuccess }
}

// ─── Stars from accuracy ──────────────────────────────
function starsFromAccuracy(acc) {
  if (acc >= 0.9) return 3
  if (acc >= 0.6) return 2
  if (acc >= 0.3) return 1
  return 0
}

// ─── Song picker ─────────────────────────────────────
function SongPicker({ onStart }) {
  const [mode, setMode] = useState(null)
  const [song, setSong] = useState(null)
  const [difficulty, setDifficulty] = useState('normal')
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
          <>
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

            <div className={styles.setupSection}>
              <div className={styles.setupLabel}>Difficulty</div>
              <div className={styles.setupBtnRow}>
                {Object.entries(DIFFICULTY).map(([key, d]) => (
                  <button key={key}
                    className={`${styles.setupBtn} ${difficulty===key ? styles.setupBtnActive : ''}`}
                    onClick={() => setDifficulty(key)}
                  >
                    {d.emoji} {d.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {(mode === 'free' || (mode === 'song' && song)) && (
          <button
            className={styles.startBtn}
            onClick={() => onStart({ mode, song, difficulty })}
          >
            {mode === 'free' ? 'Start playing! 🎵' : `Play ${song.title}! 🎼`}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Falling note (visual only — tap the key, not the note) ──────────────────
function FallingNote({ id, note, beats, bpm, color, onEnterZone, onMiss, areaHeight, fallSeconds }) {
  const [inZone, setInZone] = useState(false)

  const keyIdx   = KEYS.findIndex(k => k.note === note)
  const travelPx = areaHeight
  const beatPx   = travelPx / (fallSeconds * (bpm / 60))
  const noteH    = Math.max(32, beats * beatPx * 0.85)
  const leftPct  = (keyIdx / KEY_COUNT) * 100 + (100 / KEY_COUNT) * 0.1
  const widthPct = (100 / KEY_COUNT) * 0.8

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      setInZone(true)
      onEnterZone(note, id)
    }, fallSeconds * ZONE_OPEN_FRAC * 1000)

    const missTimer = setTimeout(() => {
      onMiss(note, id)
    }, fallSeconds * 1000 + ZONE_CLOSE_MS)

    return () => { clearTimeout(enterTimer); clearTimeout(missTimer) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`${styles.fallingNote} ${inZone ? styles.fallingNoteInZone : ''}`}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        height: `${noteH}px`,
        background: color,
        animationDuration: `${fallSeconds}s`,
        '--travel': `${travelPx}px`,
        '--note-color': color,
      }}
    >
      <span className={styles.fallingNoteLabel}>{note.replace(/[0-9]/g, '')}</span>
    </div>
  )
}

// ─── Piano key ────────────────────────────────────────
function PianoKey({ note, black, onPlay, glowColor, inZone }) {
  const [pressed, setPressed] = useState(false)
  const color = NOTE_COLORS[note]

  const handlePress = useCallback((e) => {
    e.preventDefault()
    setPressed(true)
    onPlay(note)
    setTimeout(() => setPressed(false), 150)
  }, [note, onPlay])

  const active = !!glowColor || inZone

  return (
    <div
      className={`${styles.key} ${black ? styles.keyBlack : styles.keyWhite} ${pressed ? styles.keyPressed : ''} ${inZone ? styles.keyInZone : (glowColor ? styles.keyGlowing : '')}`}
      style={active ? { boxShadow: `0 0 24px ${color}, 0 0 48px ${color}88`, background: color } : {}}
      onPointerDown={handlePress}
    >
      <span className={styles.keyLabel}>{note.replace(/[0-9]/g, '')}</span>
    </div>
  )
}

// ─── Game ─────────────────────────────────────────────
function PianoGame({ config, onBack, onPlayAgain }) {
  const { mode, song, difficulty: diffKey = 'normal' } = config
  const diff         = DIFFICULTY[diffKey] || DIFFICULTY.normal
  const fallSeconds  = mode === 'song' ? diff.fallSeconds : 3.5
  const effectiveBpm = song ? Math.round(song.bpm * diff.bpmMult) : 100

  const audio = useRef(createAudio())

  const [fallingNotes, setFallingNotes] = useState([])
  const [glowingKeys,  setGlowingKeys]  = useState({})
  const [inZoneNotes,  setInZoneNotes]  = useState(new Set())
  const [score,        setScore]        = useState(0)
  const [combo,        setCombo]        = useState(0)
  const [songDone,     setSongDone]     = useState(false)
  const [message,      setMessage]      = useState(null)
  const [hitCount,     setHitCount]     = useState(0)
  const [totalNotes,   setTotalNotes]   = useState(0)

  const containerRef   = useRef(null)
  const pianoRef       = useRef(null)
  const noteIdRef      = useRef(0)
  const msgTimer       = useRef(null)
  const timersRef      = useRef([])
  const activeNotesRef = useRef({})  // note name → falling note id, currently in hit zone

  const showMsg = useCallback((text, color = '#ffd93d') => {
    clearTimeout(msgTimer.current)
    setMessage({ text, color })
    msgTimer.current = setTimeout(() => setMessage(null), 800)
  }, [])

  const glowKey = useCallback((note, durationMs = 700) => {
    setGlowingKeys(g => ({ ...g, [note]: true }))
    setTimeout(() => setGlowingKeys(g => { const n = { ...g }; delete n[note]; return n }), durationMs)
  }, [])

  const removeFromZone = useCallback((note) => {
    delete activeNotesRef.current[note]
    setInZoneNotes(s => { const next = new Set(s); next.delete(note); return next })
  }, [])

  const onEnterZone = useCallback((note, id) => {
    activeNotesRef.current[note] = id
    setInZoneNotes(s => new Set([...s, note]))
  }, [])

  const onMiss = useCallback((note, id) => {
    removeFromZone(note)
    setFallingNotes(fn => fn.filter(n => n.id !== id))
    setCombo(0)
    showMsg('Miss! ✗', '#ff6b6b')
  }, [removeFromZone, showMsg])

  const handleKeyPress = useCallback((note) => {
    audio.current.init()
    audio.current.playNote(note, 0.5)
    glowKey(note, 250)

    if (mode !== 'song') return

    const activeId = activeNotesRef.current[note]
    if (activeId != null) {
      removeFromZone(note)
      setFallingNotes(fn => fn.filter(n => n.id !== activeId))
      setScore(s => s + 10)
      setHitCount(h => h + 1)
      setCombo(c => {
        const next = c + 1
        showMsg(next >= 5 ? '🔥 On fire!' : next >= 3 ? '✨ Great!' : '👍 Nice!', '#ffd93d')
        return next
      })
    }
    // No note in zone: sound plays, no score change — exploring is fine
  }, [mode, glowKey, removeFromZone, showMsg])

  // Schedule song
  useEffect(() => {
    if (mode !== 'song' || !song) return
    audio.current.init()
    const beatMs = 60000 / effectiveBpm
    const timers = []
    let elapsed = 0
    let lastSpawn = -MIN_GAP_MS
    let noteCount = 0

    song.notes.forEach(([note, beats]) => {
      if (!NOTE_FREQ[note]) { elapsed += beats * beatMs; return }
      noteCount++
      const spawnMs = Math.max(elapsed, lastSpawn + MIN_GAP_MS)
      lastSpawn = spawnMs

      timers.push(setTimeout(() => {
        const id = ++noteIdRef.current
        setFallingNotes(fn => [...fn, { id, note, beats, color: NOTE_COLORS[note] || '#fff' }])
      }, spawnMs))

      // Early glow hint at 65% through fall — "get ready"
      timers.push(setTimeout(() => {
        glowKey(note, 500)
      }, spawnMs + fallSeconds * 0.65 * 1000))

      elapsed += beats * beatMs
    })

    setTotalNotes(noteCount)

    timers.push(setTimeout(() => {
      setSongDone(true)
      audio.current.playSuccess()
    }, elapsed + (fallSeconds + 0.5) * 1000))

    timersRef.current = timers
    return () => timers.forEach(clearTimeout)
  }, [mode, song, glowKey, effectiveBpm, fallSeconds])

  const areaHeight   = (containerRef.current?.offsetHeight || 600) - (pianoRef.current?.offsetHeight || 140)
  const accuracy     = totalNotes > 0 ? hitCount / totalNotes : 0
  const stars        = starsFromAccuracy(accuracy)
  const accuracyPct  = Math.round(accuracy * 100)

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
            bpm={effectiveBpm}
            color={fn.color}
            onEnterZone={onEnterZone}
            onMiss={onMiss}
            areaHeight={areaHeight}
            fallSeconds={fallSeconds}
          />
        ))}

        {message && (
          <div className={styles.hitMsg} style={{ color: message.color }}>{message.text}</div>
        )}

        {/* Hit zone — the tap target */}
        {mode === 'song' && <div className={styles.hitZone}><span className={styles.hitZoneLabel}>TAP THE KEY ↓</span></div>}

        {songDone && (
          <div className={styles.songDoneOverlay}>
            <div className={styles.songDoneBox}>
              <div className={styles.songDoneEmoji}>🎉</div>
              <h2 className={styles.songDoneTitle}>Amazing!</h2>
              <p className={styles.songDoneSub}>You played {song.title}!</p>
              <div className={styles.songDoneStars}>
                {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
              </div>
              <p className={styles.songDoneAccuracy}>{accuracyPct}% accuracy</p>
              <p className={styles.songDoneScore}>Score: {score}</p>
              <div className={styles.songDoneBtns}>
                <button className={`${styles.songDoneBtn} ${styles.songDoneBtnPrimary}`} onClick={onPlayAgain}>
                  Play again 🔄
                </button>
                <button className={`${styles.songDoneBtn} ${styles.songDoneBtnSecondary}`} onClick={onBack}>
                  Pick another song
                </button>
              </div>
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
              onPlay={handleKeyPress}
              glowColor={glowingKeys[note] ? NOTE_COLORS[note] : null}
              inZone={inZoneNotes.has(note)}
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
  const [playCount, setPlayCount] = useState(0)
  if (!config) return <SongPicker onStart={setConfig} />
  return (
    <PianoGame
      key={`${config.song?.id || 'free'}-${playCount}`}
      config={config}
      onBack={() => setConfig(null)}
      onPlayAgain={() => setPlayCount(c => c + 1)}
    />
  )
}
