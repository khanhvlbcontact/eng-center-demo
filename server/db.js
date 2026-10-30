import { DatabaseSync } from 'node:sqlite'
import { initialState } from '../src/engine.js'
import { DEFAULT_PERMS, ROLES } from '../src/data.js'
import { SEED_USERS } from './users.seed.js'
import { hashPw } from './auth.js'

// Ánh xạ collection (state phía client) <-> bảng quan hệ. cols: [khoá trong state, tên cột SQL]
const SPEC = {
  teachers: {
    t: 'teachers', pk: ['id'], order: 'rowid',
    cols: [['id', 'id'], ['name', 'name'], ['cert', 'cert'], ['classes', 'classes'], ['studentRating', 'student_rating'], ['attendance', 'attendance'], ['onTime', 'on_time'], ['scoreGain', 'score_gain'], ['passRate', 'pass_rate'], ['observation', 'observation'], ['complaints', 'complaints']],
  },
  classes: {
    t: 'classes', pk: ['id'], order: 'rowid',
    cols: [['id', 'id'], ['code', 'code'], ['course', 'course'], ['teacherId', 'teacher_id'], ['schedule', 'schedule'], ['room', 'room'], ['size', 'size'], ['capacity', 'capacity']],
  },
  students: {
    t: 'students', pk: ['id'], order: 'enrolled DESC, rowid DESC',
    cols: [['id', 'id'], ['name', 'name'], ['phone', 'phone'], ['classId', 'class_id'], ['paid', 'paid'], ['fee', 'fee'], ['enrolled', 'enrolled']],
  },
  leads: {
    t: 'leads', pk: ['id'], order: 'rowid DESC',
    cols: [['id', 'id'], ['name', 'name'], ['phone', 'phone'], ['interest', 'interest'], ['source', 'source'], ['stage', 'stage'], ['owner', 'owner']],
  },
  materials: {
    t: 'materials', pk: ['id'], order: 'date DESC, rowid DESC',
    cols: [['id', 'id'], ['title', 'title'], ['level', 'level'], ['skill', 'skill'], ['type', 'type'], ['author', 'author'], ['date', 'date'], ['status', 'status'], ['downloads', 'downloads'], ['size', 'size']],
  },
  observations: {
    t: 'observations', pk: ['id'], order: 'date DESC, rowid DESC',
    cols: [['id', 'id'], ['teacherId', 'teacher_id'], ['date', 'date'], ['observer', 'observer'], ['score', 'score'], ['note', 'note']],
  },
  transactions: {
    t: 'transactions', pk: ['id'], order: 'date DESC, rowid DESC',
    cols: [['id', 'id'], ['date', 'date'], ['type', 'type'], ['cat', 'cat'], ['amount', 'amount'], ['note', 'note'], ['method', 'method']],
  },
  sessions: {
    t: 'sessions', pk: ['id'], order: 'date DESC, rowid DESC',
    cols: [['id', 'id'], ['classId', 'class_id'], ['teacherId', 'teacher_id'], ['date', 'date'], ['present', 'present'], ['total', 'total']],
  },
  payrolls: {
    t: 'payrolls', pk: ['teacherId', 'month'], order: 'rowid',
    cols: [['teacherId', 'teacher_id'], ['month', 'month']],
  },
  assignments: {
    t: 'assignments', pk: ['id'], order: 'created DESC, rowid DESC',
    cols: [['id', 'id'], ['classId', 'class_id'], ['title', 'title'], ['due', 'due'], ['max', 'max_score'], ['created', 'created']],
  },
  submissions: {
    t: 'submissions', pk: ['id'], order: 'rowid DESC',
    cols: [['id', 'id'], ['assignmentId', 'assignment_id'], ['studentId', 'student_id'], ['text', 'body'], ['score', 'score'], ['feedback', 'feedback']],
  },
}

