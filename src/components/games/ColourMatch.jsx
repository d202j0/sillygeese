import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './ColourMatch.module.css'

// ─── Themes ───────────────────────────────────────────
const THEMES = {
  purple: {
    label: 'Unicorns',
    emoji: '🦄',
    bg: 'linear-gradient(180deg, #0d0020 0%, #2a0550 25%, #5c1490 55%, #8e3dbf 80%, #b06ad4 100%)',
    accent: '#c77dff',
    cardBack: '#7b2fff',
    emojis: ['🦄','🌟','💜','🌈','🦋','💫','🍭','🌸','✨','🎀'],
  },
  blue: {
    label: 'Cars',
    emoji: '🚗',
    bg: 'linear-gradient(180deg, #000d1a 0%, #001f3f 25%, #003580 55%, #0057b7 80%, #1a7fd4 100%)',
    accent: '#33aaff',
    cardBack: '#0044cc',
    emojis: ['🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','🛻','🚚'],
  },
  green: {
    label: 'Nature',
    emoji: '🌿',
    bg: 'linear-gradient(180deg, #001a00 0%, #003300 25%, #005500 55%, #007733 80%, #44cc77 100%)',
    accent: '#44cc77',
    cardBack: '#007733',
    emojis: ['🌿','🌸','🌻','🍀','🦋','🐸','🌳','🍃','🌺','🐝'],
  },
}

// ─── Colours used in game ─────────────────────────────
const COLOURS = [
  { id: 'red',    label: 'Red',    hex: '#ff4444', light: '#ff8888' },
  { id: 'blue',   label: 'Blue',   hex: '#4488ff', light: '#88bbff' },
  { id: 'yellow', label: 'Yellow', hex: '#ffcc00', light: '#ffee66' },
  { id: 'green',  label: 'Green',  hex: '#44cc44', light: '#88ee88' },
  { id: 'purple', label: 'Purple', hex: '#aa44ff', light: '#cc88ff' },
  { id: 'orange', label: 'Orange', hex: '#ff8800', light: '#ffbb44' },
]

// ─── Audio ────────────────────────────────────────────
function createAudio() {
  let ctx = null
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  }
  function pop(correct) {
    try {
      init()
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.value = correct ? 600 : 200
      if (!correct) o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25)
      g.gain.setValueAtTime(0.35, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      o.start(); o.stop(ctx.currentTime + 0.25)
    } catch(e) {}
  }
  function levelUp() {
    try {
      init()
      ;[523,659,784,1047].forEach((f,i) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'triangle'; o.frequency.value = f
        const t = ctx.currentTime + i * 0.1
        g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        o.start(t); o.stop(t + 0.3)
      })
    } catch(e) {}
  }
  function gameOver() {
    try {
      init()
      ;[300, 240, 180].forEach((f,i) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sawtooth'; o.frequency.value = f
        const t = ctx.currentTime + i * 0.18
        g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
        o.start(t); o.stop(t + 0.28)
      })
    } catch(e) {}
  }
  return { init, pop, levelUp, gameOver }
}

// ─── Phase config ─────────────────────────────────────
// numColours = how many colours are in use at this level
const PHASES = [
  { minLevel:1,  maxLevel:3,  numColours:3, bubbleSize:[110,140], speedBase:5.0, spawnMs:1400 },
  { minLevel:4,  maxLevel:6,  numColours:4, bubbleSize:[100,130], speedBase:4.2, spawnMs:1200 },
  { minLevel:7,  maxLevel:9,  numColours:5, bubbleSize:[90,120],  speedBase:3.4, spawnMs:1000 },
  { minLevel:10, maxLevel:99, numColours:6, bubbleSize:[80,110],  speedBase:2.6, spawnMs:800  },
]

function getPhase(level) {
  return PHASES.find(p => level >= p.minLevel && level <= p.maxLevel) || PHASES[PHASES.length - 1]
}

const CONFETTI = ['#ff88ff','#ffdd44','#44aaff','#ff6644','#44ffaa','#ffffff']

