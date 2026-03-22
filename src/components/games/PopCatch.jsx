import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './PopCatch.module.css'

// ─── Theme configs ────────────────────────────────────
const THEMES = {
  purple: {
    label: 'Unicorns',
    emoji: '🦄',
    bgGradient: 'linear-gradient(180deg, #0d0020 0%, #2a0550 25%, #5c1490 55%, #8e3dbf 80%, #b06ad4 100%)',
    accentColor: '#c77dff',
    cardBack: '#7b2fff',
    scoreEmoji: '⭐',
    livesEmoji: '🦄',
    trailEmojis: ['✨','⭐','💫','🌟','💜'],
    emojis: ['🦄','🌟','💜','🌈','🦋','💫','🍭','🌸','✨','🎀','🍬','🌙','⭐','🫧'],
    popBursts: ['✨','💥','🌟','💜','🎉','⭐','🎊','💖'],
    colors: [
      ['#e0aaff','#9d4edd'],['#ffb3ff','#cc44cc'],['#c77dff','#7b2fff'],
      ['#f8a8ff','#bf40bf'],['#b5a8ff','#6040cc'],['#ffaacc','#cc3399'],
      ['#aaddff','#4499cc'],['#ffe4aa','#cc8800'],['#aaffcc','#22aa66'],
    ],
  },
  pink: {
    label: 'Candy',
    emoji: '🍭',
    bgGradient: 'linear-gradient(180deg, #1a0010 0%, #3d0025 25%, #7a0050 55%, #c2185b 80%, #e91e8c 100%)',
    accentColor: '#ff6eb4',
    cardBack: '#cc0066',
    scoreEmoji: '🍭',
    livesEmoji: '🩷',
    trailEmojis: ['🍭','💖','✨','🌟','🩷'],
    emojis: ['🍭','🍬','🍫','🧁','🍰','🎂','🍩','🍪','🫙','🍡','🧃','🍦','🎀','💝'],
    popBursts: ['💖','✨','🍭','💗','🎉','⭐','🎊','🩷'],
    colors: [
      ['#ffb3d9','#cc0066'],['#ff80bf','#aa0044'],['#ff99cc','#dd0077'],
      ['#ffccee','#ee0088'],['#ff66aa','#990055'],['#ffaad4','#bb0066'],
      ['#ff4499','#880033'],['#ffd6eb','#cc3377'],['#ff77bb','#aa2255'],
    ],
  },
  blue: {
    label: 'Cars',
    emoji: '🚗',
    bgGradient: 'linear-gradient(180deg, #000d1a 0%, #001f3f 25%, #003580 55%, #0057b7 80%, #1a7fd4 100%)',
    accentColor: '#33aaff',
    cardBack: '#0044cc',
    scoreEmoji: '🏁',
    livesEmoji: '🚗',
    trailEmojis: ['🚗','💨','⚡','🌀','✨'],
    emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🚂','✈️','🚁','🛥️'],
    popBursts: ['💥','⭐','🌟','🏁','💨','✨','🎉','🔥'],
    learnPool: ['1','2','3','4','5','6','7','8','9','10','▲','■','●','★','♦'],
    colors: [
      ['#66ccff','#0066cc'],['#aae0ff','#0044aa'],['#55bbff','#0033bb'],
      ['#88ddff','#0055cc'],['#44aaff','#002299'],['#99ccff','#1155bb'],
      ['#ffdd88','#cc8800'],['#88ffcc','#00aa66'],['#ffaa88','#cc4400'],
    ],
    extraEffects: (area, cx, cy) => {
      if (!area) return
      const marks = ['💨','🌀','⚡','💥']
      const sk = document.createElement('div')
      sk.style.cssText = `position:absolute;pointer-events:none;font-size:28px;left:${cx-14}px;top:${cy+10}px;z-index:48;animation:skidFade 0.6s ease-out forwards;`
      sk.textContent = marks[Math.floor(Math.random() * marks.length)]
      area.appendChild(sk)
      sk.addEventListener('animationend', () => sk.remove())
    },
  },
}

// ─── Audio ────────────────────────────────────────────
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
  function pop(freq) { tone(freq, 'sine', 0.22, 0.35) }
  function levelUp() {
    [523,659,784,1047,1319].forEach((f,i) => {
      try {
        init()
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'triangle'; o.frequency.value = f
        const t = ctx.currentTime + i*0.12
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.28,t+0.04)
        g.gain.exponentialRampToValueAtTime(0.001,t+0.32)
        o.start(t); o.stop(t+0.32)
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
        const t = ctx.currentTime + i*0.18
        g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.3)
        o.start(t); o.stop(t+0.3)
      } catch(e) {}
    })
  }
  return { init, pop, levelUp, gameOver }
}

