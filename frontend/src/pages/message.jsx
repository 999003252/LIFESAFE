import '../pages/Message.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth } from '../auth'

const quickMessages = [
  "Thinking of you today.",
  "Just checking in.",
  "I'm here if you need me.",
]

const Message = () => {
  const navigate = useNavigate()
  const [recipient, setRecipient] = useState('')
  const [customText, setCustomText] = useState('')
  const [sentConfirmation, setSentConfirmation] = useState('')

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const handleSend = (text) => {
    if (!recipient.trim()) {
      setSentConfirmation('Please enter a recipient first.')
      return
    }
    setSentConfirmation(`Sent to ${recipient}: "${text}"`)
    setCustomText('')
  }

  return (
    <div className="message-page">

      {/* ── Nav ── */}
      <nav className="message-nav">
        <div className="message-nav-inner">
          <span className="nav-menu">Menu</span>
          <span className="nav-logo">lifesafe</span>
          <div className="nav-links">
            <button type="button" className="nav-link" onClick={() => navigate('/')}>Calendar</button>
            <button type="button" className="nav-link" onClick={() => navigate('/resources')}>Resources</button>
            <button type="button" className="nav-link active">Message</button>
            <button className="nav-btn" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="message-content">
        <div className="message-main">
          <h1 className="heading">Message</h1>

          <div className="recipient-row">
            <span>Send a message to</span>
            <input
              type="text"
              placeholder="___________"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          {sentConfirmation && (
            <div className="send-confirmation">{sentConfirmation}</div>
          )}

          <div className="quick-messages">
            <h2 className="section-label">Quick Messages</h2>
            {quickMessages.map((msg) => (
              <div className="quick-message-row" key={msg}>
                <span>{msg}</span>
                <button className="send-button" onClick={() => handleSend(msg)}>
                  <i className="material-symbols-rounded">play_arrow</i>
                  Send Message
                </button>
              </div>
            ))}
          </div>

          <div className="custom-message">
            <h2 className="section-label">Or Write Your Own</h2>
            <div className="custom-message-box">
              <textarea
                placeholder="Type your message here..."
                value={customText}
                maxLength={300}
                onChange={(e) => setCustomText(e.target.value)}
              />
              <div className="custom-message-footer">
                <span className="supporting-text">{customText.length}/300</span>
                <button
                  className="send-button"
                  disabled={!customText.trim()}
                  onClick={() => handleSend(customText)}
                >
                  <i className="material-symbols-rounded">play_arrow</i>
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="message-stats">
          <div className="stat-card">
            <h2>🔥</h2>
            <h3>7 Days</h3>
            <p>Tracked Consecutively</p>
          </div>
          <div className="stat-card">
            <h2>📅</h2>
            <h3>3 Weeks</h3>
            <p>Total Tracking</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Message