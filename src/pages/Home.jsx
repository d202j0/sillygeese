import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GAMES, THEMES } from '../data/games'
import styles from './Home.module.css'

const FLOATING = ['🪿','🦄','🚗','🌈','⭐','🎈','🌟','🦋','🍭','✨']

export default function Home() {
  const [activeTheme, setActiveTheme] = useState(null)

  const filtered = activeTheme
    ? GAMES.filter(g => g.theme === activeTheme)
    : GAMES

  return (
    <div className={styles.page}>

      {/* Floating background emojis */}
      <div className={styles.floaters} aria-hidden>
        {FLOATING.map((e, i) => (
          <span key={i} className={styles.floater} style={{
            left: `${(i / FLOATING.length) * 100}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${6 + (i % 4)}s`,
            fontSize: `${28 + (i % 3) * 14}px`,
          }}>{e}</span>
        ))}
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoEmoji}>🪿</span>
          <div>
            <h1 className={styles.logoTitle}>Silly Geese</h1>
            <p className={styles.logoSub}>Games for little brains</p>
          </div>
        </div>
        <Link to="/parents" className={styles.parentsLink}>
          👋 Info for parents
        </Link>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>
          Pick a game<br />
          <span className={styles.heroAccent}>& start playing!</span>
        </h2>
        <p className={styles.heroSub}>
          Free games that help little ones learn letters, numbers,<br className={styles.br} />
          colours and shapes — while having a ridiculous amount of fun.
        </p>
      </section>

      {/* Theme filter */}
      <section className={styles.filterSection}>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${!activeTheme ? styles.filterActive : ''}`}
            onClick={() => setActiveTheme(null)}
          >
            🎮 All games
          </button>
          {Object.entries(THEMES).map(([key, theme]) => (
            <button
              key={key}
              className={`${styles.filterBtn} ${activeTheme === key ? styles.filterActive : ''}`}
              style={activeTheme === key ? { background: theme.color, color: '#fff', borderColor: theme.dark } : {}}
              onClick={() => setActiveTheme(activeTheme === key ? null : key)}
            >
              {theme.emoji} {theme.label}
            </button>
          ))}
        </div>
      </section>

      {/* Game grid */}
      <main className={styles.grid}>
        {filtered.map((game, i) => {
          const theme = THEMES[game.theme]
          return (
            <GameCard key={game.id} game={game} theme={theme} index={i} />
          )
        })}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Made with 💜 for little ones everywhere &nbsp;·&nbsp; <Link to="/parents">Info for parents</Link></p>
      </footer>

    </div>
  )
}

function GameCard({ game, theme, index }) {
  const card = (
    <div
      className={`${styles.card} ${!game.available ? styles.cardLocked : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className={styles.cardTop} style={{ background: theme.bg }}>
        <span className={styles.cardEmoji}>{game.emoji}</span>
        <div className={styles.themePill} style={{ background: theme.color }}>
          {theme.emoji} {theme.label}
        </div>
        {!game.available && (
          <div className={styles.comingSoon}>Coming soon!</div>
        )}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{game.title}</h3>
        <p className={styles.cardDesc}>{game.description}</p>
        <div className={styles.cardMeta}>
          <div className={styles.skills}>
            {game.skills.map(s => (
              <span key={s} className={styles.skill}>{s}</span>
            ))}
          </div>
          <span className={styles.ages}>Ages {game.ages}</span>
        </div>
        {game.available && (
          <div className={styles.playBtn} style={{ background: theme.dark }}>
            Play now! →
          </div>
        )}
      </div>
    </div>
  )

  if (!game.available) return card
  return <Link to={game.path}>{card}</Link>
}
