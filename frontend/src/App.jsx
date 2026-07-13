import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Otp from './pages/Otp'
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
          <ProtectedLayout>
            <CalendarPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/resources"
        element={
          <ProtectedLayout>
            <Resources />
          </ProtectedLayout>
        }
      />

      <Route
        path="/message"
        element={
          <ProtectedLayout>
            <Message />
          </ProtectedLayout>
        }
      />

      <Route
        path="/entry"
        element={
          <ProtectedLayout>
            <Entry />
          </ProtectedLayout>
        }
      />

      <Route path="/create-account" element={<CreateAccount />} />

    </Routes>
  )
}

export default App