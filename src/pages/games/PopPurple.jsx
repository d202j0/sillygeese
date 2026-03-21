import PopCatch from '../../components/games/PopCatch'

const CONFIG = {
  title: "Charley's Unicorn World",
  bgGradient: 'linear-gradient(180deg, #0d0020 0%, #2a0550 25%, #5c1490 55%, #8e3dbf 80%, #b06ad4 100%)',
  accentColor: '#c77dff',
  scoreEmoji: '⭐',
  livesEmoji: '🦄',
  trailEmojis: ['✨','⭐','💫','🌟','💜'],
  emojis: ['🦄','🌟','💜','🌈','🦋','💫','🍭','🌸','✨','🎀','🍬','🌙','⭐','🫧'],
  popBursts: ['✨','💥','🌟','💜','🎉','⭐','🎊','💖'],
  colors: [
    ['#e0aaff','#9d4edd'],
    ['#ffb3ff','#cc44cc'],
    ['#c77dff','#7b2fff'],
    ['#f8a8ff','#bf40bf'],
    ['#b5a8ff','#6040cc'],
    ['#ffaacc','#cc3399'],
    ['#aaddff','#4499cc'],
    ['#ffe4aa','#cc8800'],
    ['#aaffcc','#22aa66'],
  ],
}

export default function PopPurple() {
  return <PopCatch config={CONFIG} />
}
