import './Entry.css'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getAuth } from '../auth'
import { createEntry, fetchEntries, updateEntry } from '../api/entries'

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

const toDisplayEntry = (item) => {
  const prompts = moodPrompts[item.mood] || []
  const text = prompts
    .map((prompt, i) => `${prompt}\n${(item.answers[i] || '').trim() || '(no answer)'}`)
    .join('\n\n')

  return {
    entryId: item.entryId,
    timestamp: item.timestamp,
    mood: { id: item.mood, icon: item.moodIcon, label: item.moodLabel },
    answers: item.answers,
    date: new Date(item.timestamp),
    text,
  }
}

const isToday = (date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate()
    && date.getMonth() === today.getMonth()
    && date.getFullYear() === today.getFullYear()
  )
}

const Entry = () => {
  const location = useLocation()
  const initialMood = moods.some((mood) => mood.id === location.state?.mood)
    ? location.state.mood
    : null
  const [selectedMood, setSelectedMood] = useState(initialMood)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(['', '', ''])
  const [entries, setEntries] = useState([])
  const [editingEntry, setEditingEntry] = useState(null)
  const [savedConfirmation, setSavedConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const userId = getAuth()
    fetchEntries(userId)
      .then((items) => {
        const displayEntries = items.map(toDisplayEntry)
        setEntries(displayEntries)
        if (initialMood && displayEntries.some((entry) => isToday(entry.date))) {
          setSelectedMood(null)
        }
      })
      .catch(() => setErrorMessage('Could not load past entries.'))
  }, [initialMood])

  const todayEntry = entries.find((entry) => isToday(entry.date))

  const handleMoodSelect = (moodId) => {
    setEditingEntry(null)
    setSelectedMood(moodId)
    setStep(0)
    setAnswers(['', '', ''])
    setSavedConfirmation('')
    setErrorMessage('')
  }

  const handleEditToday = () => {
    setEditingEntry(todayEntry)
    setSelectedMood(todayEntry.mood.id)
    setStep(0)
    setAnswers([0, 1, 2].map((index) => todayEntry.answers[index] || ''))
    setSavedConfirmation('')
    setErrorMessage('')
  }

  const handleCancelEdit = () => {
    setEditingEntry(null)
    setSelectedMood(null)
    setStep(0)
    setAnswers(['', '', ''])
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

  const handleSaveEntry = async () => {
    const moodInfo = moods.find((m) => m.id === selectedMood)

    const payload = {
      userId: getAuth(),
      mood: selectedMood,
      moodLabel: moodInfo.label,
      moodIcon: moodInfo.icon,
      answers,
    }

    try {
      const saved = editingEntry
        ? await updateEntry(editingEntry.entryId, editingEntry.timestamp, payload)
        : await createEntry(payload)
      const displayEntry = toDisplayEntry(saved)
      setEntries((currentEntries) => (
        editingEntry
          ? currentEntries.map((entry) => (
              entry.entryId === displayEntry.entryId ? displayEntry : entry
            ))
          : [displayEntry, ...currentEntries]
      ))
      setSavedConfirmation(editingEntry ? 'Entry updated!' : 'Entry saved!')
      setErrorMessage('')
    } catch {
      setErrorMessage(
        editingEntry
          ? 'Could not update entry. Please try again.'
          : 'Could not save entry. Please try again.',
      )
      return
    }

    setEditingEntry(null)
    setSelectedMood(null)
    setStep(0)
    setAnswers(['', '', ''])
  }

  const currentPrompts = selectedMood ? moodPrompts[selectedMood] : null

  return (
    <div className="entry-page">
      <div className="entry-content">
        <h1 className="heading">Journal Entry</h1>

        {savedConfirmation && (
          <div className="save-confirmation">{savedConfirmation}</div>
        )}

        {errorMessage && (
          <div className="save-confirmation error">{errorMessage}</div>
        )}

        {!selectedMood && todayEntry && (
          <div className="today-entry-complete">
            <i className="material-symbols-rounded">check_circle</i>
            <div>
              <h2>Today’s check-in is complete</h2>
              <p>You can update your answers if anything has changed.</p>
            </div>
            <button type="button" onClick={handleEditToday}>
              <i className="material-symbols-rounded">edit</i>
              Edit entry
            </button>
          </div>
        )}

        {!selectedMood && !todayEntry && (
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
                {editingEntry && (
                  <button className="secondary-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
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
                    {editingEntry ? 'Update Entry' : 'Save Entry'}
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
              <div className="history-card" key={entry.entryId || idx}>
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
