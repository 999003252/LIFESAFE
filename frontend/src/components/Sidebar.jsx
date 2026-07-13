import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from '../auth'
import './Sidebar.css'

export default function Sidebar({ activeItem = 'Calendar' }) {
  const [collapsed, setCollapsed] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountRef = useRef(null)
  const navigate = useNavigate()
  const email = getAuth()
  const displayName = email.split('@')[0] || 'User'

  const menuItems = [
    { name: 'Calendar', icon: 'calendar_month', path: '/' },
    { name: 'Journal', icon: 'edit_note', path: '/entry' },
    { name: 'Message', icon: 'chat', path: '/friends' },
    { name: 'Resources', icon: 'menu_book', path: '/resources' },
  ]

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      <div className="sidebar-header">
        <div className="logo">lifesafe</div>

        <button onClick={() => setCollapsed(!collapsed)} className="toggle-btn" type="button" aria-label="Toggle sidebar">
          <i className="material-symbols-rounded">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </i>
        </button>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.name}
            className={`menu-item ${activeItem === item.name ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            type="button"
          >
            <i className="material-symbols-rounded">{item.icon}</i>
            <span>{item.name}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-account" ref={accountRef}>
        <button
          className={`sidebar-footer ${accountMenuOpen ? 'open' : ''}`}
          onClick={() => setAccountMenuOpen((open) => !open)}
          type="button"
          aria-expanded={accountMenuOpen}
          aria-label="Open account menu"
        >
          <img className="avatar" src="/profile-icon.webp" alt="" />

          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-email">{email}</div>
          </div>
        </button>

        <div className={`account-popover ${accountMenuOpen ? 'open' : ''}`}>
          <button className="account-logout" onClick={handleLogout} type="button">
            <i className="material-symbols-rounded">logout</i>
            <span>Log out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
