import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Parents.module.css'

const SKILLS = [
  { emoji: '🖱️', title: 'Mouse & touch control', desc: 'Moving targets at varying speeds build the tracking and timing skills needed to use a mouse or touchscreen confidently.' },
  { emoji: '🔤', title: 'Letters & numbers', desc: 'From level 4 onwards, bubbles show letters A–J and numbers 1–10. Passive exposure while playing — no pressure, just familiarity.' },
  { emoji: '🎯', title: 'Concentration', desc: 'As games get faster, kids learn to focus and prioritise — which bubble to go for, how to plan their next tap.' },
  { emoji: '⚡', title: 'Reaction time', desc: 'The gentle difficulty curve trains faster reactions without ever feeling frustrating. Levels increase naturally as they improve.' },
  { emoji: '🧠', title: 'Cognitive development', desc: 'Games like Memory Flip and Simple Simon build working memory and pattern recognition.' },
  { emoji: '😄', title: 'Intrinsic motivation', desc: 'Kids repeat these games far more than formal exercises because they actually want to. The learning is a side effect of the fun.' },
]

const GAMES_LIST = [
  'Pop & Catch', 'Memory Flip', 'Simple Simon',
  'Colour Match', 'Counting Catch', 'Alphabet Tap',
  'Bubble Burst', 'Piano',
]

const LOVED   = ['So much fun!', 'Easy to understand', 'Good length', 'Looks great', 'Sounds good', 'Helped them learn']
const IMPROVE = ['Too hard', 'Too easy', 'Too fast', 'Too slow', 'Got bored quickly', 'Confusing']
const AGES    = ['3', '4', '5', '6', '7', '8+']

function FeedbackForm() {
  const [age,     setAge]     = useState('')
  const [games,   setGames]   = useState([])
  const [loved,   setLoved]   = useState([])
  const [improve, setImprove] = useState([])
  const [ideas,   setIdeas]   = useState('')
  const [status,  setStatus]  = useState('idle')

  function toggle(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('https://formspree.io/f/mojkzpvo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_age: age || 'Not specified',
          games_played: games.join(', ') || 'Not specified',
          loved: loved.join(', ') || 'Not specified',
          could_improve: improve.join(', ') || 'None selected',
          ideas: ideas || 'None',
        }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className={styles.formDone}>
        <span className={styles.formDoneEmoji}>🎉</span>
        <h3 className={styles.formDoneTitle}>Thanks so much!</h3>
        <p className={styles.formDoneBody}>Your feedback really helps us make better games for little ones.</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <div className={styles.formLabel}>How old is your child?</div>
        <div className={styles.chips}>
          {AGES.map(a => (
            <button key={a} type="button"
              className={`${styles.chip} ${age === a ? styles.chipActive : ''}`}
              onClick={() => setAge(a === age ? '' : a)}
            >{a}</button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.formLabel}>Which games did they play?</div>
        <div className={styles.chips}>
          {GAMES_LIST.map(g => (
            <button key={g} type="button"
              className={`${styles.chip} ${games.includes(g) ? styles.chipActive : ''}`}
              onClick={() => toggle(games, setGames, g)}
            >{g}</button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.formLabel}>What did they love? <span className={styles.formOptional}>pick any</span></div>
        <div className={styles.chips}>
          {LOVED.map(l => (
            <button key={l} type="button"
              className={`${styles.chip} ${styles.chipGreen} ${loved.includes(l) ? styles.chipActiveGreen : ''}`}
              onClick={() => toggle(loved, setLoved, l)}
            >{l}</button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.formLabel}>Anything that could be better? <span className={styles.formOptional}>pick any</span></div>
        <div className={styles.chips}>
          {IMPROVE.map(i => (
            <button key={i} type="button"
              className={`${styles.chip} ${styles.chipOrange} ${improve.includes(i) ? styles.chipActiveOrange : ''}`}
              onClick={() => toggle(improve, setImprove, i)}
            >{i}</button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.formLabel}>Any other ideas? <span className={styles.formOptional}>optional</span></div>
        <textarea
          className={styles.textarea}
          placeholder="More games, different themes, anything at all..."
          value={ideas}
          onChange={e => setIdeas(e.target.value)}
          rows={3}
        />
      </div>

      {status === 'error' && <p className={styles.formError}>Something went wrong — please try again.</p>}

      <button type="submit" className={styles.submitBtn} disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Send feedback 💌'}
      </button>
    </form>
  )
}

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
          <p className={styles.heroSub}>What this is, why we built it, and what your kids are actually learning.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What is Silly Geese?</h2>
          <p className={styles.body}>Silly Geese is a collection of free, simple games for children aged 3–8. Every game is designed to build a real skill — motor control, letter recognition, number sense, memory — wrapped inside something a kid actually wants to play.</p>
          <p className={styles.body}>There are no ads, no in-app purchases, no accounts required, no data collected. Just games.</p>
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
              <div className={styles.levelContent}><strong>Pure motor skills</strong> — large targets, slow speed. Just tap the thing. Builds confidence and basic screen control.</div>
            </div>
            <div className={styles.level}>
              <div className={styles.levelBadge} style={{ background: '#33aaff' }}>Levels 4–6</div>
              <div className={styles.levelContent}><strong>Letters & numbers appear</strong> — still tap anything, but now characters are visible on every bubble. Passive exposure without pressure.</div>
            </div>
            <div className={styles.level}>
              <div className={styles.levelBadge} style={{ background: '#44cc77' }}>Levels 7–9</div>
              <div className={styles.levelContent}><strong>Getting faster</strong> — smaller bubbles, quicker pace. Builds precision and reaction time.</div>
            </div>
            <div className={styles.level}>
              <div className={styles.levelBadge} style={{ background: '#ff9933' }}>Level 10+</div>
              <div className={styles.levelContent}><strong>Super star mode</strong> — fast and challenging. Only kids who've genuinely mastered the earlier levels will get here.</div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Screen time & guided access</h2>
          <p className={styles.body}>We'd recommend using <strong>Guided Access</strong> on iPhone and iPad (Settings → Accessibility → Guided Access) to lock your child to the game. Triple-click the side button to start a session, and they can't exit without your passcode.</p>
          <p className={styles.body}>The games work entirely offline once loaded — no internet connection needed during play.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Privacy</h2>
          <p className={styles.body}>
            Silly Geese does not require accounts, logins, or any personal information to play. There are no ads and no in-app purchases.
          </p>
          <p className={styles.body}>
            We use <strong>Vercel Analytics</strong> to collect basic, anonymous usage data — things like which pages are visited and which country visitors are from. No personal information is collected and nothing is tied to an individual user.
          </p>
          <p className={styles.body}>
            The <strong>feedback form</strong> on this page is entirely optional. If you submit it, your responses are sent to us via Formspree and stored securely. We don't ask for your name or email — only the answers you choose to give. We use this feedback solely to improve the games.
          </p>
          <p className={styles.body}>
            Your child's gameplay stays entirely on their device. We don't track scores, progress, or anything that happens inside the games themselves.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Share your feedback 💌</h2>
          <p className={styles.body}>Tell us what your kids loved, what didn't land, and what you'd like to see next. No email needed — just tap and go.</p>
          <FeedbackForm />
        </section>

        <div className={styles.cta}>
          <Link to="/" className={styles.ctaBtn}>← Back to the games</Link>
        </div>

      </main>
    </div>
  )
}
