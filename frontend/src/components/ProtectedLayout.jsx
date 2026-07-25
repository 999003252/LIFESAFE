import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'
import { getAuth } from '../auth'
import { fetchTodayCheckIn } from '../api/entries'
import { ensureProfile } from '../api/friends'
import './ProtectedLayout.css'

const activeItems = {
  '/': 'Calendar',
  '/entry': 'Journal',
  '/message': 'Message',
  '/friends': 'Message',
  '/resources': 'Resources',
}

const checkInRequests = new Map()
const promptedCheckIns = new Set()

const localDateKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-')

const ProtectedLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false)
  const activeItem = activeItems[location.pathname] || 'Calendar'

  useEffect(() => {
    const email = getAuth()
    if (!email) return

    ensureProfile(email).catch(() => {})

    const promptKey = `${email}:${localDateKey(new Date())}`
    let request = checkInRequests.get(promptKey)
    if (!request) {
      request = fetchTodayCheckIn(email)
      checkInRequests.set(promptKey, request)
    }

    let active = true
    request
      .then(({ completed }) => {
        if (active && !completed && !promptedCheckIns.has(promptKey)) {
          promptedCheckIns.add(promptKey)
          setShowCheckInPrompt(true)
        }
      })
      .catch(() => checkInRequests.delete(promptKey))

    return () => {
      active = false
    }
  }, [])

  return (
    <ProtectedRoute>
      <div className="protected-layout">
        <Sidebar activeItem={activeItem} />
        <main className="protected-content">{children}</main>
        {showCheckInPrompt && (
          <div className="check-in-overlay" role="presentation">
            <div
              className="check-in-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="check-in-title"
            >
              <i className="material-symbols-rounded check-in-icon">edit_note</i>
              <h2 id="check-in-title">Ready for today’s check-in?</h2>
              <p>You haven’t completed today’s journal entry yet.</p>
              <div className="check-in-actions">
                <button
                  type="button"
                  className="check-in-later"
                  onClick={() => setShowCheckInPrompt(false)}
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  className="check-in-start"
                  onClick={() => {
                    setShowCheckInPrompt(false)
                    navigate('/entry')
                  }}
                >
                  Start check-in
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

export default ProtectedLayout