const roleList = Object.keys(ROLES).map((r) => `'${r}'`).join(',')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, cert TEXT NOT NULL DEFAULT '',
  classes INTEGER NOT NULL DEFAULT 0 CHECK (classes >= 0),
  student_rating REAL NOT NULL DEFAULT 0 CHECK (student_rating BETWEEN 0 AND 5),
  attendance REAL NOT NULL DEFAULT 0 CHECK (attendance BETWEEN 0 AND 100),
  on_time REAL NOT NULL DEFAULT 0 CHECK (on_time BETWEEN 0 AND 100),
  score_gain REAL NOT NULL DEFAULT 0,
  pass_rate REAL NOT NULL DEFAULT 0 CHECK (pass_rate BETWEEN 0 AND 100),
  observation REAL NOT NULL DEFAULT 0 CHECK (observation BETWEEN 0 AND 5),
  complaints INTEGER NOT NULL DEFAULT 0 CHECK (complaints >= 0)
);
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, course TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  schedule TEXT NOT NULL DEFAULT '', room TEXT NOT NULL DEFAULT '',
  size INTEGER NOT NULL DEFAULT 0 CHECK (size >= 0),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  CHECK (size <= capacity)
);
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
  class_id TEXT NOT NULL REFERENCES classes(id),
  paid INTEGER NOT NULL DEFAULT 0 CHECK (paid >= 0),
  fee INTEGER NOT NULL CHECK (fee >= 0),
  enrolled TEXT NOT NULL,
  CHECK (paid <= fee)
);
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
  interest TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new','consulted','trial','enrolled')),
  owner TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, level TEXT NOT NULL, skill TEXT NOT NULL, type TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'center', date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','pending','published')),
  downloads INTEGER NOT NULL DEFAULT 0 CHECK (downloads >= 0), size TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES teachers(id),
  date TEXT NOT NULL, observer TEXT NOT NULL DEFAULT '',
  score REAL NOT NULL CHECK (score BETWEEN 1 AND 5), note TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY, date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')), cat TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0), note TEXT NOT NULL DEFAULT '', method TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, class_id TEXT NOT NULL REFERENCES classes(id),
  teacher_id TEXT NOT NULL REFERENCES teachers(id), date TEXT NOT NULL,
  present INTEGER NOT NULL CHECK (present >= 0), total INTEGER NOT NULL CHECK (total >= 0),
  CHECK (present <= total), UNIQUE (class_id, date)
);
CREATE TABLE IF NOT EXISTS payrolls (
  teacher_id TEXT NOT NULL REFERENCES teachers(id), month TEXT NOT NULL,
  PRIMARY KEY (teacher_id, month)
);
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY, class_id TEXT NOT NULL REFERENCES classes(id),
  title TEXT NOT NULL, due TEXT NOT NULL, max_score REAL NOT NULL CHECK (max_score > 0), created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES assignments(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  body TEXT NOT NULL, score REAL CHECK (score IS NULL OR score >= 0), feedback TEXT NOT NULL DEFAULT '',
  UNIQUE (assignment_id, student_id)
);
CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT NOT NULL, module TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('none','view','edit')),
  PRIMARY KEY (role, module)
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL,
  actor_id INTEGER, actor_email TEXT, action TEXT NOT NULL, target TEXT, detail TEXT
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_obs_teacher ON observations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_assign_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_sub_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(id DESC);
`

const USERS_DDL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (${roleList})),
  pass_hash TEXT NOT NULL,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  must_change INTEGER NOT NULL DEFAULT 0 CHECK (must_change IN (0,1)),
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_login TEXT
);
CREATE UNIQUE INDEX users_student_uq ON users(student_id) WHERE student_id IS NOT NULL;
CREATE UNIQUE INDEX users_teacher_uq ON users(teacher_id) WHERE teacher_id IS NOT NULL;
`

export const kvGet = (db, k) => db.prepare('SELECT value FROM kv WHERE key = ?').get(k)?.value
export const kvSet = (db, k, v) => db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, v)

const cell = (row, sp) => sp.cols.map(([k]) => row[k] ?? null)
const keyOf = (row, sp) => sp.pk.map((k) => row[k]).join('|')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export function loadState(db) {
  const s = {}
  for (const [name, sp] of Object.entries(SPEC)) {
    s[name] = db.prepare(`SELECT * FROM ${sp.t} ORDER BY ${sp.order}`).all().map((r) => Object.fromEntries(sp.cols.map(([k, c]) => [k, r[c]])))
  }
  s.perms = {}
  for (const r of db.prepare('SELECT role, module, level FROM role_permissions').all()) (s.perms[r.role] ||= {})[r.module] = r.level
  return s
}

