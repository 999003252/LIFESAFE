import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Otp from './pages/Otp'
import ProtectedRoute from './components/ProtectedRoute'
import CalendarPage from './components/CalendarPage'
import Resources from './pages/Resources'
import Message from './pages/Message'

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/otp" element={<Otp />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <Resources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/message"
        element={
          <ProtectedRoute>
            <Message />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App