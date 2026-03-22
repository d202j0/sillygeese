import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './AlphabetTap.module.css'

// ─── Themes ───────────────────────────────────────────
const THEMES = {
  purple: {
    label: 'Unicorns', emoji: '🦄', cardBack: '#7b2fff', accent: '#c77dff',
    bg: 'linear-gradient(180deg, #0d0020 0%, #2a0550 25%, #5c1490 55%, #8e3dbf 80%, #b06ad4 100%)',
    emojis: ['🦄','🌟','💜','🌈','🦋','💫','🍭','🌸','✨','🎀'],
    colors: [['#e0aaff','#9d4edd'],['#ffb3ff','#cc44cc'],['#c77dff','#7b2fff'],['#f8a8ff','#bf40bf'],['#b5a8ff','#6040cc']],
  },
  pink: {
    label: 'Candy', emoji: '🍭', cardBack: '#cc0066', accent: '#ff6eb4',
    bg: 'linear-gradient(180deg, #1a0010 0%, #3d0025 25%, #7a0050 55%, #c2185b 80%, #e91e8c 100%)',
    emojis: ['🍭','🍬','🍫','🧁','🍰','🎂','🍩','🍪','🍦','💝'],
    colors: [['#ffb3d9','#cc0066'],['#ff80bf','#aa0044'],['#ff99cc','#dd0077'],['#ffccee','#ee0088'],['#ff66aa','#990055']],
  },
  green: {
    label: 'Nature', emoji: '🌿', cardBack: '#007733', accent: '#44cc77',
    bg: 'linear-gradient(180deg, #001a00 0%, #003300 25%, #005500 55%, #007733 80%, #44cc77 100%)',
    emojis: ['🌿','🌸','🌻','🍀','🦋','🐸','🌳','🍃','🌺','🐝'],
    colors: [['#aaffcc','#22aa66'],['#88ffaa','#007733'],['#ccffdd','#44cc77'],['#66ee99','#005522'],['#44dd88','#003311']],
  },
}

// ─── Letter sets per phase ────────────────────────────
const PHASES = [
  { minLevel:1, maxLevel:3, letters:'ABCDE',      bubbleSize:[110,145], speedBase:5.0, spawnMs:1500 },
  { minLevel:4, maxLevel:6, letters:'ABCDEFGHIJ', bubbleSize:[100,130], speedBase:4.2, spawnMs:1250 },
  { minLevel:7, maxLevel:9, letters:'ABCDEFGHIJKLMNO', bubbleSize:[90,120], speedBase:3.4, spawnMs:1050 },
  { minLevel:10,maxLevel:99,letters:'ABCDEFGHIJKLMNOPQRSTUVWXYZ', bubbleSize:[80,110], speedBase:2.6, spawnMs:850 },
]

function getPhase(level) { return PHASES.find(p => level >= p.minLevel && level <= p.maxLevel) || PHASES[PHASES.length-1] }

const CONFETTI = ['#ff88ff','#ffdd44','#44aaff','#ff6644','#44ffaa','#ffffff']

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
      o.type = 'sine'; o.frequency.value = correct ? 660 : 200
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
        const t = ctx.currentTime + i*0.1
        g.gain.setValueAtTime(0.28,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.3)
        o.start(t); o.stop(t+0.3)
      })
    } catch(e) {}
  }
  function gameOver() {
    try {
      init()
      ;[300,240,180].forEach((f,i) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sawtooth'; o.frequency.value = f
        const t = ctx.currentTime + i*0.18
        g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.28)
        o.start(t); o.stop(t+0.28)
      })
    } catch(e) {}
  }
  return { init, pop, levelUp, gameOver }
}

