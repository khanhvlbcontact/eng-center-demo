import { useEffect } from 'react'
import Icon from './icons'

export function PageHead({ title, sub, children }) {
  return (
    <div className="section-head">
      <div className="section-head-info">
        <h1 className="section-title">{title}</h1>
        {sub && <p className="section-subtitle">{sub}</p>}
      </div>
      {children && <div className="section-actions">{children}</div>}
    </div>
  )
}

export function Stat({ label, value, hint, tone = 'blue', icon }) {
  return (
    <div className={`kpi-card ${tone}`}>
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        {icon && (
          <div className="kpi-icon-container">
            <Icon name={icon} size={15} />
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {hint && (
        <div className="kpi-footer">
          <span className="kpi-hint">{hint}</span>
        </div>
      )}
    </div>
  )
}

export function Modal({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-container" style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      {children}
    </label>
  )
}

export function Badge({ tone = 'gray', children, hasDot = false }) {
  return (
    <span className={`pill-badge ${tone}`}>
      {hasDot && <span className="badge-dot" />}
      {children}
    </span>
  )
}

export function ReadOnlyNote({ show }) {
  if (!show) return null
  return (
    <div className="readonly-banner">
      <div className="readonly-icon">
        <Icon name="eye" size={15} />
      </div>
      <div className="readonly-text">
        <span>Vai trò hiện tại đang ở chế độ <b>chỉ xem</b> — các thao tác thêm / sửa đã được bảo vệ.</span>
      </div>
    </div>
  )
}

// Biểu đồ cột thu/chi SVG hiện đại
export function BarChart({ data, height = 180 }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]))
  const w = 100 / (data.length || 1)

  return (
    <div className="barchart-container">
      <svg viewBox={`0 0 100 ${height / 2}`} preserveAspectRatio="none" className="barchart-svg" style={{ height }}>
        {data.map((d, i) => {
          const h1 = (d.income / max) * (height / 2 - 10)
          const h2 = (d.expense / max) * (height / 2 - 10)
          const x = i * w
          return (
            <g key={d.label} className="chart-bar-group">
              <rect
                x={x + w * 0.16}
                y={height / 2 - h1}
                width={w * 0.3}
                height={Math.max(2, h1)}
                rx="1.5"
                fill="#10b981"
                className="chart-rect income"
              />
              <rect
                x={x + w * 0.54}
                y={height / 2 - h2}
                width={w * 0.3}
                height={Math.max(2, h2)}
                rx="1.5"
                fill="#f59e0b"
                className="chart-rect expense"
              />
            </g>
          )
        })}
      </svg>
      <div className="barchart-labels">
        {data.map((d) => (
          <span key={d.label} className="barchart-label">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Progress({ value, tone }) {
  return (
    <div className="progress-track">
      <div
        className={`progress-fill ${tone || ''}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
