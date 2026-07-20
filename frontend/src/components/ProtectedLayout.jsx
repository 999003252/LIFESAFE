import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'
import './ProtectedLayout.css'

const activeItems = {
  '/': 'Calendar',
  '/entry': 'Journal',
  '/message': 'Message',
  '/resources': 'Resources',
}

const ProtectedLayout = ({ children }) => {
  const location = useLocation()
  const activeItem = activeItems[location.pathname] || 'Calendar'

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
