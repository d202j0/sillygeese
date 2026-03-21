import PopCatch from '../../components/games/PopCatch'
import styles from './PopBlue.module.css'

// Skid mark effect — spawns a little emoji near the pop point
function skidEffect(area, cx, cy) {
  if (!area) return
  const marks = ['💨','🌀','⚡','💥']
  const sk = document.createElement('div')
  sk.className = styles.skid
  sk.style.left = (cx - 14) + 'px'
  sk.style.top  = (cy + 10) + 'px'
  sk.textContent = marks[Math.floor(Math.random() * marks.length)]
  area.appendChild(sk)
  sk.addEventListener('animationend', () => sk.remove())
}

const CONFIG = {
  title: "Orley's Car World",
  bgGradient: 'linear-gradient(180deg, #000d1a 0%, #001f3f 25%, #003580 55%, #0057b7 80%, #1a7fd4 100%)',
  accentColor: '#33aaff',
  scoreEmoji: '🏁',
  livesEmoji: '🚗',
  trailEmojis: ['🚗','💨','⚡','🌀','✨'],
  emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🚂','✈️','🚁','🛥️'],
  popBursts: ['💥','⭐','🌟','🏁','💨','✨','🎉','🔥'],
  learnPool: ['1','2','3','4','5','6','7','8','9','10','▲','■','●','★','♦'],
  colors: [
    ['#66ccff','#0066cc'],
    ['#aae0ff','#0044aa'],
    ['#55bbff','#0033bb'],
    ['#88ddff','#0055cc'],
    ['#44aaff','#002299'],
    ['#99ccff','#1155bb'],
    ['#ffdd88','#cc8800'],
    ['#88ffcc','#00aa66'],
    ['#ffaa88','#cc4400'],
  ],
  extraEffects: skidEffect,
}

export default function PopBlue() {
  return <PopCatch config={CONFIG} />
}
