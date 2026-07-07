import './Entry.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth } from '../auth'

const moods = [
  { id: 'veryHappy', icon: 'sentiment_very_satisfied', label: 'Very Happy' },
  { id: 'happy', icon: 'sentiment_satisfied', label: 'Happy' },
  { id: 'neutral', icon: 'sentiment_neutral', label: 'Neutral' },
  { id: 'sad', icon: 'sentiment_dissatisfied', label: 'Sad' },
  { id: 'verySad', icon: 'sentiment_very_dissatisfied', label: 'Very Sad' },
]

const moodPrompts = {
  veryHappy: [
    "What made today so great?",
    "Who or what played a part in that feeling?",
    "How can you hold onto this feeling tomorrow?",
  ],
  happy: [
    "What made you happy today?",
    "What's one moment from today you'd want to remember?",
    "Is there anything you want to do more of?",
  ],
  neutral: [
    "How would you describe today overall?",
    "Was there any moment that stood out, good or bad?",
    "Is there anything you're looking forward to?",
  ],
  sad: [
    "What made you feel sad today?",
    "Is there anything that helped, even a little?",
    "What's one small thing you could do for yourself right now?",
  ],
  verySad: [
    "What's weighing on you today?",
    "Have you been able to talk to anyone about it?",
    "What's one thing, however small, that might help right now?",
  ],
}

const Entry = () => {
  const navigate = useNavigate()
  const [selectedMood, setSelectedMood] = useState(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(['', '', ''])
  const [entries, setEntries] = useState([])
  const [savedConfirmation, setSavedConfirmation] = useState('')

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const handleMoodSelect = (moodId) => {
    setSelectedMood(moodId)
    setStep(0)
    setAnswers(['', '', ''])
    setSavedConfirmation('')
  }

  const handleAnswerChange = (text) => {
    const updated = [...answers]
    updated[step] = text
    setAnswers(updated)
  }

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleSaveEntry = () => {
    const moodInfo = moods.find((m) => m.id === selectedMood)
    const prompts = moodPrompts[selectedMood]
    const combinedText = prompts
      .map((prompt, i) => `${prompt}\n${answers[i].trim() || '(no answer)'}`)
      .join('\n\n')

    const newEntry = {
      mood: moodInfo,
      date: new Date(),
      text: combinedText,
    }

    setEntries([newEntry, ...entries])
    setSavedConfirmation('Entry saved!')
    setSelectedMood(null)
    setStep(0)
    setAnswers(['', '', ''])
  }

  const currentPrompts = selectedMood ? moodPrompts[selectedMood] : null

  return (
    <div className="entry-page">

      {/* ── Nav ── */}
      <nav className="entry-nav">
        <div className="entry-nav-inner">
          <span className="nav-menu">Menu</span>
          <span className="nav-logo">lifesafe</span>
          <div className="nav-links">
            <button type="button" className="nav-link" onClick={() => navigate('/')}>Calendar</button>
            <button type="button" className="nav-link" onClick={() => navigate('/resources')}>Resources</button>
            <button type="button" className="nav-link" onClick={() => navigate('/message')}>Message</button>
            <button type="button" className="nav-link active">Entry</button>
            <button className="nav-btn nav-btn-secondary" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="entry-content">
        <h1 className="heading">Journal Entry</h1>

        {savedConfirmation && (
          <div className="save-confirmation">{savedConfirmation}</div>
        )}

        {!selectedMood && (
          <>
            <p className="entry-subtitle">How are you feeling today?</p>
            <div className="mood-picker">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  className="mood-option"
                  onClick={() => handleMoodSelect(mood.id)}
                >
                  <i className="material-symbols-rounded">{mood.icon}</i>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedMood && (
          <div className="entry-slide">
            <div className="slide-progress">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`progress-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                />
              ))}
            </div>

            <h2 className="slide-question">{currentPrompts[step]}</h2>

            <textarea
              className="slide-textarea"
              placeholder="Type your answer here..."
              value={answers[step]}
              maxLength={300}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />

            <div className="slide-footer">
              <span className="supporting-text">{answers[step].length}/300</span>

              <div className="slide-buttons">
                {step > 0 && (
                  <button className="secondary-btn" onClick={handleBack}>
                    Back
                  </button>
                )}
                {step < 2 && (
                  <button className="send-button" onClick={handleNext}>
                    Next
                    <i className="material-symbols-rounded">arrow_forward</i>
                  </button>
                )}
                {step === 2 && (
                  <button className="send-button" onClick={handleSaveEntry}>
                    Save Entry
                    <i className="material-symbols-rounded">check</i>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {entries.length > 0 && (
          <div className="entry-history">
            <h2 className="section-label">Past Entries</h2>
            {entries.map((entry, idx) => (
              <div className="history-card" key={idx}>
                <div className="history-card-header">
                  <i className="material-symbols-rounded">{entry.mood.icon}</i>
                  <span className="history-mood-label">{entry.mood.label}</span>
                  <span className="history-date">
                    {entry.date.toLocaleDateString()}
                  </span>
                </div>
                <p className="history-text">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Entry