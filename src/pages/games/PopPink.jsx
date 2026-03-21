import PopCatch from '../../components/games/PopCatch'

const CONFIG = {
  title: "Pink Tricks",
  bgGradient: 'linear-gradient(180deg, #1a0010 0%, #3d0025 25%, #7a0050 55%, #c2185b 80%, #e91e8c 100%)',
  accentColor: '#ff6eb4',
  scoreEmoji: '🍭',
  livesEmoji: '🩷',
  trailEmojis: ['🍭','💖','✨','🌟','🩷'],
  emojis: ['🍭','🍬','🍫','🧁','🍰','🎂','🍩','🍪','🫙','🍡','🧃','🍦','🎀','💝'],
  popBursts: ['💖','✨','🍭','💗','🎉','⭐','🎊','🩷'],
  colors: [
    ['#ffb3d9','#cc0066'],
    ['#ff80bf','#aa0044'],
    ['#ff99cc','#dd0077'],
    ['#ffccee','#ee0088'],
    ['#ff66aa','#990055'],
    ['#ffaad4','#bb0066'],
    ['#ff4499','#880033'],
    ['#ffd6eb','#cc3377'],
    ['#ff77bb','#aa2255'],
  ],
}

export default function PopPink() {
  return <PopCatch config={CONFIG} />
}