// ─── Theme Picker ─────────────────────────────────────
function ThemePicker({ onPick }) {
  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <Link to="/" className={styles.pickerBack}>← Home</Link>
        <span className={styles.pickerTitle}>Alphabet Tap</span>
      </div>
      <div className={styles.pickerBody}>
        <div className={styles.pickerEmoji}>🔤</div>
        <h2 className={styles.pickerHeading}>Pick your theme!</h2>
        <p className={styles.pickerSub}>Find the matching letter before it floats away!</p>
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
function AlphabetGame({ themeKey, onSwitchTheme }) {
  const theme = THEMES[themeKey]
  const audio = useRef(createAudio())

  const areaRef       = useRef(null)
  const stateRef      = useRef({ score:0, lives:3, level:1, floatSpeed:5.0, spawnInterval:1500, running:false, spawnTimer:null, targetLetter:'' })
  const hudScoreRef   = useRef(null)
  const hudLivesRef   = useRef(null)
  const hudLevelRef   = useRef(null)
  const targetRef     = useRef(null)
  const msgRef        = useRef(null)
  const phaseRef      = useRef(null)
  const phaseTitleRef = useRef(null)
  const phaseDescRef  = useRef(null)
  const lastTrailRef  = useRef(0)
  const cursorRef     = useRef(null)

  const updateHUD = useCallback(() => {
    const s = stateRef.current
    if (hudScoreRef.current) hudScoreRef.current.textContent = `⭐ ${s.score}`
    if (hudLivesRef.current) hudLivesRef.current.textContent = '❤️'.repeat(s.lives) || '💔'
    if (hudLevelRef.current) hudLevelRef.current.textContent = `Level ${s.level}`
  }, [])

  const pickTarget = useCallback(() => {
    const s = stateRef.current
    const pd = getPhase(s.level)
    const letters = pd.letters.split('')
    s.targetLetter = letters[Math.floor(Math.random() * letters.length)]
    if (targetRef.current) targetRef.current.textContent = s.targetLetter
  }, [])

  const showMsg = useCallback((text) => {
    const m = msgRef.current; if (!m) return
    m.textContent = text
    m.style.transform = 'translate(-50%,-50%) scale(1)'; m.style.opacity = '1'
    setTimeout(() => { m.style.transform = 'translate(-50%,-50%) scale(0)'; m.style.opacity = '0' }, 1500)
  }, [])

  const spawnBurst = useCallback((cx, cy) => {
    const area = areaRef.current; if (!area) return
    const b = document.createElement('div')
    b.className = styles.burst
    b.style.cssText = `font-size:40px;left:${cx-20}px;top:${cy-20}px;`
    b.textContent = ['✨','💥','🌟','🎉','⭐'][Math.floor(Math.random()*5)]
    area.appendChild(b)
    b.addEventListener('animationend', () => b.remove())
  }, [])

  const spawnConfetti = useCallback((cx, cy) => {
    const area = areaRef.current; if (!area) return
    for (let i = 0; i < 9; i++) {
      const c = document.createElement('div')
      c.className = styles.confetti
      c.style.background = CONFETTI[Math.floor(Math.random()*CONFETTI.length)]
      const angle = (i/9)*360+Math.random()*20, dist = 28+Math.random()*40
      c.style.left = (cx+Math.cos(angle*Math.PI/180)*dist-5)+'px'
      c.style.top  = (cy+Math.sin(angle*Math.PI/180)*dist-5)+'px'
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
    el.style.left = x+'px'; el.style.top = y+'px'
    el.style.fontSize = (10+Math.random()*8)+'px'
    el.textContent = theme.emojis[Math.floor(Math.random()*theme.emojis.length)]
    document.body.appendChild(el)
    el.addEventListener('animationend', () => el.remove())
  }, [theme.emojis])

  const restartSpawner = useCallback(() => {
    const s = stateRef.current
    clearTimeout(s.spawnTimer)
    function loop() {
      if (!s.running) return
      spawnBubble()
      s.spawnTimer = setTimeout(loop, s.spawnInterval + Math.random()*350)
    }
    loop()
  }, [])

  const checkLevelUp = useCallback(() => {
    const s = stateRef.current
    if (s.score > 0 && s.score % 10 === 0) {
      s.level++
      const newPD = getPhase(s.level), oldPD = getPhase(s.level-1)
      s.floatSpeed    = Math.max(2.5, newPD.speedBase)
      s.spawnInterval = Math.max(600, newPD.spawnMs)
      audio.current.levelUp()
      if (newPD.letters !== oldPD.letters) {
        s.running = false; clearTimeout(s.spawnTimer)
        document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
        if (phaseTitleRef.current) phaseTitleRef.current.textContent = `Level ${s.level}!`
        if (phaseDescRef.current)  phaseDescRef.current.textContent  = `New letters: up to ${newPD.letters.slice(-1)}!`
        phaseRef.current?.classList.add(styles.phaseVisible)
      } else {
        showMsg(`🔤 Level ${s.level}!`)
        restartSpawner()
      }
      updateHUD()
    }
  }, [showMsg, updateHUD, restartSpawner])

  const spawnBubble = useCallback(() => {
    const s = stateRef.current
    if (!s.running) return
    const area = areaRef.current; if (!area) return
    const pd    = getPhase(s.level)
    const areaW = area.offsetWidth, areaH = area.offsetHeight
    const [minSz, maxSz] = pd.bubbleSize
    const size  = minSz + Math.random()*(maxSz-minSz)
    const x     = 10 + Math.random()*(areaW-size-20)
    const dur   = s.floatSpeed + Math.random()*1.5
    const startY = areaH*0.5 + Math.random()*areaH*0.5
    const colorPair = theme.colors[Math.floor(Math.random()*theme.colors.length)]

    // 40% chance of target letter, 60% random from pool
    const letters = pd.letters.split('')
    const isTarget = Math.random() < 0.4
    const letter = isTarget ? s.targetLetter : letters[Math.floor(Math.random()*letters.length)]

    const b = document.createElement('div')
    b.className = styles.bubble
    b.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${startY}px;background:radial-gradient(circle at 32% 32%,${colorPair[0]},${colorPair[1]});box-shadow:inset -4px -4px 12px rgba(0,0,0,0.2),inset 4px 4px 12px rgba(255,255,255,0.25),0 0 20px ${colorPair[0]}88;animation-duration:${dur}s;--travel:${startY+size+20}px;`

    const letterEl = document.createElement('div')
    letterEl.className = styles.bubbleLetter
    letterEl.style.fontSize = Math.round(size*0.5)+'px'
    letterEl.textContent = letter
    b.appendChild(letterEl)

    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation()
      if (!b.parentNode) return
      const rect = b.getBoundingClientRect(), ar = area.getBoundingClientRect()
      const cx = rect.left-ar.left+rect.width/2, cy = rect.top-ar.top+rect.height/2
      b.remove()

      if (letter === s.targetLetter) {
        audio.current.pop(true)
        spawnBurst(cx, cy); spawnConfetti(cx, cy)
        s.score++; updateHUD()
        pickTarget()
        checkLevelUp()
      } else {
        audio.current.pop(false)
        spawnBurst(cx, cy)
        s.lives = Math.max(0, s.lives-1); updateHUD()
        showMsg(`That's ${letter}!\nFind the ${s.targetLetter}! 👆`)
        if (s.lives === 0) {
          s.running = false; clearTimeout(s.spawnTimer)
          audio.current.gameOver()
          const fs = s.score
          setTimeout(() => showMsg(`Game over!\n⭐ ${fs}`), 200)
          setTimeout(() => {
            document.querySelectorAll(`.${styles.bubble}`).forEach(b => b.remove())
            s.score=0; s.lives=3; s.level=1; s.floatSpeed=5.0; s.spawnInterval=1500; s.running=true
            updateHUD(); pickTarget(); restartSpawner()
            setTimeout(spawnBubble,400); setTimeout(spawnBubble,900)
          }, 3200)
        }
      }
    }, { passive:false })

    b.addEventListener('animationend', () => { if (b.parentNode) b.remove() })
    area.appendChild(b)
  }, [theme.colors, updateHUD, pickTarget, spawnBurst, spawnConfetti, showMsg, checkLevelUp, restartSpawner])

  const dismissPhaseIntro = useCallback(() => {
    phaseRef.current?.classList.remove(styles.phaseVisible)
    const s = stateRef.current; s.running = true
    pickTarget(); restartSpawner()
    setTimeout(spawnBubble, 300); setTimeout(spawnBubble, 800)
  }, [pickTarget, restartSpawner, spawnBubble])

  useEffect(() => {
    const s = stateRef.current
    const onMouseMove = (e) => {
      if (cursorRef.current) { cursorRef.current.style.left=e.clientX+'px'; cursorRef.current.style.top=e.clientY+'px' }
      spawnTrail(e.clientX, e.clientY)
    }
    const onTouchMove = (e) => spawnTrail(e.touches[0].clientX, e.touches[0].clientY)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('touchmove', onTouchMove, { passive:true })
    const initOnce = () => { audio.current.init(); document.removeEventListener('pointerdown', initOnce) }
    document.addEventListener('pointerdown', initOnce)
    updateHUD(); pickTarget()
    s.running = true; restartSpawner()
    setTimeout(spawnBubble, 200); setTimeout(spawnBubble, 700)
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
      <div className={styles.hud}>
        <Link to="/" className={styles.backBtn} style={{ color: theme.accent }}>← Home</Link>
        <div ref={hudLevelRef} className={styles.levelBadge}>Level 1</div>
        <div ref={hudScoreRef} className={styles.score}>⭐ 0</div>
        <div ref={hudLivesRef} className={styles.lives}>❤️❤️❤️</div>
        <button className={styles.switchBtn} style={{ color: theme.accent }} onClick={onSwitchTheme}>{theme.emoji} Switch</button>
      </div>
      <div className={styles.targetBanner}>
        <span className={styles.targetLabel}>Find the letter</span>
        <span ref={targetRef} className={styles.targetLetter} style={{ color: theme.accent }}>A</span>
      </div>
      <div ref={areaRef} className={styles.area} />
      <div ref={msgRef} className={styles.msg} />
      <div ref={phaseRef} className={styles.phase}>
        <div className={styles.phaseIcon}>🔤</div>
        <div ref={phaseTitleRef} className={styles.phaseTitle}>Level up!</div>
        <div ref={phaseDescRef} className={styles.phaseDesc}>More letters!</div>
        <button className={styles.phaseBtn} style={{ background: theme.cardBack }} onClick={dismissPhaseIntro}>Ready! →</button>
      </div>
    </div>
  )
}

export default function AlphabetTap() {
  const [themeKey, setThemeKey] = useState(null)
  if (!themeKey) return <ThemePicker onPick={setThemeKey} />
  return <AlphabetGame key={themeKey} themeKey={themeKey} onSwitchTheme={() => setThemeKey(null)} />
}