const EMPTY = () => ({ ...Object.fromEntries(Object.keys(SPEC).map((k) => [k, []])), perms: {} })

// Ghi lại phần thay đổi (before -> next) trong MỘT transaction: xoá, rồi thêm/sửa từng dòng khác biệt.
export function saveState(db, before, next) {
  db.exec('BEGIN IMMEDIATE')
  try {
    db.exec('PRAGMA defer_foreign_keys = ON')
    for (const [name, sp] of Object.entries(SPEC)) {
      if (before[name] === next[name]) continue // reducer không đụng tới collection này
      const old = new Map(before[name].map((r) => [keyOf(r, sp), r]))
      const nxt = new Map(next[name].map((r) => [keyOf(r, sp), r]))
      const whereSql = sp.pk.map((k) => `${sp.cols.find((c) => c[0] === k)[1]} = ?`).join(' AND ')
      const del = db.prepare(`DELETE FROM ${sp.t} WHERE ${whereSql}`)
      for (const [k, r] of old) if (!nxt.has(k)) del.run(...sp.pk.map((c) => r[c]))
      const names = sp.cols.map((c) => c[1])
      const pkCols = sp.pk.map((k) => sp.cols.find((c) => c[0] === k)[1])
      const upd = names.filter((c) => !pkCols.includes(c)).map((c) => `${c} = excluded.${c}`)
      const up = db.prepare(
        `INSERT INTO ${sp.t} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')}) ON CONFLICT(${pkCols.join(', ')}) ${upd.length ? 'DO UPDATE SET ' + upd.join(', ') : 'DO NOTHING'}`
      )
      for (const [k, r] of nxt) if (!old.has(k) || !same(cell(old.get(k), sp), cell(r, sp))) up.run(...cell(r, sp))
    }
    if (before.perms !== next.perms) {
      db.exec('DELETE FROM role_permissions')
      const ins = db.prepare('INSERT INTO role_permissions (role, module, level) VALUES (?, ?, ?)')
      for (const [role, mods] of Object.entries(next.perms)) for (const [m, lv] of Object.entries(mods)) ins.run(role, m, lv)
    }
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

export const permLevel = (db, role, mod) => db.prepare('SELECT level FROM role_permissions WHERE role = ? AND module = ?').get(role, mod)?.level || 'none'

export function openDb(file) {
  const db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec(SCHEMA)

  // 1) Nạp dữ liệu lần đầu: từ bản JSON cũ (nếu có) hoặc dữ liệu mẫu
  if (!kvGet(db, 'relational_v1')) {
    const legacy = kvGet(db, 'state')
    const source = legacy ? { ...initialState(), ...JSON.parse(legacy) } : initialState()
    saveState(db, EMPTY(), source)
    kvSet(db, 'relational_v1', new Date().toISOString())
    db.prepare('DELETE FROM kv WHERE key = ?').run('state')
  }
  // 2) Module mới (thêm sau này) tự có quyền mặc định, không ghi đè quyền đã chỉnh
  const ins = db.prepare('INSERT OR IGNORE INTO role_permissions (role, module, level) VALUES (?, ?, ?)')
  for (const [role, mods] of Object.entries(DEFAULT_PERMS)) for (const [m, lv] of Object.entries(mods)) ins.run(role, m, lv)

  // 3) Bảng users: nâng cấp từ cấu trúc cũ (khoá chính là email) nếu cần
  const cols = db.prepare("PRAGMA table_info('users')").all().map((c) => c.name)
  if (cols.length && !cols.includes('id')) {
    db.exec('ALTER TABLE users RENAME TO users_old')
    db.exec(USERS_DDL)
    db.exec(`INSERT INTO users (email, name, role, pass_hash, student_id, teacher_id, created_at)
             SELECT email, name, role, pass_hash, student_id, teacher_id, '${new Date().toISOString()}' FROM users_old`)
    db.exec('DROP TABLE users_old')
  } else if (!cols.length) {
    db.exec(USERS_DDL)
  }
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) {
    const insU = db.prepare('INSERT INTO users (email, name, role, pass_hash, student_id, teacher_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    for (const u of SEED_USERS) insU.run(u.email, u.name, u.role, hashPw(u.password), u.studentId ?? null, u.teacherId ?? null, new Date().toISOString())
  }
  return db
}
