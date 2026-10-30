import { useState } from 'react'
import { useStore } from '../store'
import { ROLES } from '../data'
import Icon from '../components/icons'

const GUEST_NAMES = {
  admin: 'Guest Admin',
  manager: 'Guest Academic Manager',
  sales: 'Guest Sales',
  accountant: 'Guest Accountant',
  teacher: 'Guest Teacher',
  student: 'Guest Student',
}

export default function Login() {
  const { loginGuest, signIn } = useStore()
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await signIn(email, pw)
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-viewport">
      {/* Background ambient lighting */}
      <div className="login-ambient-glow" />

      <div className="login-card-frame">
        {/* Left Side: Product Showcase */}
        <section className="login-showcase">
          <div className="showcase-brand">
            <div className="showcase-logo">
              <Icon name="sparkles" size={20} />
            </div>
            <div className="showcase-brand-text">
              <span className="brand-name">Bright English</span>
              <span className="brand-suite">Center OS</span>
            </div>
          </div>

          <div className="showcase-headline">
            <h1>Hệ thống quản trị trung tâm chuẩn SaaS thế hệ mới</h1>
            <p>Đồng bộ dữ liệu học thuật LMS/CMS, quy trình tuyển sinh CRM/ERP, sổ sách kế toán và cổng học viên.</p>
          </div>

          <div className="showcase-feature-grid">
            <div className="showcase-feature-item">
              <div className="feature-icon-box">
                <Icon name="book" size={16} />
              </div>
              <div className="feature-desc">
                <b>Kho học liệu & Phê duyệt</b>
                <span>Quy trình biên tập, duyệt và phát hành giáo trình số</span>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-box">
                <Icon name="star" size={16} />
              </div>
              <div className="feature-desc">
                <b>Chất lượng giáo viên</b>
                <span>Chấm điểm đa chỉ số: chuyên cần, band điểm & dự giờ</span>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-box">
                <Icon name="receipt" size={16} />
              </div>
              <div className="feature-desc">
                <b>Tuyển sinh & Thu học phí</b>
                <span>Kanban pipeline lead, học thử, ghi danh sinh phiếu thu</span>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-box">
                <Icon name="wallet" size={16} />
              </div>
              <div className="feature-desc">
                <b>Tài chính & Lương giáo viên</b>
                <span>Đối soát tự động với số buổi điểm danh và báo cáo thu chi</span>
              </div>
            </div>
          </div>

          <div className="showcase-badge">
            <Icon name="check-circle" size={14} />
            <span>Sẵn sàng trải nghiệm ngay trên trình duyệt mà không cần thiết lập máy chủ</span>
          </div>
        </section>

        {/* Right Side: Authentication Panel */}
        <section className="login-action-panel">
          <div className="action-panel-header">
            <h2>Đăng nhập tài khoản</h2>
            <p className="muted">Nhập thông tin xác thực để truy cập hệ thống quản trị</p>
          </div>

          <form onSubmit={submit} className="login-form-box">
            <div className="form-field">
              <span className="form-label">Email tài khoản</span>
              <input
                placeholder="admin@brightenglish.edu.vn"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-field">
              <span className="form-label">Mật khẩu</span>
              <input
                placeholder="••••••••"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </div>

            <button className="primary-action-btn" disabled={busy}>
              <span>{busy ? 'Đang xác thực…' : 'Đăng nhập vào hệ thống'}</span>
              <Icon name="arrow-right" size={14} />
            </button>
            {err && <div className="login-error-banner">{err}</div>}
          </form>

          {/* Quick 1-click Guest Role Selector */}
          <div className="guest-quick-section">
            <div className="guest-section-header">
              <span className="guest-section-title">Hoặc trải nghiệm thử nghiệm theo vai trò</span>
              <span className="guest-section-subtitle">Bấm 1 chạm để chuyển giao diện theo từng nghiệp vụ:</span>
            </div>

            <div className="guest-roles-grid">
              {Object.entries(ROLES).map(([key, r]) => (
                <button
                  key={key}
                  className="guest-role-card"
                  style={{ '--role-color': r.color }}
                  onClick={() => loginGuest({ name: GUEST_NAMES[key], role: key })}
                >
                  <div className="role-card-header">
                    <span className="role-indicator-dot" />
                    <span className="role-card-name">{r.label}</span>
                  </div>
                  <span className="role-card-desc">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
