import { useState } from "react"
import "./Sidebar.css"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { name: "Dashboard", icon: "dashboard" },
    { name: "Calendar", icon: "calendar_month" },
    { name: "Friends", icon: "group" },
    { name: "Resources", icon: "menu_book" }
  ]

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      <div className="sidebar-header">
        {!collapsed && <div className="logo">lifesafe</div>}

        <button onClick={() => setCollapsed(!collapsed)} className="toggle-btn">
          <i className="material-symbols-rounded">
            {collapsed ? "chevron_right" : "chevron_left"}
          </i>
        </button>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div key={item.name} className="menu-item">
            <i className="material-symbols-rounded">{item.icon}</i>
            {!collapsed && <span>{item.name}</span>}
          </div>
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
    </aside>
  )
}