// ─── Phase config ─────────────────────────────────────
const PHASES = [
  { minLevel:1,  maxLevel:3,  showLabel:false, icon:'🎮', title:'Tap everything!',    desc:'Tap every bubble before it flies away!',                  bubbleSize:[100,135], speedBase:2.5, spawnMs:700 },
  { minLevel:4,  maxLevel:6,  showLabel:true,  icon:'🔤', title:'Letters & Numbers!', desc:'The bubbles now show letters and numbers — tap them all!', bubbleSize:[95,125],  speedBase:2.1, spawnMs:600 },
  { minLevel:7,  maxLevel:9,  showLabel:true,  icon:'🌈', title:'Getting faster!',    desc:'Quicker bubbles! Tap every single one!',                  bubbleSize:[85,112],  speedBase:1.7, spawnMs:500 },
  { minLevel:10, maxLevel:99, showLabel:true,  icon:'⭐', title:'Super star mode!',   desc:"Really fast now — you're amazing!",                       bubbleSize:[75,105],  speedBase:1.3, spawnMs:380 },
]

function getPhase(level) {
  return PHASES.find(p => level >= p.minLevel && level <= p.maxLevel) || PHASES[PHASES.length-1]
}

const CONFETTI_COLORS = ['#ff88ff','#c77dff','#ffdd77','#88ffdd','#ff88aa','#aaddff','#ffffff']
const DEFAULT_LEARN_POOL = 'ABCDEFGHIJ'.split('').concat(['1','2','3','4','5','6','7','8','9','10'])

