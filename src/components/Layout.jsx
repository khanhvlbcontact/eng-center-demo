import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import ChangePassword from './ChangePassword'
import Icon from './icons'
import { useStore } from '../store'
import { MODULES, ROLES } from '../data'

const GUEST_NAMES = {
  admin: 'Guest Admin',
  manager: 'Guest Academic Manager',
  sales: 'Guest Sales',
  accountant: 'Guest Accountant',
  teacher: 'Guest Teacher',
  student: 'Guest Student',
}

export default function Layout({ children }) {
  const { user, logout, can, level, toast, resetDemo, loginGuest } = useStore()
  const [pw, setPw] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const role = ROLES[user.role]
  const groups = [...new Set(MODULES.map((m) => m.group))]

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Current module
  const currentKey = location.pathname.replace('/', '') || 'dashboard'
  const currentModule = MODULES.find((m) => m.key === currentKey)

  return (
    <div className="app-shell">
      {/* Desktop Floating Sidebar */}
      <aside className="app-sidebar desktop-only">
        {/* Workspace Brand Box */}
        <div className="workspace-header">
          <div className="workspace-logo">
            <Icon name="sparkles" size={19} />
          </div>
          <div className="workspace-info">
            <div className="workspace-name">Bright English</div>
            <div className="workspace-sub">Management Suite</div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="sidebar-scrollable">
          <nav className="nav-groups">
            {groups.map((g) => {
              const items = MODULES.filter((m) => m.group === g && can(m.key))
              if (!items.length) return null
              return (
                <div key={g} className="nav-section">
                  <div className="nav-section-title">{g}</div>
                  <div className="nav-list">
                    {items.map((m) => (
                      <NavLink
                        key={m.key}
                        to={'/' + m.key}
                        className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                      >
                        <span className="nav-icon-wrap">
                          <Icon name={m.icon} size={16} />
                        </span>
                        <span className="nav-text">{m.label}</span>
                        {level(m.key) === 'view' && <span className="nav-badge-ro">Xem</span>}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="sidebar-footer">
          {(user.guest || user.role === 'admin') && (
            <button className="reset-data-btn" onClick={resetDemo} title="Khôi phục lại toàn bộ dữ liệu mẫu">
              <Icon name="rotate-ccw" size={13} />
              <span>Khôi phục dữ liệu mẫu</span>
            </button>
          )}

          <div className="user-profile-tile">
            <div className="user-avatar-circle" style={{ backgroundColor: role.color }}>
              {user.name[0]}
            </div>
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-role-text">{role.label}</div>
            </div>
            <button className="user-logout-btn" onClick={logout} title={user.guest ? 'Đổi vai trò' : 'Đăng xuất'}>
              <Icon name="logout" size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      <div
        className={`mobile-drawer-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <div className="workspace-header" style={{ borderBottom: 0, padding: 0, margin: 0 }}>
            <div className="workspace-logo">
              <Icon name="sparkles" size={18} />
            </div>
            <div className="workspace-info">
              <div className="workspace-name">Bright English</div>
              <div className="workspace-sub">Management Suite</div>
            </div>
          </div>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {user.guest && (
          <div className="mobile-role-selector">
            <span className="mobile-role-label">Chọn vai trò trải nghiệm:</span>
            <select
              value={user.role}
              onChange={(e) => {
                const nextRole = e.target.value
                loginGuest({ name: GUEST_NAMES[nextRole], role: nextRole })
                setMobileOpen(false)
              }}
              className="mobile-role-select"
            >
              {Object.entries(ROLES).map(([k, r]) => (
                <option key={k} value={k}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mobile-nav-scroll">
          <nav className="nav-groups">
            {groups.map((g) => {
              const items = MODULES.filter((m) => m.group === g && can(m.key))
              if (!items.length) return null
              return (
                <div key={g} className="nav-section">
                  <div className="nav-section-title">{g}</div>
                  <div className="nav-list">
                    {items.map((m) => (
                      <NavLink
                        key={m.key}
                        to={'/' + m.key}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                      >
                        <span className="nav-icon-wrap">
                          <Icon name={m.icon} size={16} />
                        </span>
                        <span className="nav-text">{m.label}</span>
                        {level(m.key) === 'view' && <span className="nav-badge-ro">Xem</span>}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        <div className="mobile-drawer-footer">
          {(user.guest || user.role === 'admin') && (
            <button
              className="reset-data-btn"
              onClick={() => {
                resetDemo()
                setMobileOpen(false)
              }}
            >
              <Icon name="rotate-ccw" size={13} />
              <span>Khôi phục dữ liệu mẫu</span>
            </button>
          )}

          <div className="user-profile-tile">
            <div className="user-avatar-circle" style={{ backgroundColor: role.color }}>
              {user.name[0]}
            </div>
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-role-text">{role.label}</div>
            </div>
            {user.real && (
              <button
                className="top-btn"
                style={{ padding: '4px 8px' }}
                onClick={() => {
                  setPw(true)
                  setMobileOpen(false)
                }}
                title="Đổi mật khẩu"
              >
                <Icon name="lock" size={12} />
              </button>
            )}
            <button
              className="user-logout-btn"
              onClick={logout}
              title={user.guest ? 'Đổi vai trò' : 'Đăng xuất'}
            >
              <Icon name="logout" size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Elevated Canvas */}
      <div className="app-canvas-container">
        <div className="app-canvas">
          {/* Canvas Topbar (Responsive Single Row) */}
          <header className="canvas-topbar">
            {/* Left: Mobile hamburger & Breadcrumbs */}
            <div className="topbar-left">
              <button
                className="mobile-hamburger-btn"
                onClick={() => setMobileOpen(true)}
                aria-label="Mở menu điều hướng"
              >
                <Icon name="menu" size={19} />
              </button>

              {/* Desktop breadcrumb */}
              <div className="breadcrumb-nav desktop-only">
                <span className="bc-root">Hệ thống</span>
                <span className="bc-sep">/</span>
                <span className="bc-group">{currentModule?.group || 'Chung'}</span>
                <span className="bc-sep">/</span>
                <span className="bc-current">{currentModule?.label || 'Tổng quan'}</span>
              </div>

              {/* Mobile compact title */}
              <div className="mobile-topbar-title mobile-only">
                <Icon name={currentModule?.icon || 'dashboard'} size={16} />
                <span>{currentModule?.label || 'Tổng quan'}</span>
              </div>
            </div>

            {/* Right: Status & Quick Role / Profile (Single row on mobile) */}
            <div className="topbar-right">
              {/* Live status badge - desktop */}
              <div className="system-status-indicator desktop-only">
                <span className="status-dot-pulse" />
                <span>{user.real ? 'Máy chủ trực tuyến' : 'Chế độ Demo'}</span>
              </div>

              {/* Quick Role Switcher for Guest */}
              {user.guest && (
                <div className="quick-role-switcher desktop-only">
                  <span className="switcher-label">Vai trò:</span>
                  <select
                    value={user.role}
                    onChange={(e) => {
                      const nextRole = e.target.value
                      loginGuest({ name: GUEST_NAMES[nextRole], role: nextRole })
                    }}
                    className="role-select-box"
                  >
                    {Object.entries(ROLES).map(([k, r]) => (
                      <option key={k} value={k}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mobile quick role pill */}
              <div
                className="mobile-role-pill mobile-only"
                style={{ '--role-color': role.color }}
                onClick={() => setMobileOpen(true)}
              >
                <span className="role-dot-mini" />
                <span>{role.label.split('/')[0]}</span>
              </div>

              {user.real && (
                <button
                  className="top-btn desktop-only"
                  onClick={() => setPw(true)}
                  title="Đổi mật khẩu"
                >
                  <Icon name="lock" size={13} />
                  <span>Đổi MK</span>
                </button>
              )}

              <button
                className="top-btn logout-text-btn desktop-only"
                onClick={logout}
              >
                <span>{user.guest ? 'Thoát vai trò' : 'Đăng xuất'}</span>
                <Icon name="arrow-right" size={12} />
              </button>
            </div>
          </header>

          {/* Canvas Content Area */}
          <main className="canvas-body">{children}</main>
        </div>
      </div>

      {pw && <ChangePassword onClose={() => setPw(false)} />}
      {toast && (
        <div className="toast-notification">
          <Icon name="check-circle" size={15} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
