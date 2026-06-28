import { Navigate } from 'react-router-dom'
import { getAuth } from '../auth'

const ProtectedRoute = ({ children }) => {
  if (!getAuth()) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default ProtectedRoute