// ─── Theme Picker ─────────────────────────────────────
function ThemePicker({ onPick }) {
  return (
    <div className={styles.picker} style={{ background: 'linear-gradient(160deg, #0d0020 0%, #1a0535 50%, #0a1a40 100%)' }}>
      <div className={styles.pickerHeader}>
        <Link to="/" className={styles.pickerBack}>← Home</Link>
        <span className={styles.pickerTitle}>Pop &amp; Catch</span>
      </div>
      <div className={styles.pickerBody}>
        <div className={styles.pickerEmoji}>🫧</div>
        <h2 className={styles.pickerHeading}>Pick your theme!</h2>
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

// ─── Game ─────────────────────────────────────────────
function Game({ themeKey, onSwitchTheme }) {
  const config = THEMES[themeKey]
  const { bgGradient, accentColor, scoreEmoji, livesEmoji, trailEmojis, emojis, popBursts, colors, learnPool = DEFAULT_LEARN_POOL, extraEffects } = config

  const areaRef       = useRef(null)
  const stateRef      = useRef({ score:0, lives:3, level:1, floatSpeed:2.5, spawnInterval:700, running:false, spawnTimer:null })
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

  useEffect(() => { audioRef.current = createAudio() }, [])

  const spawnTrail = useCallback((x, y) => {
    const now = Date.now()
    if (now - lastTrailRef.current < 80) return
    lastTrailRef.current = now
    const el = document.createElement('div')
    el.className = styles.trail
    el.style.left = x+'px'; el.style.top = y+'px'
    el.style.fontSize = (10+Math.random()*10)+'px'
    el.textContent = trailEmojis[Math.floor(Math.random()*trailEmojis.length)]
    document.body.appendChild(el)
    el.addEventListener('animationend', () => el.remove())
  }, [trailEmojis])

  const updateHUD = useCallback(() => {
    const s = stateRef.current
    if (hudScoreRef.current) hudScoreRef.current.textContent = `${scoreEmoji} ${s.score}`
    if (hudLivesRef.current) hudLivesRef.current.textContent = livesEmoji.repeat(s.lives) || '💔'
    if (hudLevelRef.current) hudLevelRef.current.textContent = `Level ${s.level}`
  }, [scoreEmoji, livesEmoji])

  const showMsg = useCallback((text) => {
    const m = msgRef.current; if (!m) return
    m.textContent = text
    m.style.transform = 'translate(-50%,-50%) scale(1)'; m.style.opacity = '1'
    setTimeout(() => { m.style.transform = 'translate(-50%,-50%) scale(0)'; m.style.opacity = '0' }, 1900)
  }, [])

  const showPhaseIntro = useCallback((pd) => {
    if (phaseIconRef.current)  phaseIconRef.current.textContent  = pd.icon
    if (phaseTitleRef.current) phaseTitleRef.current.textContent = pd.title
    if (phaseDescRef.current)  phaseDescRef.current.textContent  = pd.desc
    phaseRef.current?.classList.add(styles.phaseVisible)
  }, [])

  const spawnBurst = useCallback((cx, cy) => {
    const area = areaRef.current; if (!area) return
    const b = document.createElement('div')
    b.className = styles.burst
    b.style.cssText = `font-size:44px;left:${cx-22}px;top:${cy-22}px;`
    b.textContent = popBursts[Math.floor(Math.random()*popBursts.length)]
    area.appendChild(b)
    b.addEventListener('animationend', () => b.remove())
  }, [popBursts])

  const spawnConfetti = useCallback((cx, cy) => {
    const area = areaRef.current; if (!area) return
    for (let i = 0; i < 9; i++) {
      const c = document.createElement('div')
      c.className = styles.confetti
      c.style.background = CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)]
      const angle = (i/9)*360+Math.random()*20, dist = 28+Math.random()*45
      c.style.left = (cx+Math.cos(angle*Math.PI/180)*dist-5)+'px'
      c.style.top  = (cy+Math.sin(angle*Math.PI/180)*dist-5)+'px'
      c.style.animationDelay = (Math.random()*0.08)+'s'
      area.appendChild(c)
      c.addEventListener('animationend', () => c.remove())
    }
  }, [])

  const spawnBubble = useCallback(() => {
    const s = stateRef.current
    if (!s.running) return
    const area = areaRef.current; if (!area) return
    const pd = getPhase(s.level)
    const areaW = area.offsetWidth, areaH = area.offsetHeight
    const [minSz, maxSz] = pd.bubbleSize
    const size = minSz + Math.random()*(maxSz-minSz)
    const x    = 10 + Math.random()*(areaW-size-20)
    const dur  = s.floatSpeed + Math.random()*1
    const colorPair = colors[Math.floor(Math.random()*colors.length)]
    const emoji = emojis[Math.floor(Math.random()*emojis.length)]
    const label = pd.showLabel ? learnPool[Math.floor(Math.random()*learnPool.length)] : ''
    const startY = areaH*0.5 + Math.random()*areaH*0.5

    const b = document.createElement('div')
    b.className = styles.bubble
    b.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${startY}px;background:radial-gradient(circle at 32% 32%,${colorPair[0]},${colorPair[1]});box-shadow:inset -5px -5px 14px rgba(0,0,0,0.18),inset 5px 5px 14px rgba(255,255,255,0.28),0 0 20px ${colorPair[0]}99;animation-duration:${dur}s;--travel:${startY+size+20}px;`

    const emojiEl = document.createElement('div')
    emojiEl.className = styles.bubbleEmoji
    emojiEl.style.fontSize = Math.round(size*(label?0.38:0.48))+'px'
    emojiEl.textContent = emoji
    b.appendChild(emojiEl)

    if (label) {
      const labelEl = document.createElement('div')
      labelEl.className = styles.bubbleLabel
      labelEl.style.fontSize = Math.round(size*0.30)+'px'
      labelEl.textContent = label
      b.appendChild(labelEl)
    }

    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation()
      if (!b.parentNode) return
      const rect = b.getBoundingClientRect(), ar = area.getBoundingClientRect()
      const cx = rect.left-ar.left+rect.width/2, cy = rect.top-ar.top+rect.height/2
      b.remove(); onPop(cx, cy)
    }, { passive:false })

    b.addEventListener('animationend', () => { if (b.parentNode) { b.remove(); onMiss() } })
    area.appendChild(b)
  }, [colors, emojis, learnPool])

  const restartSpawner = useCallback(() => {
    const s = stateRef.current
    clearTimeout(s.spawnTimer)
    function loop() {
      if (!s.running) return
      spawnBubble()
      s.spawnTimer = setTimeout(loop, s.spawnInterval+Math.random()*350)
    }
    loop()
  }, [spawnBubble])

  const checkLevelUp = useCallback(() => {
    const s = stateRef.current
    if (s.score > 0 && s.score % 10 === 0) {
      s.level++
      const newPD = getPhase(s.level), oldPD = getPhase(s.level-1)
      s.floatSpeed    = Math.max(1.3, newPD.speedBase)
      s.spawnInterval = Math.max(380, newPD.spawnMs)
      audioRef.current?.levelUp()
      if (newPD.minLevel !== oldPD.minLevel) {
        s.running = false; clearTimeout(s.spawnTimer)
        document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
        showPhaseIntro(newPD)
      } else {
        showMsg(`${newPD.icon} Level ${s.level}!`)
        restartSpawner()
      }
      updateHUD()
    }
  }, [showMsg, showPhaseIntro, updateHUD, restartSpawner])

  const onPop = useCallback((cx, cy) => {
    const s = stateRef.current
    s.score++; updateHUD()
    audioRef.current?.pop(380+Math.random()*500)
    spawnBurst(cx, cy); spawnConfetti(cx, cy)
    extraEffects?.(areaRef.current, cx, cy)
    checkLevelUp()
  }, [updateHUD, spawnBurst, spawnConfetti, extraEffects, checkLevelUp])

  const onMiss = useCallback(() => {
    const s = stateRef.current
    s.lives = Math.max(0, s.lives-1); updateHUD()
    if (s.lives === 0) {
      s.running = false; clearTimeout(s.spawnTimer)
      audioRef.current?.gameOver()
      const fs = s.score
      setTimeout(() => showMsg(`Game over!\n${scoreEmoji} ${fs} popped!`), 200)
      setTimeout(() => {
        document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
        s.score=0; s.lives=3; s.level=1; s.floatSpeed=2.5; s.spawnInterval=700; s.running=true
        updateHUD(); restartSpawner()
        setTimeout(spawnBubble, 400); setTimeout(spawnBubble, 900)
      }, 3200)
    }
  }, [updateHUD, showMsg, scoreEmoji, restartSpawner, spawnBubble])

  const dismissPhaseIntro = useCallback(() => {
    phaseRef.current?.classList.remove(styles.phaseVisible)
    const s = stateRef.current; s.running = true
    restartSpawner()
    setTimeout(spawnBubble, 300); setTimeout(spawnBubble, 800)
  }, [restartSpawner, spawnBubble])

  const makeStars = useCallback(() => {
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div'); star.className = styles.star
      const sz = Math.random()*4+1.5
      star.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;animation-duration:${1.2+Math.random()*3.5}s;animation-delay:${Math.random()*4}s;`
      document.querySelector(`.${styles.game}`)?.appendChild(star)
    }
  }, [])

  useEffect(() => {
    const s = stateRef.current
    const onMouseMove = (e) => {
      if (cursorRef.current) { cursorRef.current.style.left=e.clientX+'px'; cursorRef.current.style.top=e.clientY+'px' }
      spawnTrail(e.clientX, e.clientY)
    }
    const onTouchMove = (e) => { spawnTrail(e.touches[0].clientX, e.touches[0].clientY) }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('touchmove', onTouchMove, { passive:true })
    makeStars(); updateHUD()
    s.running = true; restartSpawner()
    setTimeout(spawnBubble, 100); setTimeout(spawnBubble, 600)
    const initAudioOnce = () => { audioRef.current?.init(); document.removeEventListener('pointerdown', initAudioOnce) }
    document.addEventListener('pointerdown', initAudioOnce)
    return () => {
      s.running = false; clearTimeout(s.spawnTimer)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('pointerdown', initAudioOnce)
      document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
      document.querySelectorAll(`.${styles.trail}`).forEach(b => b.remove())
      document.querySelectorAll(`.${styles.star}`).forEach(b => b.remove())
    }
  }, [makeStars, updateHUD, restartSpawner, spawnBubble, spawnTrail])

  return (
    <div className={styles.game} style={{ background: bgGradient }}>
      <div ref={cursorRef} className={styles.cursor}>{trailEmojis[0]}</div>
      <div className={styles.hud}>
        <Link to="/" className={styles.backBtn} style={{ color: accentColor }}>← Home</Link>
        <div ref={hudLevelRef} className={styles.levelBadge}>Level 1</div>
        <div ref={hudScoreRef} className={styles.score}>{scoreEmoji} 0</div>
        <div ref={hudLivesRef} className={styles.lives}>{livesEmoji.repeat(3)}</div>
        <button className={styles.switchBtn} style={{ color: accentColor }} onClick={onSwitchTheme}>
          {config.emoji} Switch
        </button>
      </div>
      <div ref={areaRef} className={styles.area} />
      <div ref={msgRef} className={styles.msg} />
      <div ref={phaseRef} className={styles.phase}>
        <div ref={phaseIconRef} className={styles.phaseIcon}>🎮</div>
        <div ref={phaseTitleRef} className={styles.phaseTitle}>New challenge!</div>
        <div ref={phaseDescRef} className={styles.phaseDesc}>Keep going!</div>
        <button className={styles.phaseBtn} style={{ background: accentColor }} onClick={dismissPhaseIntro}>
          Ready! →
        </button>
      </div>
    </div>
  )
}

// ─── Root export ──────────────────────────────────────
export default function PopCatch() {
  const [themeKey, setThemeKey] = useState(null)
  if (!themeKey) return <ThemePicker onPick={setThemeKey} />
  return <Game key={themeKey} themeKey={themeKey} onSwitchTheme={() => setThemeKey(null)} />
}
