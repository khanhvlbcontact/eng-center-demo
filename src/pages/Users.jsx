import { useCallback, useEffect, useState } from 'react'
import { useStore } from '../store'
import { ROLES } from '../data'
import { PageHead, Modal, Field, Badge, ReadOnlyNote } from '../components/ui'
import Icon from '../components/icons'

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—')
const ACTION_LABEL = {
  login: 'Đăng nhập',
  login_failed: 'Đăng nhập sai',
  change_password: 'Đổi mật khẩu',
  user_create: 'Tạo người dùng',
  user_update: 'Sửa người dùng',
  user_reset_password: 'Đặt lại mật khẩu',
  user_delete: 'Xoá người dùng',
  setPerm: 'Đổi phân quyền',
  enroll: 'Ghi danh',
  payTuition: 'Thu học phí',
  addTransaction: 'Ghi thu/chi',
  removeTransaction: 'Xoá giao dịch',
  payTeacher: 'Chi lương',
  resetDemo: 'Khôi phục dữ liệu mẫu',
}

export default function Users() {
  const s = useStore()
  if (!s.isReal) {
    return (
      <div className="empty">
        <Icon name="users" size={22} style={{ marginBottom: 8, display: 'block', marginInline: 'auto' }} />
        <span>Quản lý người dùng chỉ hoạt động khi đăng nhập thật qua máy chủ (chế độ Guest không có tài khoản thật).</span>
      </div>
    )
  }
  return <UsersReal />
}

