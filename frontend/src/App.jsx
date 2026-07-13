import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Otp from './pages/Otp'
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedLayout from './components/ProtectedLayout'
import CalendarPage from './components/CalendarPage'
import Resources from './pages/Resources'
import Message from './pages/message'
import Entry from './pages/Entry'
import CreateAccount from "./pages/CreateAccount";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/otp" element={<Otp />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <CalendarPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Resources />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/message"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Message />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/entry"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Entry />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/create-account" element={<CreateAccount />} />
    </Routes>
  )
}

export default App
