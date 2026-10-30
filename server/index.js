import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reducers, ACTIONS, COLLECTIONS } from '../src/engine.js'
import { openDb, loadState, saveState, permLevel, kvGet, kvSet } from './db.js'
import { checkPw, hashPw, passwordProblem } from './auth.js'
import { userRoutes } from './users.js'

const PORT = Number(process.env.PORT) || 3001
const here = path.dirname(fileURLToPath(import.meta.url))
const db = openDb(process.env.DB_FILE || path.join(here, 'data.db'))

// JWT secret: lấy từ env, nếu không thì sinh ngẫu nhiên một lần và lưu trong DB
const SECRET = process.env.JWT_SECRET || kvGet(db, 'jwt_secret') || (() => { const s = crypto.randomBytes(48).toString('hex'); kvSet(db, 'jwt_secret', s); return s })()
const DUMMY = hashPw('dummy-password') // so sánh giả khi email không tồn tại, tránh lộ thông tin qua thời gian phản hồi

const RANK = { none: 0, view: 1, edit: 2 }
const userById = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id)
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, studentId: u.student_id, teacherId: u.teacher_id, mustChange: !!u.must_change })
const signToken = (u) => jwt.sign({ sub: String(u.id), tv: u.token_version }, SECRET, { expiresIn: '12h' })

function audit(actor, action, target, detail) {
  db.prepare('INSERT INTO audit_log (at, actor_id, actor_email, action, target, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
    new Date().toISOString(), actor?.id ?? null, actor?.email ?? null, action, target == null ? null : String(target).slice(0, 100), detail == null ? null : String(detail).slice(0, 300)
  )
}

// collection nào đọc được khi role có quyền (≥ view) ở module nào
const READ = {
  materials: ['materials', 'portal'],
  teachers: ['teachers', 'materials', 'classes', 'portal', 'assignments'],
  observations: ['teachers'],
  classes: ['classes', 'admissions', 'students', 'assignments', 'portal', 'dashboard'],
  students: ['students', 'admissions', 'finance', 'portal', 'assignments', 'classes'],
  leads: ['admissions', 'dashboard'],
  transactions: ['finance'],
  sessions: ['classes', 'teachers', 'finance'],
  payrolls: ['finance'],
  assignments: ['assignments', 'portal'],
  submissions: ['assignments', 'portal'],
}

function visibleState(user, state) {
  const lv = (m) => RANK[state.perms[user.role]?.[m] || 'none']
  const canRead = (col) => !user.must_change && READ[col].some((m) => lv(m) >= 1)
  const out = { perms: user.role === 'admin' ? state.perms : { [user.role]: state.perms[user.role] || {} } }
  for (const col of COLLECTIONS) out[col] = canRead(col) ? state[col] : []
  // người không có quyền xem chất lượng GV chỉ thấy tên/chứng chỉ, không thấy chỉ số
  if (lv('teachers') === 0) out.teachers = out.teachers.map(({ id, name, cert }) => ({ id, name, cert }))
  // học viên chỉ thấy dữ liệu của chính mình
  if (user.role === 'student') {
    const me = state.students.find((s) => s.id === user.student_id)
    out.students = me ? [me] : []
    out.submissions = out.submissions.filter((b) => b.studentId === user.student_id)
    out.assignments = out.assignments.filter((a) => a.classId === me?.classId)
    out.sessions = []
  }
  return out
}

// Chuẩn hoá/ép các trường nhạy cảm do server quyết định, không tin dữ liệu từ client.
function prepareArgs(user, state, type, args) {
  const a = [...args]
  const isReviewer = user.role === 'admin' || user.role === 'manager'
  const ownsClass = (classId) => user.role !== 'teacher' || state.classes.some((c) => c.id === classId && c.teacherId === user.teacher_id)
  switch (type) {
    case 'addMaterial':
      a[0] = { ...a[0], author: user.teacher_id || 'center' }
      if (!isReviewer && a[0].status === 'published') a[0].status = 'pending'
      break
    case 'setMaterialStatus':
      if (!isReviewer && a[1] === 'published') throw new Error('Chỉ quản lý được xuất bản tài liệu')
      break
    case 'addObservation':
      a[0] = { ...a[0], observer: user.name }
      break
    case 'addSession':
    case 'addAssignment':
      if (!ownsClass(a[0]?.classId)) throw new Error('Bạn không phụ trách lớp này')
      break
    case 'gradeWork': {
      const b = state.submissions.find((x) => x.id === a[0])
      const asg = b && state.assignments.find((x) => x.id === b.assignmentId)
      if (asg && !ownsClass(asg.classId)) throw new Error('Bạn không phụ trách lớp này')
      break
    }
    case 'submitWork':
      if (user.role === 'student') a[1] = user.student_id
      break
    case 'payTeacher':
      a.length = 2 // số tiền do server tự tính
      break
    default:
  }
  return a
}

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' })
  next()
})