// ─── Theme Picker ─────────────────────────────────────
function ThemePicker({ onPick }) {
  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <Link to="/" className={styles.pickerBack}>← Home</Link>
        <span className={styles.pickerTitle}>Colour Match</span>
      </div>
      <div className={styles.pickerBody}>
        <div className={styles.pickerEmoji}>🎨</div>
        <h2 className={styles.pickerHeading}>Pick your theme!</h2>
        <p className={styles.pickerSub}>Tap only the bubbles that match the colour!</p>
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
function ColourMatchGame({ themeKey, onSwitchTheme }) {
  const theme = THEMES[themeKey]
  const audio = useRef(createAudio())

  const areaRef      = useRef(null)
  const stateRef     = useRef({
    score: 0, lives: 3, level: 1,
    floatSpeed: 5.0, spawnInterval: 1400,
    running: false, spawnTimer: null,
    targetColour: null, activeColours: [],
  })
  const hudScoreRef  = useRef(null)
  const hudLivesRef  = useRef(null)
  const hudLevelRef  = useRef(null)
  const targetRef    = useRef(null)
  const msgRef       = useRef(null)
  const phaseRef     = useRef(null)
  const phaseTitleRef = useRef(null)
  const phaseDescRef = useRef(null)
  const lastTrailRef = useRef(0)
  const cursorRef    = useRef(null)

  const updateHUD = useCallback(() => {
    const s = stateRef.current
    if (hudScoreRef.current) hudScoreRef.current.textContent = `⭐ ${s.score}`
    if (hudLivesRef.current) hudLivesRef.current.textContent = '❤️'.repeat(s.lives) || '💔'
    if (hudLevelRef.current) hudLevelRef.current.textContent = `Level ${s.level}`
  }, [])

  const pickTarget = useCallback(() => {
    const s = stateRef.current
    const col = s.activeColours[Math.floor(Math.random() * s.activeColours.length)]
    s.targetColour = col
    if (targetRef.current) {
      targetRef.current.style.background = col.hex
      targetRef.current.textContent = col.label
    }
  }, [])

  const showMsg = useCallback((text) => {
    const m = msgRef.current; if (!m) return
    m.textContent = text
    m.style.transform = 'translate(-50%,-50%) scale(1)'; m.style.opacity = '1'
    setTimeout(() => { m.style.transform = 'translate(-50%,-50%) scale(0)'; m.style.opacity = '0' }, 1400)
  }, [])

  const showPhaseIntro = useCallback((pd, numColours) => {
    if (phaseTitleRef.current) phaseTitleRef.current.textContent = `Level ${stateRef.current.level}!`
    if (phaseDescRef.current)  phaseDescRef.current.textContent  = `Now using ${numColours} colours — stay sharp!`
    phaseRef.current?.classList.add(styles.phaseVisible)
  }, [])

  const spawnBurst = useCallback((cx, cy, correct) => {
    const area = areaRef.current; if (!area) return
    const b = document.createElement('div')
    b.className = styles.burst
    b.style.cssText = `font-size:40px;left:${cx-20}px;top:${cy-20}px;`
    b.textContent = correct ? '✅' : '❌'
    area.appendChild(b)
    b.addEventListener('animationend', () => b.remove())
  }, [])

  const spawnConfetti = useCallback((cx, cy) => {
    const area = areaRef.current; if (!area) return
    for (let i = 0; i < 8; i++) {
      const c = document.createElement('div')
      c.className = styles.confetti
      c.style.background = CONFETTI[Math.floor(Math.random() * CONFETTI.length)]
      const angle = (i/8)*360 + Math.random()*20, dist = 24 + Math.random()*40
      c.style.left = (cx + Math.cos(angle*Math.PI/180)*dist - 5) + 'px'
      c.style.top  = (cy + Math.sin(angle*Math.PI/180)*dist - 5) + 'px'
      area.appendChild(c)
      c.addEventListener('animationend', () => c.remove())
    }
  }, [])

  const spawnTrail = useCallback((x, y) => {
    const now = Date.now()
    if (now - lastTrailRef.current < 80) return
    lastTrailRef.current = now
    const el = document.createElement('div')
    el.className = styles.trail
    el.style.left = x + 'px'; el.style.top = y + 'px'
    el.style.fontSize = (10 + Math.random()*8) + 'px'
    el.textContent = theme.emojis[Math.floor(Math.random()*theme.emojis.length)]
    document.body.appendChild(el)
    el.addEventListener('animationend', () => el.remove())
  }, [theme.emojis])

  const spawnBubble = useCallback(() => {
    const s = stateRef.current
    if (!s.running) return
    const area = areaRef.current; if (!area) return
    const pd    = getPhase(s.level)
    const areaW = area.offsetWidth, areaH = area.offsetHeight
    const [minSz, maxSz] = pd.bubbleSize
    const size  = minSz + Math.random()*(maxSz-minSz)
    const x     = 10 + Math.random()*(areaW - size - 20)
    const dur   = s.floatSpeed + Math.random()*1.5
    const startY = areaH * 0.5 + Math.random() * areaH * 0.5

    // Pick a colour — 40% chance of target colour, rest random
    const isTarget = Math.random() < 0.4
    const colour = isTarget
      ? s.targetColour
      : s.activeColours[Math.floor(Math.random() * s.activeColours.length)]

    const emoji = theme.emojis[Math.floor(Math.random() * theme.emojis.length)]

    const b = document.createElement('div')
    b.className = styles.bubble
    b.style.cssText = `
      width:${size}px; height:${size}px; left:${x}px; top:${startY}px;
      background: radial-gradient(circle at 32% 32%, ${colour.light}, ${colour.hex});
      box-shadow: inset -4px -4px 12px rgba(0,0,0,0.2), inset 4px 4px 12px rgba(255,255,255,0.25), 0 0 20px ${colour.hex}88;
      animation-duration: ${dur}s;
      --travel: ${startY + size + 20}px;
    `

    const emojiEl = document.createElement('div')
    emojiEl.className = styles.bubbleEmoji
    emojiEl.style.fontSize = Math.round(size * 0.44) + 'px'
    emojiEl.textContent = emoji
    b.appendChild(emojiEl)

    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation()
      if (!b.parentNode) return
      const rect = b.getBoundingClientRect(), ar = area.getBoundingClientRect()
      const cx = rect.left - ar.left + rect.width/2
      const cy = rect.top  - ar.top  + rect.height/2
      b.remove()

      if (colour.id === s.targetColour?.id) {
        // Correct!
        audio.current.pop(true)
        spawnBurst(cx, cy, true)
        spawnConfetti(cx, cy)
        s.score++
        updateHUD()
        // Change target every 5 correct pops
        if (s.score % 5 === 0) {
          checkLevelUp()
          pickTarget()
        }
      } else {
        // Wrong colour
        audio.current.pop(false)
        spawnBurst(cx, cy, false)
        s.lives = Math.max(0, s.lives - 1)
        updateHUD()
        if (s.lives === 0) doGameOver()
      }
    }, { passive: false })

    b.addEventListener('animationend', () => { if (b.parentNode) b.remove() })

    area.appendChild(b)
  }, [theme.emojis, updateHUD, pickTarget, spawnBurst, spawnConfetti])

  const restartSpawner = useCallback(() => {
    const s = stateRef.current
    clearTimeout(s.spawnTimer)
    function loop() {
      if (!s.running) return
      spawnBubble()
      s.spawnTimer = setTimeout(loop, s.spawnInterval + Math.random()*350)
    }
    loop()
  }, [spawnBubble])

  const checkLevelUp = useCallback(() => {
    const s = stateRef.current
    if (s.score > 0 && s.score % 15 === 0) {
      s.level++
      const newPD = getPhase(s.level)
      const oldPD = getPhase(s.level - 1)
      s.floatSpeed    = Math.max(2.0, newPD.speedBase)
      s.spawnInterval = Math.max(600, newPD.spawnMs)
      audio.current.levelUp()
      // Update active colours
      s.activeColours = COLOURS.slice(0, newPD.numColours)
      if (newPD.numColours !== oldPD.numColours) {
        s.running = false
        clearTimeout(s.spawnTimer)
        document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
        showPhaseIntro(newPD, newPD.numColours)
      } else {
        showMsg(`🌈 Level ${s.level}!`)
        restartSpawner()
      }
      updateHUD()
    }
  }, [showMsg, showPhaseIntro, updateHUD, restartSpawner])

  const doGameOver = useCallback(() => {
    const s = stateRef.current
    s.running = false; clearTimeout(s.spawnTimer)
    audio.current.gameOver()
    const fs = s.score
    setTimeout(() => showMsg(`Game over!\n⭐ ${fs} matched!`), 200)
    setTimeout(() => {
      document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
      s.score = 0; s.lives = 3; s.level = 1
      s.floatSpeed = 5.0; s.spawnInterval = 1400
      s.activeColours = COLOURS.slice(0, 3)
      s.running = true
      updateHUD()
      pickTarget()
      restartSpawner()
      setTimeout(spawnBubble, 400); setTimeout(spawnBubble, 900)
    }, 3000)
  }, [showMsg, updateHUD, pickTarget, restartSpawner, spawnBubble])

  const dismissPhaseIntro = useCallback(() => {
    phaseRef.current?.classList.remove(styles.phaseVisible)
    const s = stateRef.current
    s.running = true
    pickTarget()
    restartSpawner()
    setTimeout(spawnBubble, 300); setTimeout(spawnBubble, 800)
  }, [pickTarget, restartSpawner, spawnBubble])

  useEffect(() => {
    const s = stateRef.current
    s.activeColours = COLOURS.slice(0, 3)
    s.targetColour  = COLOURS[0]

    const onMouseMove = (e) => {
      if (cursorRef.current) { cursorRef.current.style.left = e.clientX+'px'; cursorRef.current.style.top = e.clientY+'px' }
      spawnTrail(e.clientX, e.clientY)
    }
    const onTouchMove = (e) => spawnTrail(e.touches[0].clientX, e.touches[0].clientY)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('touchmove', onTouchMove, { passive: true })

    const initOnce = () => { audio.current.init(); document.removeEventListener('pointerdown', initOnce) }
    document.addEventListener('pointerdown', initOnce)

    updateHUD()
    pickTarget()
    s.running = true
    restartSpawner()
    setTimeout(spawnBubble, 200)
    setTimeout(spawnBubble, 700)

    return () => {
      s.running = false; clearTimeout(s.spawnTimer)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('pointerdown', initOnce)
      document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
      document.querySelectorAll(`.${styles.trail}`).forEach(b => b.remove())
    }
  }, [updateHUD, pickTarget, restartSpawner, spawnBubble, spawnTrail])

  return (
    <div className={styles.game} style={{ background: theme.bg }}>
      <div ref={cursorRef} className={styles.cursor}>{theme.emojis[0]}</div>

      {/* HUD */}
      <div className={styles.hud}>
        <Link to="/" className={styles.backBtn} style={{ color: theme.accent }}>← Home</Link>
        <div ref={hudLevelRef} className={styles.levelBadge}>Level 1</div>
        <div ref={hudScoreRef} className={styles.score}>⭐ 0</div>
        <div ref={hudLivesRef} className={styles.lives}>❤️❤️❤️</div>
        <button className={styles.switchBtn} style={{ color: theme.accent }} onClick={onSwitchTheme}>
          {theme.emoji} Switch
        </button>
      </div>

      {/* Target colour banner */}
      <div className={styles.targetBanner}>
        <span className={styles.targetLabel}>Tap the</span>
        <span ref={targetRef} className={styles.targetColour}>Red</span>
        <span className={styles.targetLabel}>bubbles!</span>
      </div>

      {/* Game area */}
      <div ref={areaRef} className={styles.area} />

      <div ref={msgRef} className={styles.msg} />

      {/* Phase intro */}
      <div ref={phaseRef} className={styles.phase}>
        <div className={styles.phaseIcon}>🌈</div>
        <div ref={phaseTitleRef} className={styles.phaseTitle}>Level up!</div>
        <div ref={phaseDescRef} className={styles.phaseDesc}>More colours now!</div>
        <button className={styles.phaseBtn} style={{ background: theme.cardBack }} onClick={dismissPhaseIntro}>
          Ready! →
        </button>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────
export default function ColourMatch() {
  const [themeKey, setThemeKey] = useState(null)
  if (!themeKey) return <ThemePicker onPick={setThemeKey} />
  return <ColourMatchGame key={themeKey} themeKey={themeKey} onSwitchTheme={() => setThemeKey(null)} />
}
