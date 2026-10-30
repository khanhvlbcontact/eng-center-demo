import { useState } from 'react'
import { useStore } from '../store'
import { Modal, Field } from './ui'

// Đổi mật khẩu của chính mình. forced: bị buộc đổi (tài khoản mới / vừa được đặt lại) nên hiện toàn trang, không đóng được.
export default function ChangePassword({ forced, onClose }) {
  const s = useStore()
  const [f, setF] = useState({ current: '', password: '', confirm: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (f.password !== f.confirm) return setErr('Mật khẩu nhập lại không khớp')
    setErr('')
    setBusy(true)
    try {
      const d = await s.req('POST', '/auth/change-password', { current: f.current, password: f.password })
      await s.adoptSession(d.token, d.user)
      s.notify('Đã đổi mật khẩu')
      onClose?.()
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setBusy(false)
    }
  }

  const form = (
    <form onSubmit={submit}>
      {forced && (
        <div className="note warn">
          Tài khoản của bạn được cấp mật khẩu tạm thời. Hãy đặt mật khẩu mới an toàn để tiếp tục truy cập.
        </div>
      )}
      <Field label="Mật khẩu hiện tại">
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={f.current}
          onChange={(e) => setF({ ...f, current: e.target.value })}
        />
      </Field>
      <Field label="Mật khẩu mới (≥ 10 ký tự, có chữ hoa, chữ thường, chữ số)">
        <input
          type="password"
          autoComplete="new-password"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
        />
      </Field>
      <Field label="Nhập lại mật khẩu mới">
        <input
          type="password"
          autoComplete="new-password"
          value={f.confirm}
          onChange={(e) => setF({ ...f, confirm: e.target.value })}
        />
      </Field>
      {err && <div className="note warn">{err}</div>}
      <div className="modal-foot">
        {forced && (
          <button type="button" className="btn ghost" onClick={s.logout}>
            Đăng xuất
          </button>
        )}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Đổi mật khẩu'}
        </button>
      </div>
    </form>
  )

  if (!forced) {
    return (
      <Modal title="Đổi mật khẩu" onClose={onClose} width={440}>
        {form}
      </Modal>
    )
  }

  return (
    <div className="forced-password-page">
      <div className="card forced-password-card">
        <h2 style={{ marginBottom: 14 }}>Đặt mật khẩu mới</h2>
        {form}
      </div>
    </div>
  )
}
