import { useEffect, useState } from 'react'
import './Resources.css'

const affirmations = [
  "You are stronger than you know, and braver than you feel.",
  "Every step forward, no matter how small, is progress.",
  "You deserve peace. You deserve rest. You are enough.",
  "Difficult roads often lead to beautiful destinations.",
  "Your feelings are valid. Your journey matters.",
  "Today, I choose to be kind to myself.",
  "Growth happens in the moments you almost give up.",
]

const breathingPhases = [
  { id: 'inhale', label: 'Breathe in', instruction: 'Slowly through your nose', duration: 4 },
  { id: 'hold-in', label: 'Hold', instruction: 'Let your body become still', duration: 4 },
  { id: 'exhale', label: 'Breathe out', instruction: 'Gently through your mouth', duration: 4 },
  { id: 'hold-out', label: 'Hold', instruction: 'Rest before the next breath', duration: 4 },
]

const totalBreathingCycles = 4

function Modal({ type, onClose }) {
  const [affirmIdx, setAffirmIdx] = useState(
    () => Math.floor(Math.random() * affirmations.length)
  )
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(breathingPhases[0].duration)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const phase = breathingPhases[phaseIndex]
  const isComplete = completedCycles >= totalBreathingCycles

  useEffect(() => {
    if (type !== 'meditation' || !isRunning) return undefined

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1

        const nextPhaseIndex = (phaseIndex + 1) % breathingPhases.length
        if (nextPhaseIndex === 0) {
          const nextCompletedCycles = completedCycles + 1
          setCompletedCycles(nextCompletedCycles)
          if (nextCompletedCycles >= totalBreathingCycles) {
            setIsRunning(false)
            return 0
          }
        }

        setPhaseIndex(nextPhaseIndex)
        return breathingPhases[nextPhaseIndex].duration
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [completedCycles, isRunning, phaseIndex, type])

  const resetBreathing = (startImmediately = false) => {
    setPhaseIndex(0)
    setSecondsLeft(breathingPhases[0].duration)
    setCompletedCycles(0)
    setHasStarted(startImmediately)
    setIsRunning(startImmediately)
  }

  if (!type) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-sheet ${type === 'meditation' ? 'meditation-sheet' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-x" onClick={onClose} aria-label="Close resource">
          <i className="material-symbols-rounded">close</i>
        </button>

        {type === 'affirmation' && (
          <>
            <p className="modal-eyebrow">Daily Affirmation</p>
            <h2 className="modal-title">Today's Words</h2>
            <p className="affirmation-text">{affirmations[affirmIdx]}</p>
            <button
              className="refresh-btn"
              onClick={() => setAffirmIdx((i) => (i + 1) % affirmations.length)}
            >
              ↻ New affirmation
            </button>
          </>
        )}

        {type === 'help' && (
          <>
            <p className="modal-eyebrow">Get Help Now</p>
            <h2 className="modal-title">You're Not Alone</h2>
            <p className="modal-body">
              Reach out to a trained counselor — free, confidential, 24/7.
            </p>
            <a className="hotline-link" href="tel:988">
              <span className="hotline-link-icon">📞</span>
              <div>
                <div className="hotline-link-title">988 Suicide &amp; Crisis Lifeline</div>
                <div className="hotline-link-sub">Call or text 988 — available 24/7</div>
              </div>
            </a>
            <a className="hotline-link" href="sms:741741">
              <span className="hotline-link-icon">💬</span>
              <div>
                <div className="hotline-link-title">Crisis Text Line</div>
                <div className="hotline-link-sub">Text HOME to 741741</div>
              </div>
            </a>
          </>
        )}

        {type === 'meditation' && (
          <>
            <p className="modal-eyebrow">Guided Meditation</p>
            <h2 className="modal-title">One-Minute Reset</h2>
            <p className="meditation-intro">
              Follow the circle through four slow rounds of box breathing.
            </p>

            {isComplete ? (
              <div className="meditation-complete" role="status" aria-live="polite">
                <i className="material-symbols-rounded">spa</i>
                <h3>You did it</h3>
                <p>Notice how your body feels, then return to your day when you’re ready.</p>
                <button type="button" className="breathing-primary" onClick={() => resetBreathing(true)}>
                  Breathe again
                </button>
              </div>
            ) : (
              <div className="breathing-guide">
                <div
                  className={`breathing-orb ${hasStarted ? phase.id : 'idle'} ${isRunning ? '' : 'paused'}`}
                  style={{ '--breath-duration': `${phase.duration}s` }}
                  role="status"
                  aria-live="polite"
                  aria-label={hasStarted ? `${phase.label}, ${secondsLeft} seconds` : 'Breathing exercise ready'}
                >
                  <div className="breathing-orb-ring" />
                  <div className="breathing-orb-core">
                    <span>{hasStarted ? secondsLeft : <i className="material-symbols-rounded">air</i>}</span>
                  </div>
                </div>

                <div className="breathing-copy">
                  <h3>{hasStarted ? phase.label : 'Find a comfortable position'}</h3>
                  <p>{hasStarted ? phase.instruction : 'Relax your shoulders and place both feet on the floor.'}</p>
                </div>

                <div className="breathing-progress" aria-label={`${completedCycles} of ${totalBreathingCycles} breathing cycles complete`}>
                  {Array.from({ length: totalBreathingCycles }, (_, index) => (
                    <span key={index} className={index < completedCycles ? 'complete' : index === completedCycles && hasStarted ? 'active' : ''} />
                  ))}
                </div>

                <div className="breathing-controls">
                  {!hasStarted ? (
                    <button type="button" className="breathing-primary" onClick={() => resetBreathing(true)}>
                      Begin breathing
                    </button>
                  ) : (
                    <>
                      <button type="button" className="breathing-primary" onClick={() => setIsRunning((running) => !running)}>
                        <i className="material-symbols-rounded">{isRunning ? 'pause' : 'play_arrow'}</i>
                        {isRunning ? 'Pause' : 'Resume'}
                      </button>
                      <button type="button" className="breathing-secondary" onClick={() => resetBreathing(false)}>
                        Restart
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <p className="meditation-note">
              Breathe normally or stop if you feel lightheaded or uncomfortable.
            </p>
          </>
        )}

        {type === 'add' && (
          <>
            <p className="modal-eyebrow">Coming Soon</p>
            <h2 className="modal-title">Custom Resources</h2>
            <p className="modal-body">
              You'll be able to pin your own links, contacts, and notes as personal resource cards.
            </p>
          </>
        )}

        <button type="button" className="modal-close-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}

const cards = [
  {
    id: 'affirmation',
    label: 'Daily Affirmation',
    desc: 'Start your day with intention.',
    icon: 'auto_awesome',
  },
  {
    id: 'help',
    label: 'Get Help Now',
    desc: 'Connect with a crisis counselor.',
    icon: 'favorite',
    accent: true,
  },
  {
    id: 'meditation',
    label: 'Guided Meditation',
    desc: 'Follow a one-minute breathing reset.',
    icon: 'self_improvement',
  },
  {
    id: 'add',
    label: 'Add Custom',
    desc: 'Pin your own resources.',
    icon: 'add',
    dashed: true,
  },
]

export default function Resources() {
  const [modal, setModal] = useState(null)

  return (
    <div className="resources-page">
      {/* ── Hero ── */}
      <section className="resources-hero">
        <p className="resources-eyebrow">Resources</p>
        <h1 className="resources-heading">Need some<br />extra help?</h1>
        <p className="resources-sub">
          Everything you need to get through the day — affirmations, crisis lines, and mindfulness techniques — in one place.
        </p>
      </section>

      {/* ── Divider ── */}
      <div className="resources-divider"><hr /></div>

      {/* ── Cards ── */}
      <div className="resources-cards">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`resource-card${card.accent ? ' accent' : ''}${card.dashed ? ' dashed' : ''}`}
            onClick={() => setModal(card.id)}
          >
            <i className="material-symbols-rounded card-icon">{card.icon}</i>
            <div className="card-bottom">
              <span className="card-label">{card.label}</span>
              <span className="card-desc">{card.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {modal && <Modal type={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
