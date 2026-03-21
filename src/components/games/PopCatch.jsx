import { useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './PopCatch.module.css'

// ─── Audio helpers ────────────────────────────────────
function createAudio() {
  let ctx = null
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  }
  function tone(freq, type, duration, gainVal) {
    try {
      init()
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = type; o.frequency.value = freq
      g.gain.setValueAtTime(gainVal, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      o.start(); o.stop(ctx.currentTime + duration)
    } catch(e) {}
  }
  function pop(freq)    { tone(freq, 'sine', 0.22, 0.35) }
  function wrong()      { tone(180, 'sawtooth', 0.18, 0.25) }
  function levelUp()    {
    [523,659,784,1047,1319].forEach((f,i) => {
      try {
        init()
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'triangle'; o.frequency.value = f
        const t = ctx.currentTime + i * 0.12
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.28, t + 0.04)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
        o.start(t); o.stop(t + 0.32)
      } catch(e) {}
    })
  }
  function gameOver() {
    [400,320,260,200].forEach((f,i) => {
      try {
        init()
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sawtooth'; o.frequency.value = f
        const t = ctx.currentTime + i * 0.18
        g.gain.setValueAtTime(0.2, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        o.start(t); o.stop(t + 0.3)
      } catch(e) {}
    })
  }
  return { init, pop, wrong, levelUp, gameOver }
}

// ─── Phase config ─────────────────────────────────────
const PHASES = [
  { minLevel:1,  maxLevel:3,  showLabel:false, icon:'🎮', title:'Tap everything!',     desc:'Tap every bubble before it flies away!',                  bubbleSize:[100,135], speedBase:5.5, spawnMs:1400 },
  { minLevel:4,  maxLevel:6,  showLabel:true,  icon:'🔤', title:'Letters & Numbers!',  desc:'The bubbles now show letters and numbers — tap them all!', bubbleSize:[95,125],  speedBase:4.8, spawnMs:1250 },
  { minLevel:7,  maxLevel:9,  showLabel:true,  icon:'🌈', title:'Getting faster!',     desc:'Quicker bubbles! Tap every single one!',                  bubbleSize:[85,112],  speedBase:4.0, spawnMs:1100 },
  { minLevel:10, maxLevel:99, showLabel:true,  icon:'⭐', title:'Super star mode!',    desc:"Really fast now — you're amazing!",                       bubbleSize:[75,105],  speedBase:3.2, spawnMs:900  },
]

function getPhase(level) {
  return PHASES.find(p => level >= p.minLevel && level <= p.maxLevel) || PHASES[PHASES.length - 1]
}

const CONFETTI_COLORS = ['#ff88ff','#c77dff','#ffdd77','#88ffdd','#ff88aa','#aaddff','#ffffff']
const LEARN_POOL = 'ABCDEFGHIJ'.split('').concat(['1','2','3','4','5','6','7','8','9','10'])

// ─── Main component ────────────────────────────────────
export default function PopCatch({ config }) {
  const {
    title,
    emojis,
    popBursts,
    colors,
    trailEmojis,
    livesEmoji,
    scoreEmoji,
    bgGradient,
    accentColor,
    learnPool = LEARN_POOL,
    extraEffects,  // optional fn(area, cx, cy) for theme-specific effects
  } = config

  const areaRef       = useRef(null)
  const stateRef      = useRef({
    score: 0, lives: 3, level: 1,
    floatSpeed: 5.5, spawnInterval: 1400,
    running: false, spawnTimer: null,
  })
  const audioRef      = useRef(null)
  const cursorRef     = useRef(null)
  const lastTrailRef  = useRef(0)
  const hudScoreRef   = useRef(null)
  const hudLivesRef   = useRef(null)
  const hudLevelRef   = useRef(null)
  const msgRef        = useRef(null)
  const phaseRef      = useRef(null)
  const phaseIconRef  = useRef(null)
  const phaseTitleRef = useRef(null)
  const phaseDescRef  = useRef(null)

  // ─── Audio ──────────────────────────────────────────
  useEffect(() => { audioRef.current = createAudio() }, [])

  // ─── Cursor trail ───────────────────────────────────
  const spawnTrail = useCallback((x, y) => {
    const now = Date.now()
    if (now - lastTrailRef.current < 80) return
    lastTrailRef.current = now
    const el = document.createElement('div')
    el.className = styles.trail
    el.style.left = x + 'px'
    el.style.top  = y + 'px'
    el.style.fontSize = (10 + Math.random() * 10) + 'px'
    el.textContent = trailEmojis[Math.floor(Math.random() * trailEmojis.length)]
    document.body.appendChild(el)
    el.addEventListener('animationend', () => el.remove())
  }, [trailEmojis])

  // ─── HUD ────────────────────────────────────────────
  const updateHUD = useCallback(() => {
    const s = stateRef.current
    if (hudScoreRef.current) hudScoreRef.current.textContent = `${scoreEmoji} ${s.score}`
    if (hudLivesRef.current) hudLivesRef.current.textContent = livesEmoji.repeat(s.lives) || '💔'
    if (hudLevelRef.current) hudLevelRef.current.textContent = `Level ${s.level}`
  }, [scoreEmoji, livesEmoji])

  // ─── Message overlay ────────────────────────────────
  const showMsg = useCallback((text) => {
    const m = msgRef.current
    if (!m) return
    m.textContent = text
    m.style.transform = 'translate(-50%,-50%) scale(1)'
    m.style.opacity = '1'
    setTimeout(() => {
      m.style.transform = 'translate(-50%,-50%) scale(0)'
      m.style.opacity = '0'
    }, 1900)
  }, [])

  // ─── Phase intro ────────────────────────────────────
  const showPhaseIntro = useCallback((pd) => {
    if (phaseIconRef.current)  phaseIconRef.current.textContent  = pd.icon
    if (phaseTitleRef.current) phaseTitleRef.current.textContent = pd.title
    if (phaseDescRef.current)  phaseDescRef.current.textContent  = pd.desc
    if (phaseRef.current) phaseRef.current.classList.add(styles.phaseVisible)
  }, [])

  // ─── Effects ────────────────────────────────────────
  const spawnBurst = useCallback((cx, cy) => {
    const area = areaRef.current; if (!area) return
    const b = document.createElement('div')
    b.className = styles.burst
    b.style.cssText = `font-size:44px;left:${cx - 22}px;top:${cy - 22}px;`
    b.textContent = popBursts[Math.floor(Math.random() * popBursts.length)]
    area.appendChild(b)
    b.addEventListener('animationend', () => b.remove())
  }, [popBursts])

  const spawnConfetti = useCallback((cx, cy) => {
    const area = areaRef.current; if (!area) return
    for (let i = 0; i < 9; i++) {
      const c = document.createElement('div')
      c.className = styles.confetti
      c.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
      const angle = (i / 9) * 360 + Math.random() * 20
      const dist  = 28 + Math.random() * 45
      c.style.left = (cx + Math.cos(angle * Math.PI / 180) * dist - 5) + 'px'
      c.style.top  = (cy + Math.sin(angle * Math.PI / 180) * dist - 5) + 'px'
      c.style.animationDelay = (Math.random() * 0.08) + 's'
      area.appendChild(c)
      c.addEventListener('animationend', () => c.remove())
    }
  }, [])

  // ─── Game logic ─────────────────────────────────────
  const spawnBubble = useCallback(() => {
    const s = stateRef.current
    if (!s.running) return
    const area = areaRef.current; if (!area) return
    const pd    = getPhase(s.level)
    const areaW = area.offsetWidth
    const [minSz, maxSz] = pd.bubbleSize
    const size  = minSz + Math.random() * (maxSz - minSz)
    const x     = 10 + Math.random() * (areaW - size - 20)
    const dur   = s.floatSpeed + Math.random() * 2
    const colorPair = colors[Math.floor(Math.random() * colors.length)]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    const label = pd.showLabel ? learnPool[Math.floor(Math.random() * learnPool.length)] : ''

    const b = document.createElement('div')
    b.className = styles.bubble
    b.style.cssText = `
      width:${size}px; height:${size}px; left:${x}px; bottom:-${size + 20}px;
      background: radial-gradient(circle at 32% 32%, ${colorPair[0]}, ${colorPair[1]});
      box-shadow: inset -5px -5px 14px rgba(0,0,0,0.18), inset 5px 5px 14px rgba(255,255,255,0.28), 0 0 20px ${colorPair[0]}99;
      animation-duration: ${dur}s;
    `

    const emojiEl = document.createElement('div')
    emojiEl.className = styles.bubbleEmoji
    emojiEl.style.fontSize = Math.round(size * (label ? 0.38 : 0.48)) + 'px'
    emojiEl.textContent = emoji
    b.appendChild(emojiEl)

    if (label) {
      const labelEl = document.createElement('div')
      labelEl.className = styles.bubbleLabel
      labelEl.style.fontSize = Math.round(size * 0.30) + 'px'
      labelEl.textContent = label
      b.appendChild(labelEl)
    }

    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation()
      if (!b.parentNode) return
      const rect    = b.getBoundingClientRect()
      const areaRect = area.getBoundingClientRect()
      const cx = rect.left - areaRect.left + rect.width / 2
      const cy = rect.top  - areaRect.top  + rect.height / 2
      b.remove()
      onPop(cx, cy)
    }, { passive: false })

    b.addEventListener('animationend', () => {
      if (b.parentNode) { b.remove(); onMiss() }
    })

    area.appendChild(b)
  }, [colors, emojis, learnPool])

  const checkLevelUp = useCallback(() => {
    const s = stateRef.current
    if (s.score > 0 && s.score % 10 === 0) {
      s.level++
      const newPD = getPhase(s.level)
      const oldPD = getPhase(s.level - 1)
      s.floatSpeed    = Math.max(2.5, newPD.speedBase)
      s.spawnInterval = Math.max(500, newPD.spawnMs)
      audioRef.current?.levelUp()
      if (newPD.minLevel !== oldPD.minLevel) {
        s.running = false
        clearTimeout(s.spawnTimer)
        document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
        showPhaseIntro(newPD)
      } else {
        showMsg(`${newPD.icon} Level ${s.level}!`)
        restartSpawner()
      }
      updateHUD()
    }
  }, [showMsg, showPhaseIntro, updateHUD])

  const onPop = useCallback((cx, cy) => {
    const s = stateRef.current
    s.score++
    updateHUD()
    audioRef.current?.pop(380 + Math.random() * 500)
    spawnBurst(cx, cy)
    spawnConfetti(cx, cy)
    extraEffects?.(areaRef.current, cx, cy)
    checkLevelUp()
  }, [updateHUD, spawnBurst, spawnConfetti, extraEffects, checkLevelUp])

  const onMiss = useCallback(() => {
    const s = stateRef.current
    s.lives = Math.max(0, s.lives - 1)
    updateHUD()
    if (s.lives === 0) doGameOver()
  }, [updateHUD])

  const doGameOver = useCallback(() => {
    const s = stateRef.current
    s.running = false
    clearTimeout(s.spawnTimer)
    audioRef.current?.gameOver()
    const fs = s.score
    setTimeout(() => showMsg(`Game over!\n${scoreEmoji} ${fs} popped!`), 200)
    setTimeout(resetGame, 3200)
  }, [showMsg, scoreEmoji])

  const resetGame = useCallback(() => {
    const s = stateRef.current
    document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
    s.score = 0; s.lives = 3; s.level = 1
    s.floatSpeed = 5.5; s.spawnInterval = 1400
    s.running = true
    updateHUD()
    restartSpawner()
    setTimeout(spawnBubble, 400)
    setTimeout(spawnBubble, 900)
  }, [updateHUD, spawnBubble])

  const restartSpawner = useCallback(() => {
    const s = stateRef.current
    clearTimeout(s.spawnTimer)
    function loop() {
      if (!s.running) return
      spawnBubble()
      s.spawnTimer = setTimeout(loop, s.spawnInterval + Math.random() * 350)
    }
    loop()
  }, [spawnBubble])

  const dismissPhaseIntro = useCallback(() => {
    phaseRef.current?.classList.remove(styles.phaseVisible)
    const s = stateRef.current
    s.running = true
    restartSpawner()
    setTimeout(spawnBubble, 300)
    setTimeout(spawnBubble, 800)
  }, [restartSpawner, spawnBubble])

  // ─── Stars ──────────────────────────────────────────
  const makeStars = useCallback(() => {
    for (let i = 0; i < 50; i++) {
      const s = document.createElement('div')
      s.className = styles.star
      const sz = Math.random() * 4 + 1.5
      s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;animation-duration:${1.2+Math.random()*3.5}s;animation-delay:${Math.random()*4}s;`
      document.querySelector(`.${styles.game}`)?.appendChild(s)
    }
  }, [])

  // ─── Mount / unmount ────────────────────────────────
  useEffect(() => {
    const s = stateRef.current

    // Mouse cursor
    const onMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top  = e.clientY + 'px'
      }
      spawnTrail(e.clientX, e.clientY)
    }
    const onTouchMove = (e) => {
      spawnTrail(e.touches[0].clientX, e.touches[0].clientY)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('touchmove', onTouchMove, { passive: true })

    makeStars()
    updateHUD()

    // Start spawning immediately — no waiting for interaction
    s.running = true
    restartSpawner()
    setTimeout(spawnBubble, 100)
    setTimeout(spawnBubble, 600)

    // Init audio lazily on first tap (iOS requires a user gesture)
    const initAudioOnce = () => {
      audioRef.current?.init()
      document.removeEventListener('pointerdown', initAudioOnce)
    }
    document.addEventListener('pointerdown', initAudioOnce)

    return () => {
      s.running = false
      clearTimeout(s.spawnTimer)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('pointerdown', initAudioOnce)
      document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
      document.querySelectorAll(`.${styles.trail}`).forEach(b => b.remove())
    }
  }, [makeStars, updateHUD, restartSpawner, spawnBubble, spawnTrail])

  return (
    <div className={styles.game} style={{ background: bgGradient }}>

      {/* Custom cursor — hidden on touch devices via CSS */}
      <div ref={cursorRef} className={styles.cursor}>{trailEmojis[0]}</div>

      {/* HUD */}
      <div className={styles.hud}>
        <Link to="/" className={styles.backBtn} style={{ color: accentColor }}>← Home</Link>
        <div ref={hudLevelRef} className={styles.levelBadge}>Level 1</div>
        <div ref={hudScoreRef} className={styles.score}>{scoreEmoji} 0</div>
        <div ref={hudLivesRef} className={styles.lives}>{livesEmoji.repeat(3)}</div>
      </div>

      {/* Game area */}
      <div ref={areaRef} className={styles.area} />

      {/* Level-up message */}
      <div ref={msgRef} className={styles.msg} />

      {/* Phase intro overlay */}
      <div ref={phaseRef} className={styles.phase}>
        <div ref={phaseIconRef} className={styles.phaseIcon}>🎮</div>
        <div ref={phaseTitleRef} className={styles.phaseTitle}>New challenge!</div>
        <div ref={phaseDescRef} className={styles.phaseDesc}>Keep going!</div>
        <button
          className={styles.phaseBtn}
          style={{ background: accentColor }}
          onClick={dismissPhaseIntro}
        >
          Ready! →
        </button>
      </div>

    </div>
  )
}
