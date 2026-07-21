import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'
import { getAuth } from '../auth'
import { ensureProfile } from '../api/friends'
import './ProtectedLayout.css'

const activeItems = {
  '/': 'Calendar',
  '/entry': 'Journal',
  '/message': 'Message',
  '/friends': 'Message',
  '/resources': 'Resources',
}

const ProtectedLayout = ({ children }) => {
  const location = useLocation()
  const activeItem = activeItems[location.pathname] || 'Calendar'

  useEffect(() => {
    const email = getAuth()
    if (email) ensureProfile(email).catch(() => {})
  }, [])

  return (
    <ProtectedRoute>
      <div className="protected-layout">
        <Sidebar activeItem={activeItem} />
        <main className="protected-content">{children}</main>
      </div>
    </ProtectedRoute>
  )
}

export default ProtectedLayout
