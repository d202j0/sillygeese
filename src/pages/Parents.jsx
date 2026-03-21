import { Link } from 'react-router-dom'
import styles from './Parents.module.css'

const SKILLS = [
  { emoji: '🖱️', title: 'Mouse & touch control', desc: 'Moving targets at varying speeds build the tracking and timing skills needed to use a mouse or touchscreen confidently.' },
  { emoji: '🔤', title: 'Letters & numbers', desc: 'From level 4 onwards, bubbles show letters A–J and numbers 1–10. Passive exposure while playing — no pressure, just familiarity.' },
  { emoji: '🎯', title: 'Concentration', desc: 'As games get faster, kids learn to focus and prioritise — which bubble to go for, how to plan their next tap.' },
  { emoji: '⚡', title: 'Reaction time', desc: 'The gentle difficulty curve trains faster reactions without ever feeling frustrating. Levels increase naturally as they improve.' },
  { emoji: '🧠', title: 'Cognitive development', desc: 'Games like Memory Flip and Simple Simon (coming soon) build working memory and pattern recognition.' },
  { emoji: '😄', title: 'Intrinsic motivation', desc: 'Kids repeat these games far more than formal exercises because they actually want to. The learning is a side effect of the fun.' },
]

export default function Parents() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Back to games</Link>
        <span className={styles.logo}>🪿 Silly Geese</span>
      </header>

      <main className={styles.main}>

        <section className={styles.hero}>
          <span className={styles.heroEmoji}>👋</span>
          <h1 className={styles.heroTitle}>Info for parents</h1>
          <p className={styles.heroSub}>
            What this is, why we built it, and what your kids are actually learning.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What is Silly Geese?</h2>
          <p className={styles.body}>
            Silly Geese is a collection of free, simple games for children aged 3–8. Every game is designed to build a real skill — motor control, letter recognition, number sense, memory — wrapped inside something a kid actually wants to play.
          </p>
          <p className={styles.body}>
            There are no ads, no in-app purchases, no accounts required, no data collected. Just games.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What are they learning?</h2>
          <div className={styles.skillsGrid}>
            {SKILLS.map(s => (
              <div key={s.title} className={styles.skillCard}>
                <span className={styles.skillEmoji}>{s.emoji}</span>
                <h3 className={styles.skillTitle}>{s.title}</h3>
                <p className={styles.skillDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How the games are structured</h2>
          <div className={styles.levels}>
            <div className={styles.level}>
              <div className={styles.levelBadge} style={{ background: '#c77dff' }}>Levels 1–3</div>
              <div className={styles.levelContent}>
                <strong>Pure motor skills</strong> — large targets, slow speed. Just tap the thing. Builds confidence and basic screen control.
              </div>
            </div>
            <div className={styles.level}>
              <div className={styles.levelBadge} style={{ background: '#33aaff' }}>Levels 4–6</div>
              <div className={styles.levelContent}>
                <strong>Letters & numbers appear</strong> — still tap anything, but now characters are visible on every bubble. Passive exposure without pressure.
              </div>
            </div>
            <div className={styles.level}>
              <div className={styles.levelBadge} style={{ background: '#44cc77' }}>Levels 7–9</div>
              <div className={styles.levelContent}>
                <strong>Getting faster</strong> — smaller bubbles, quicker pace. Builds precision and reaction time.
              </div>
            </div>
            <div className={styles.level}>
              <div className={styles.levelBadge} style={{ background: '#ff9933' }}>Level 10+</div>
              <div className={styles.levelContent}>
                <strong>Super star mode</strong> — fast and challenging. Only kids who've genuinely mastered the earlier levels will get here.
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Screen time & guided access</h2>
          <p className={styles.body}>
            We'd recommend using <strong>Guided Access</strong> on iPhone and iPad (Settings → Accessibility → Guided Access) to lock your child to the game. Triple-click the side button to start a session, and they can't exit without your passcode.
          </p>
          <p className={styles.body}>
            The games work entirely offline once loaded — no internet connection needed during play.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Privacy</h2>
          <p className={styles.body}>
            Silly Geese collects zero data. No analytics, no cookies, no accounts, nothing. Your child's play stays entirely on their device. We built this for our own kids and decided to share it — there's no business model here.
          </p>
        </section>

        <div className={styles.cta}>
          <Link to="/" className={styles.ctaBtn}>← Back to the games</Link>
        </div>

      </main>
    </div>
  )
}
