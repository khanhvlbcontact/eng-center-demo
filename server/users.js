import { ROLES } from '../src/data.js'
import { hashPw, passwordProblem, randomPassword } from './auth.js'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const fail = (res, code, error) => res.status(code).json({ error })

const row = (u) => ({
  id: u.id, email: u.email, name: u.name, role: u.role, studentId: u.student_id, teacherId: u.teacher_id,
  active: !!u.active, mustChange: !!u.must_change, createdAt: u.created_at, lastLogin: u.last_login,
})

export function userRoutes(app, { db, auth, need, audit }) {
  const byId = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  const activeAdmins = () => db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1").get().n

  // Kiểm tra vai trò + liên kết học viên/giáo viên. Trả về { studentId, teacherId } hoặc ném lỗi chuỗi.
  function links(role, studentId, teacherId) {
    if (!Object.hasOwn(ROLES, role)) throw 'Vai trò không hợp lệ'
    if (role === 'student') {
      if (!studentId || !db.prepare('SELECT 1 FROM students WHERE id = ?').get(studentId)) throw 'Vai trò Học viên cần liên kết với một hồ sơ học viên có sẵn'
      return { studentId, teacherId: null }
    }
    if (role === 'teacher') {
      if (!teacherId || !db.prepare('SELECT 1 FROM teachers WHERE id = ?').get(teacherId)) throw 'Vai trò Giáo viên cần liên kết với một hồ sơ giáo viên có sẵn'
      return { studentId: null, teacherId }
    }
    return { studentId: null, teacherId: null }
  }
  const uniqueMsg = (e) => {
    const m = String(e.message)
    if (m.includes('users.email')) return 'Email đã được sử dụng'
    if (m.includes('student_id')) return 'Hồ sơ học viên này đã có tài khoản'
    if (m.includes('teacher_id')) return 'Hồ sơ giáo viên này đã có tài khoản'
    return null
  }
  const cleanName = (v) => (typeof v === 'string' && v.trim() && v.trim().length <= 100 ? v.trim() : null)

  app.get('/api/users', auth, need('users', 'view'), (_req, res) => {
    res.json({ users: db.prepare('SELECT * FROM users ORDER BY id').all().map(row) })
  })

  app.post('/api/users', auth, need('users', 'edit'), (req, res) => {
    const { email, name, role, studentId, teacherId } = req.body || {}
    const nm = cleanName(name)
    if (typeof email !== 'string' || !EMAIL.test(email.trim()) || email.length > 200) return fail(res, 422, 'Email không hợp lệ')
    if (!nm) return fail(res, 422, 'Họ tên không hợp lệ')
    let l
    try { l = links(role, studentId, teacherId) } catch (m) { return fail(res, 422, String(m)) }
    let password = req.body.password
    let generated = false
    if (password === undefined || password === '') { password = randomPassword(); generated = true }
    else { const p = passwordProblem(password); if (p) return fail(res, 422, p) }
    try {
      const r = db.prepare('INSERT INTO users (email, name, role, pass_hash, student_id, teacher_id, must_change, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)')
        .run(email.trim(), nm, role, hashPw(password), l.studentId, l.teacherId, new Date().toISOString())
      audit(req.user, 'user_create', email.trim(), role)
      res.status(201).json({ user: row(byId(Number(r.lastInsertRowid))), tempPassword: generated ? password : undefined })
    } catch (e) {
      const m = uniqueMsg(e)
      if (m) return fail(res, 409, m)
      throw e
    }
  })

  app.patch('/api/users/:id', auth, need('users', 'edit'), (req, res) => {
    const u = byId(Number(req.params.id))
    if (!u) return fail(res, 404, 'Không tìm thấy người dùng')
    const b = req.body || {}
    const name = b.name === undefined ? u.name : cleanName(b.name)
    if (!name) return fail(res, 422, 'Họ tên không hợp lệ')
    const role = b.role === undefined ? u.role : b.role
    const active = b.active === undefined ? !!u.active : b.active === true
    if (b.active !== undefined && typeof b.active !== 'boolean') return fail(res, 422, 'Trạng thái không hợp lệ')
    const roleOrStatusChanges = role !== u.role || active !== !!u.active
    if (u.id === req.user.id && roleOrStatusChanges) return fail(res, 422, 'Bạn không thể tự đổi vai trò hoặc khoá chính mình')
    if (u.role === 'admin' && u.active && (role !== 'admin' || !active) && activeAdmins() <= 1) return fail(res, 422, 'Phải còn ít nhất một quản trị viên đang hoạt động')
    let l
    try { l = links(role, b.studentId === undefined ? u.student_id : b.studentId, b.teacherId === undefined ? u.teacher_id : b.teacherId) } catch (m) { return fail(res, 422, String(m)) }
    const revoke = roleOrStatusChanges || l.studentId !== u.student_id || l.teacherId !== u.teacher_id
    try {
      db.prepare('UPDATE users SET name = ?, role = ?, active = ?, student_id = ?, teacher_id = ?, token_version = token_version + ? WHERE id = ?')
        .run(name, role, active ? 1 : 0, l.studentId, l.teacherId, revoke ? 1 : 0, u.id)
    } catch (e) {
      const m = uniqueMsg(e)
      if (m) return fail(res, 409, m)
      throw e
    }
    audit(req.user, 'user_update', u.email, [role !== u.role && `role=${role}`, active !== !!u.active && (active ? 'mở khoá' : 'khoá')].filter(Boolean).join(', '))
    res.json({ user: row(byId(u.id)) })
  })

  app.post('/api/users/:id/reset-password', auth, need('users', 'edit'), (req, res) => {
    const u = byId(Number(req.params.id))
    if (!u) return fail(res, 404, 'Không tìm thấy người dùng')
    let password = req.body?.password
    let generated = false
    if (password === undefined || password === '') { password = randomPassword(); generated = true }
    else { const p = passwordProblem(password); if (p) return fail(res, 422, p) }
    db.prepare('UPDATE users SET pass_hash = ?, must_change = 1, token_version = token_version + 1 WHERE id = ?').run(hashPw(password), u.id)
    audit(req.user, 'user_reset_password', u.email)
    res.json({ user: row(byId(u.id)), tempPassword: generated ? password : undefined })
  })

  app.delete('/api/users/:id', auth, need('users', 'edit'), (req, res) => {
    const u = byId(Number(req.params.id))
    if (!u) return fail(res, 404, 'Không tìm thấy người dùng')
    if (u.id === req.user.id) return fail(res, 422, 'Bạn không thể xoá chính mình')
    if (u.role === 'admin' && u.active && activeAdmins() <= 1) return fail(res, 422, 'Phải còn ít nhất một quản trị viên đang hoạt động')
    db.prepare('DELETE FROM users WHERE id = ?').run(u.id)
    audit(req.user, 'user_delete', u.email, u.role)
    res.json({ ok: true })
  })

  app.get('/api/audit', auth, need('users', 'edit'), (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500)
    res.json({ entries: db.prepare('SELECT id, at, actor_email AS actor, action, target, detail FROM audit_log ORDER BY id DESC LIMIT ?').all(limit) })
  })
}