function UsersReal() {
  const s = useStore()
  const edit = s.canEdit('users')
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [audit, setAudit] = useState([])
  const [form, setForm] = useState(null) // {id?, ...fields}
  const [err, setErr] = useState('')
  const [secret, setSecret] = useState(null) // {email, password}
  const [confirm, setConfirm] = useState(null) // {kind, user}
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    try {
      setUsers((await s.req('GET', '/users')).users)
      if (edit) setAudit((await s.req('GET', '/audit?limit=100')).entries)
    } catch (e) {
      s.notify(e.message)
    }
  }, [s.req, edit]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  const open = (u) => {
    setErr('')
    setForm(
      u
        ? {
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            studentId: u.studentId || '',
            teacherId: u.teacherId || '',
          }
        : { email: '', name: '', role: 'sales', studentId: '', teacherId: '', password: '' }
    )
  }
  const linkedStudents = new Set(users.filter((u) => u.id !== form?.id).map((u) => u.studentId).filter(Boolean))
  const linkedTeachers = new Set(users.filter((u) => u.id !== form?.id).map((u) => u.teacherId).filter(Boolean))

  const save = async () => {
    setErr('')
    const body = {
      name: form.name,
      role: form.role,
      studentId: form.role === 'student' ? form.studentId : null,
      teacherId: form.role === 'teacher' ? form.teacherId : null,
    }
    try {
      if (form.id) {
        await s.req('PATCH', '/users/' + form.id, body)
        s.notify('Đã cập nhật người dùng')
      } else {
        const d = await s.req('POST', '/users', { ...body, email: form.email, password: form.password || undefined })
        if (d.tempPassword) setSecret({ email: form.email, password: d.tempPassword })
        else s.notify('Đã tạo người dùng')
      }
      setForm(null)
      load()
    } catch (e) {
      setErr(e.message)
    }
  }

  const act = async () => {
    const { kind, user } = confirm
    try {
      if (kind === 'delete') {
        await s.req('DELETE', '/users/' + user.id)
        s.notify('Đã xoá người dùng')
      }
      if (kind === 'toggle') {
        await s.req('PATCH', '/users/' + user.id, { active: !user.active })
        s.notify(user.active ? 'Đã khoá tài khoản' : 'Đã mở khoá')
      }
      if (kind === 'reset') {
        const d = await s.req('POST', `/users/${user.id}/reset-password`, {})
        setSecret({ email: user.email, password: d.tempPassword })
      }
    } catch (e) {
      s.notify(e.message)
    }
    setConfirm(null)
    load()
  }

  const list = users.filter((u) => !q || (u.name + u.email).toLowerCase().includes(q.toLowerCase()))
  const nameOf = (u) =>
    u.studentId
      ? s.students.find((x) => x.id === u.studentId)?.name
      : u.teacherId
      ? s.teachers.find((x) => x.id === u.teacherId)?.name
      : null
  const verb = {
    delete: 'Xoá vĩnh viễn',
    toggle: confirm?.user.active ? 'Khoá' : 'Mở khoá',
    reset: 'Đặt lại mật khẩu cho',
  }

  return (
    <>
      <PageHead
        title="Người dùng & nhật ký"
        sub="Tạo tài khoản, gán vai trò, khoá/mở khoá, đặt lại mật khẩu và xem nhật ký hoạt động"
      >
        {edit && (
          <button className="btn primary" onClick={() => open(null)}>
            <Icon name="plus" size={14} />
            <span>Thêm người dùng</span>
          </button>
        )}
      </PageHead>
      <ReadOnlyNote show={!edit} />
      <div className="seg" style={{ maxWidth: 320 }}>
        <button className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>
          Người dùng ({users.length})
        </button>
        {edit && (
          <button className={tab === 'audit' ? 'on' : ''} onClick={() => setTab('audit')}>
            Nhật ký
          </button>
        )}
      </div>

      {tab === 'users' && (
        <>
          <div className="toolbar">
            <div className="search-box">
              <Icon name="search" size={15} className="search-icon" />
              <input
                placeholder="Tìm theo tên hoặc email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Liên kết hồ sơ</th>
                  <th>Trạng thái</th>
                  <th>Đăng nhập gần nhất</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <b>{u.name}</b>
                      {u.id === s.user.id && (
                        <>
                          {' '}
                          <Badge tone="blue">Bạn</Badge>
                        </>
                      )}
                      <br />
                      <small className="muted">{u.email}</small>
                    </td>
                    <td>
                      <span
                        className="pill role-pill"
                        style={{
                          '--role-color': ROLES[u.role].color,
                        }}
                      >
                        {ROLES[u.role].label}
                      </span>
                    </td>
                    <td>{nameOf(u) || <span className="muted">—</span>}</td>
                    <td>
                      {!u.active ? (
                        <Badge tone="red">Đã khoá</Badge>
                      ) : u.mustChange ? (
                        <Badge tone="orange">Chờ đổi mật khẩu</Badge>
                      ) : (
                        <Badge tone="green">Hoạt động</Badge>
                      )}
                    </td>
                    <td>{fmt(u.lastLogin)}</td>
                    <td className="num">
                      {edit && (
                        <div className="action-btn-group" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="icon-action-btn"
                            title="Sửa thông tin"
                            onClick={() => open(u)}
                            aria-label="Sửa"
                          >
                            <Icon name="pencil" size={13} />
                          </button>
                          <button
                            className="icon-action-btn"
                            title="Đặt lại mật khẩu"
                            onClick={() => setConfirm({ kind: 'reset', user: u })}
                            aria-label="Đặt lại mật khẩu"
                          >
                            <Icon name="key" size={13} />
                          </button>
                          {u.id !== s.user.id && (
                            <button
                              className="icon-action-btn"
                              title={u.active ? 'Khoá tài khoản' : 'Mở khoá'}
                              onClick={() => setConfirm({ kind: 'toggle', user: u })}
                              aria-label={u.active ? 'Khoá' : 'Mở khoá'}
                            >
                              <Icon name={u.active ? 'lock' : 'unlock'} size={13} />
                            </button>
                          )}
                          {u.id !== s.user.id && (
                            <button
                              className="icon-action-btn danger"
                              title="Xoá người dùng"
                              onClick={() => setConfirm({ kind: 'delete', user: u })}
                              aria-label="Xoá"
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'audit' && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id}>
                  <td>{fmt(a.at)}</td>
                  <td>{a.actor || <span className="muted">—</span>}</td>
                  <td>
                    <Badge tone={a.action === 'login_failed' ? 'red' : 'gray'}>
                      {ACTION_LABEL[a.action] || a.action}
                    </Badge>
                  </td>
                  <td>{a.target}</td>
                  <td className="muted">{a.detail}</td>
                </tr>
              ))}
              {!audit.length && (
                <tr>
                  <td colSpan="5" className="muted">
                    Chưa có hoạt động.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Sửa người dùng' : 'Thêm người dùng mới'} onClose={() => setForm(null)} width={480}>
          <Field label="Email">
            <input
              type="email"
              disabled={!!form.id}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Họ tên">
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Vai trò">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {Object.entries(ROLES).map(([k, r]) => (
                <option key={k} value={k}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          {form.role === 'student' && (
            <Field label="Liên kết hồ sơ học viên">
              <select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                <option value="">-- Chưa liên kết --</option>
                {s.students.map((st) => (
                  <option key={st.id} value={st.id} disabled={linkedStudents.has(st.id)}>
                    {st.name} ({st.phone}){linkedStudents.has(st.id) ? ' · Đã liên kết' : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {form.role === 'teacher' && (
            <Field label="Liên kết hồ sơ giáo viên">
              <select
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
              >
                <option value="">-- Chưa liên kết --</option>
                {s.teachers.map((tc) => (
                  <option key={tc.id} value={tc.id} disabled={linkedTeachers.has(tc.id)}>
                    {tc.name} ({tc.cert}){linkedTeachers.has(tc.id) ? ' · Đã liên kết' : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {!form.id && (
            <Field label="Mật khẩu ban đầu (bỏ trống để hệ thống tự tạo mật khẩu ngẫu nhiên)">
              <input
                type="text"
                placeholder="Tự tạo mật khẩu tạm thời"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          )}
          {err && <div className="note warn">{err}</div>}
          <div className="modal-foot">
            <button className="btn primary" onClick={save}>
              {form.id ? 'Cập nhật' : 'Tạo tài khoản'}
            </button>
          </div>
        </Modal>
      )}

      {secret && (
        <Modal title="Mật khẩu tạm thời" onClose={() => setSecret(null)} width={460}>
          <p>
            Mật khẩu tạm thời đã được tạo cho <b>{secret.email}</b>. Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng
            nhập đầu tiên.
          </p>
          <div className="pw-box">{secret.password}</div>
          <small className="muted" style={{ display: 'block', marginTop: 8 }}>
            Hãy sao chép và gửi mật khẩu này cho người dùng. Mật khẩu sẽ không hiển thị lại.
          </small>
          <div className="modal-foot">
            <button
              className="btn primary"
              onClick={() => {
                navigator.clipboard.writeText(secret.password)
                s.notify('Đã chép mật khẩu vào clipboard')
                setSecret(null)
              }}
            >
              Sao chép & đóng
            </button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal title="Xác nhận" onClose={() => setConfirm(null)} width={420}>
          <p>
            Bạn có chắc muốn {verb[confirm.kind]} tài khoản <b>{confirm.user.name}</b> ({confirm.user.email})?
          </p>
          <div className="modal-foot">
            <button className="btn ghost" onClick={() => setConfirm(null)}>
              Huỷ
            </button>
            <button className={'btn ' + (confirm.kind === 'delete' ? 'primary' : 'primary')} onClick={act}>
              Xác nhận
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