// chống dò mật khẩu: tối đa 10 lần thất bại / 5 phút cho mỗi IP
const fails = new Map()
const WINDOW = 5 * 60 * 1000
const recentFails = (ip) => {
  const list = (fails.get(ip) || []).filter((t) => Date.now() - t < WINDOW)
  fails.set(ip, list)
  return list
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/auth/login', (req, res) => {
  const ip = req.ip
  if (recentFails(ip).length >= 10) return res.status(429).json({ error: 'Thử quá nhiều lần, vui lòng đợi vài phút' })
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 200 || password.length > 200) return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' })
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim())
  const ok = checkPw(password, user ? user.pass_hash : DUMMY) && !!user && !!user.active
  if (!ok) {
    recentFails(ip).push(Date.now())
    audit(null, 'login_failed', email.trim().slice(0, 100), ip)
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
  }
  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), user.id)
  audit(user, 'login', user.email)
  res.json({ token: signToken(user), user: publicUser(user), state: visibleState(user, loadState(db)) })
})

function auth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.get('authorization') || '')
  if (!m) return res.status(401).json({ error: 'Chưa đăng nhập' })
  try {
    const { sub, tv } = jwt.verify(m[1], SECRET)
    const user = userById(Number(sub))
    // khoá tài khoản / đổi vai trò / đặt lại mật khẩu làm token cũ mất hiệu lực ngay
    if (!user || !user.active || user.token_version !== tv) throw new Error('revoked')
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập hết hạn' })
  }
}

// yêu cầu quyền module; tài khoản đang bị buộc đổi mật khẩu thì không dùng được chức năng khác
const need = (mod, level) => (req, res, next) => {
  if (req.user.must_change) return res.status(403).json({ error: 'Bạn cần đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE' })
  if (RANK[permLevel(db, req.user.role, mod)] < RANK[level]) return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' })
  next()
}

app.get('/api/state', auth, (req, res) => res.json({ user: publicUser(req.user), state: visibleState(req.user, loadState(db)) }))

app.post('/api/auth/change-password', auth, (req, res) => {
  const { current, password } = req.body || {}
  if (typeof current !== 'string' || !checkPw(current, req.user.pass_hash)) return res.status(422).json({ error: 'Mật khẩu hiện tại không đúng' })
  const problem = passwordProblem(password)
  if (problem) return res.status(422).json({ error: problem })
  if (password === current) return res.status(422).json({ error: 'Mật khẩu mới phải khác mật khẩu cũ' })
  db.prepare('UPDATE users SET pass_hash = ?, must_change = 0, token_version = token_version + 1 WHERE id = ?').run(hashPw(password), req.user.id)
  const fresh = userById(req.user.id)
  audit(fresh, 'change_password', fresh.email)
  res.json({ token: signToken(fresh), user: publicUser(fresh) }) // token mới để phiên hiện tại tiếp tục dùng được
})

app.post('/api/action', auth, (req, res) => {
  const { type, args } = req.body || {}
  const def = Object.hasOwn(ACTIONS, type) ? ACTIONS[type] : null
  if (!def || !Array.isArray(args) || args.length > 6) return res.status(400).json({ error: 'Yêu cầu không hợp lệ' })
  if (req.user.must_change) return res.status(403).json({ error: 'Bạn cần đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE' })
  const state = loadState(db)
  const lvl = RANK[state.perms[req.user.role]?.[def.mod] || 'none']
  const studentOk = def.studentSelf && req.user.role === 'student' && lvl >= RANK.view
  if (lvl < RANK[def.level] && !studentOk) return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' })
  let next
  try {
    next = { ...state, ...reducers[type](state, ...prepareArgs(req.user, state, type, args)) }
  } catch (e) {
    return res.status(422).json({ error: e.message })
  }
  try {
    saveState(db, state, next)
  } catch (e) {
    console.error('saveState failed:', e.message)
    return res.status(422).json({ error: 'Dữ liệu vi phạm ràng buộc của cơ sở dữ liệu' })
  }
  if (type !== 'bumpDownload') audit(req.user, type, typeof args[0] === 'string' ? args[0] : args[0]?.id ?? args[0]?.classId ?? '', type === 'setPerm' ? args.join('/') : '')
  res.json({ state: visibleState(req.user, loadState(db)) })
})

userRoutes(app, { db, auth, need, audit, publicUser })

app.use('/api', (_req, res) => res.status(404).json({ error: 'Không tìm thấy' }))
// lỗi phân tích JSON, v.v. luôn trả JSON
app.use((err, _req, res, _next) => res.status(err.status || 500).json({ error: err.status === 400 ? 'Dữ liệu gửi lên không hợp lệ' : 'Lỗi máy chủ' }))

app.listen(PORT, '127.0.0.1', () => console.log(`API chạy tại http://127.0.0.1:${PORT}`))
