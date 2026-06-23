import React, { useState } from 'react';

const affirmations = [
  "You are stronger than you know, and braver than you feel.",
  "Every step forward, no matter how small, is progress.",
  "You deserve peace. You deserve rest. You are enough.",
  "Difficult roads often lead to beautiful destinations.",
  "Your feelings are valid. Your journey matters.",
  "Today, I choose to be kind to myself.",
  "Growth happens in the moments you almost give up.",
];

const meditations = [
  {
    title: "Box Breathing",
    body: "Inhale for 4 counts → Hold for 4 → Exhale for 4 → Hold for 4. Repeat 4–6 times to calm your nervous system and reduce anxiety.",
  },
  {
    title: "5-4-3-2-1 Grounding",
    body: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Brings you back to the present moment.",
  },
  {
    title: "Body Scan",
    body: "Close your eyes. Slowly move your attention from your feet upward, releasing tension in each body part as you go.",
  },
];

function Modal({ type, onClose }) {
  const [affirmIdx, setAffirmIdx] = useState(
    () => Math.floor(Math.random() * affirmations.length)
  );
  const [tipIdx] = useState(
    () => Math.floor(Math.random() * meditations.length)
  );

  if (!type) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'affirmation' && (
          <>
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
              Daily Affirmation
            </p>
            <p className="text-2xl font-black text-neutral-900 leading-snug tracking-tight mb-6">
              {affirmations[affirmIdx]}
            </p>
            <button
              onClick={() => setAffirmIdx((i) => (i + 1) % affirmations.length)}
              className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition mb-6 block"
            >
              ↻ New affirmation
            </button>
          </>
        )}

        {type === 'help' && (
          <>
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
              Get Help Now
            </p>
            <p className="text-xl font-black text-neutral-900 leading-snug tracking-tight mb-2">
              You're not alone.
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              Reach out to a trained counselor — free, confidential, 24/7.
            </p>
            <a
              href="tel:988"
              className="flex items-center gap-3 bg-red-50 text-red-600 rounded-2xl p-4 mb-3 font-semibold text-sm hover:bg-red-100 transition"
            >
              <span className="text-xl">📞</span>
              <div>
                <div className="font-bold">988 Suicide &amp; Crisis Lifeline</div>
                <div className="font-normal text-red-400 text-xs">Call or text 988 — available 24/7</div>
              </div>
            </a>
            <a
              href="sms:741741"
              className="flex items-center gap-3 bg-green-50 text-green-700 rounded-2xl p-4 font-semibold text-sm hover:bg-green-100 transition"
            >
              <span className="text-xl">💬</span>
              <div>
                <div className="font-bold">Crisis Text Line</div>
                <div className="font-normal text-green-500 text-xs">Text HOME to 741741</div>
              </div>
            </a>
          </>
        )}

        {type === 'meditation' && (
          <>
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
              Meditation Tips
            </p>
            <p className="text-2xl font-black text-neutral-900 tracking-tight mb-3">
              {meditations[tipIdx].title}
            </p>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">
              {meditations[tipIdx].body}
            </p>
          </>
        )}

        {type === 'add' && (
          <>
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
              Coming Soon
            </p>
            <p className="text-2xl font-black text-neutral-900 tracking-tight mb-3">
              Custom Resources
            </p>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">
              You'll soon be able to add your own links, contacts, and notes as personal resource cards.
            </p>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full bg-neutral-900 text-white rounded-2xl py-4 text-sm font-bold tracking-wide hover:bg-neutral-700 transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}

const cards = [
  {
    id: 'affirmation',
    label: 'Daily Affirmation',
    desc: 'Start your day with intention.',
    emoji: '✦',
  },
  {
    id: 'help',
    label: 'Get Help Now',
    desc: 'Connect with a crisis counselor.',
    emoji: '♡',
    accent: true,
  },
  {
    id: 'meditation',
    label: 'Meditation Tips',
    desc: 'Breathing and grounding techniques.',
    emoji: '◎',
  },
  {
    id: 'add',
    label: 'Add Custom Tab',
    desc: 'Pin your own resources here.',
    emoji: '+',
    dashed: true,
  },
];

export default function Resources() {
  const [modal, setModal] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Top nav ── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

          <span className="text-sm font-semibold text-neutral-900">Menu</span>

          <span className="text-sm font-bold tracking-wide text-neutral-900">lifesafe</span>
          <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#" className="hover:text-neutral-900 transition">Home</a>
            <a href="#" className="hover:text-neutral-900 transition">Community</a>
            <a href="#" className="hover:text-neutral-900 transition">Journal</a>
            <a href="#" className="text-neutral-900 border-b-2 border-neutral-900 pb-0.5">Resources</a>
          </div>
          <button className="bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-neutral-700 transition">
            New entry
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
          Resources
        </p>
        <h1 className="text-6xl sm:text-7xl font-black text-neutral-900 tracking-tight leading-none mb-4">
          Need some<br />extra help?
        </h1>
        <p className="text-base text-neutral-500 max-w-sm leading-relaxed">
          Everything you need to get through the day — affirmations, crisis lines, and mindfulness techniques — in one place.
        </p>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-neutral-100" />
      </div>

      {/* ── Cards ── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => setModal(card.id)}
              className={`
                group text-left rounded-3xl p-6 h-52 flex flex-col justify-between
                transition duration-200 cursor-pointer
                ${card.dashed
                  ? 'border-2 border-dashed border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100'
                  : card.accent
                  ? 'bg-neutral-900 hover:bg-neutral-700'
                  : 'bg-neutral-100 hover:bg-neutral-200'
                }
              `}
            >
              <span
                className={`text-2xl font-light ${
                  card.accent ? 'text-white/60' : card.dashed ? 'text-neutral-300' : 'text-neutral-400'
                }`}
              >
                {card.emoji}
              </span>
              <div>
                <p
                  className={`text-base font-bold leading-tight mb-1 ${
                    card.accent ? 'text-white' : card.dashed ? 'text-neutral-400' : 'text-neutral-900'
                  }`}
                >
                  {card.label}
                </p>
                <p
                  className={`text-xs font-medium leading-snug ${
                    card.accent ? 'text-white/50' : 'text-neutral-400'
                  }`}
                >
                  {card.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-5xl mx-auto px-6 pb-12 pt-4">
        <div className="h-px bg-neutral-100 mb-8" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <span className="text-sm font-bold text-neutral-900">lifesafe</span>
          <p className="text-xs text-neutral-400">
            If you're in crisis, call or text <strong className="text-neutral-700">988</strong> — available 24/7.
          </p>
        </div>
      </footer>

      {/* ── Modal ── */}
      <Modal type={modal} onClose={() => setModal(null)} />
    </div>
  );
}