import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const meditations = [
  {
    title: "Box Breathing",
    body: "Inhale for 4 counts → Hold for 4 → Exhale for 4 → Hold for 4. Repeat 4–6 times to calm your nervous system.",
  },
  {
    title: "5-4-3-2-1 Grounding",
    body: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Anchors you in the present moment.",
  },
  {
    title: "Body Scan",
    body: "Close your eyes. Slowly move your attention from your feet upward, releasing tension in each body part as you go.",
  },
]

function Modal({ type, onClose }) {
  const [affirmIdx, setAffirmIdx] = useState(
    () => Math.floor(Math.random() * affirmations.length)
  )
  const [tipIdx] = useState(
    () => Math.floor(Math.random() * meditations.length)
  )

  if (!type) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>
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
            <p className="modal-eyebrow">Meditation Tips</p>
            <h2 className="modal-title">{meditations[tipIdx].title}</h2>
            <p className="modal-body">{meditations[tipIdx].body}</p>
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

        <button className="modal-close-btn" onClick={onClose}>Done</button>
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
    label: 'Meditation Tips',
    desc: 'Breathing and grounding techniques.',
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
  const navigate = useNavigate()

  return (
    <div className="resources-page">

      {/* ── Nav ── */}
      <nav className="resources-nav">
        <div className="resources-nav-inner">
          <span className="nav-menu">Menu</span>
          <span className="nav-logo">lifesafe</span>
          <div className="nav-links">
            <button type="button" className="nav-link" onClick={() => navigate('/')}>Calendar</button>
            <a href="#" className="nav-link">Community</a>
            <button type="button" className="nav-link" onClick={() => navigate('/message')}>Message</button>
            <a href="#" className="nav-link active">Resources</a>
            <button className="nav-btn" onClick={() => navigate('/')}>New entry</button>
          </div>
        </div>
      </nav>

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

      {/* ── Footer ── */}
      <footer className="resources-footer">
        <span className="footer-logo">lifesafe</span>
        <p className="footer-note">
          In crisis? Call or text <strong>988</strong> — available 24/7.
        </p>
      </footer>

      {modal && <Modal type={modal} onClose={() => setModal(null)} />}
    </div>
  )
}