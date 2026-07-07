import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth } from '../auth'
import './Sidebar.css'

export default function Sidebar({ activeItem = 'Calendar' }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const menuItems = [
    { name: 'Calendar', icon: 'calendar_month', path: '/' },
    { name: 'Journal', icon: 'edit_note', path: '/entry' },
    { name: 'Message', icon: 'chat', path: '/message' },
    { name: 'Resources', icon: 'menu_book', path: '/resources' },
  ]

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      <div className="sidebar-header">
        {!collapsed && <div className="logo">lifesafe</div>}

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
            {!collapsed && <span>{item.name}</span>}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="avatar"></div>

        {!collapsed && (
          <div className="user-info">
            <div className="user-name">Sample Name</div>
            <div className="user-email">sample@example.com</div>
          </div>
        )}
      </div>

      <button className="sidebar-logout" onClick={handleLogout} type="button">
        <i className="material-symbols-rounded">logout</i>
        {!collapsed && <span>Log out</span>}
      </button>
    </aside>
  )
}
