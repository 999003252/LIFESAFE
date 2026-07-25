import { useLocation, useNavigate } from 'react-router-dom'
import './LegalPage.css'

const LegalPage = ({ title, children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const returnPath = typeof location.state?.from === 'string' ? location.state.from : '/login'

  return (
    <div className="legal-page">
      <main className="legal-card">
        <button type="button" className="legal-back-button" onClick={() => navigate(returnPath)}>
          <span aria-hidden="true">←</span>
          Back
        </button>
        <h1>lifesafe</h1>
        <h2>{title}</h2>
        <div className="legal-content">{children}</div>
      </main>
    </div>
  )
}

export default LegalPage
