// Logic nghiệp vụ dùng chung: client (chế độ Guest/offline) và server (chế độ thật) cùng chạy các reducer này.
// Reducer: (state, ...args) => phần state thay đổi. Ném Error nếu dữ liệu không hợp lệ.
import * as seed from './data.js'

export const COLLECTIONS = ['materials', 'teachers', 'observations', 'classes', 'students', 'leads', 'transactions', 'sessions', 'payrolls', 'assignments', 'submissions']

export const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
const today = () => new Date().toISOString().slice(0, 10)
const bad = (m) => {
  throw new Error(m)
}
const money = (v, label = 'Số tiền') => {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) bad(`${label} không hợp lệ`)
  return Math.round(n)
}
const text = (v, label, max = 500) => {
  if (typeof v !== 'string' || !v.trim()) bad(`${label} không được để trống`)
  return v.trim().slice(0, max)
}

export function initialState() {
  return {
    perms: structuredClone(seed.DEFAULT_PERMS),
    materials: structuredClone(seed.materials),
    teachers: structuredClone(seed.teachers),
    observations: structuredClone(seed.observations),
    classes: structuredClone(seed.classes),
    students: structuredClone(seed.students),
    leads: structuredClone(seed.leads),
    transactions: structuredClone(seed.transactions),
    sessions: structuredClone(seed.sessions),
    payrolls: [],
    assignments: structuredClone(seed.assignments),
    submissions: structuredClone(seed.submissions),
  }
}

// action -> quyền tối thiểu cần có (server kiểm tra)
export const ACTIONS = {
  resetDemo: { mod: 'permissions', level: 'edit' },
  setPerm: { mod: 'permissions', level: 'edit' },
  addMaterial: { mod: 'materials', level: 'edit' },
  setMaterialStatus: { mod: 'materials', level: 'edit' },
  bumpDownload: { mod: 'materials', level: 'view' },
  addObservation: { mod: 'teachers', level: 'edit' },
  addLead: { mod: 'admissions', level: 'edit' },
  moveLead: { mod: 'admissions', level: 'edit' },
  enroll: { mod: 'admissions', level: 'edit' },
  payTuition: { mod: 'students', level: 'edit' },
  addTransaction: { mod: 'finance', level: 'edit' },
  removeTransaction: { mod: 'finance', level: 'edit' },
  payTeacher: { mod: 'finance', level: 'edit' },
  addSession: { mod: 'classes', level: 'edit' },
  addAssignment: { mod: 'assignments', level: 'edit' },
  gradeWork: { mod: 'assignments', level: 'edit' },
  submitWork: { mod: 'assignments', level: 'edit', studentSelf: true },
}

export const reducers = {
  resetDemo: () => initialState(),

  setPerm: (s, role, mod, lv) => {
    if (!s.perms[role] || !(mod in s.perms[role]) || !['none', 'view', 'edit'].includes(lv)) bad('Quyền không hợp lệ')
    if (role === 'admin' && (mod === 'permissions' || mod === 'users')) bad('Không thể thu hẹp quyền quản trị của Admin')
    return { perms: { ...s.perms, [role]: { ...s.perms[role], [mod]: lv } } }
  },

  addMaterial: (s, m) => {
    const title = text(m.title, 'Tiêu đề', 200)
    if (!seed.LEVELS.includes(m.level) || !seed.SKILLS.includes(m.skill) || !seed.MAT_TYPES.includes(m.type)) bad('Thông tin tài liệu không hợp lệ')
    if (!['draft', 'pending', 'published'].includes(m.status)) bad('Trạng thái không hợp lệ')
    return { materials: [{ id: uid('m'), downloads: 0, title, level: m.level, skill: m.skill, type: m.type, author: m.author, date: m.date || today(), status: m.status, size: m.size || '1.0 MB' }, ...s.materials] }
  },
  setMaterialStatus: (s, id, status) => {
    if (!['draft', 'pending', 'published'].includes(status)) bad('Trạng thái không hợp lệ')
    if (!s.materials.some((m) => m.id === id)) bad('Không tìm thấy tài liệu')
    return { materials: s.materials.map((m) => (m.id === id ? { ...m, status } : m)) }
  },
  bumpDownload: (s, id) => ({ materials: s.materials.map((m) => (m.id === id && m.status === 'published' ? { ...m, downloads: m.downloads + 1 } : m)) }),

  addObservation: (s, o) => {
    if (!s.teachers.some((t) => t.id === o.teacherId)) bad('Không tìm thấy giáo viên')
    const score = Number(o.score)
    if (!(score >= 1 && score <= 5)) bad('Điểm dự giờ phải từ 1 đến 5')
    return { observations: [{ id: uid('o'), teacherId: o.teacherId, date: o.date || today(), observer: String(o.observer || '').slice(0, 80), score, note: text(o.note, 'Nhận xét', 1000) }, ...s.observations] }
  },

  addLead: (s, l) => ({
    leads: [{ id: uid('l'), stage: 'new', name: text(l.name, 'Họ tên', 100), phone: String(l.phone || '').slice(0, 20), interest: String(l.interest || '').slice(0, 40), source: String(l.source || '').slice(0, 40), owner: String(l.owner || '').slice(0, 40) }, ...s.leads],
  }),
  moveLead: (s, id, stage) => {
    if (!seed.LEAD_STAGES.some((x) => x.key === stage)) bad('Giai đoạn không hợp lệ')
    return { leads: s.leads.map((l) => (l.id === id ? { ...l, stage } : l)) }
  },

  // Ghi danh: tạo học viên + phiếu thu + cập nhật lead + sĩ số lớp
  enroll: (s, { leadId, name, phone, classId, fee, paid, method }) => {
    const cls = s.classes.find((c) => c.id === classId)
    if (!cls) bad('Chưa chọn lớp')
    if (cls.size >= cls.capacity) bad('Lớp đã đầy')
    const course = seed.courses.find((c) => c.name === cls.course)
    const f = money(fee, 'Học phí')
    if (course && (f > course.fee || f < course.fee * 0.8)) bad('Học phí sau ưu đãi không hợp lệ (tối đa ưu đãi 20%)')
    const p = Math.round(Number(paid))
    if (!Number.isFinite(p) || p < 0 || p > f) bad('Số tiền thu không hợp lệ')
    if (!seed.PAY_METHODS.includes(method)) bad('Hình thức thanh toán không hợp lệ')
    const studentName = text(name, 'Họ tên', 100)
    return {
      students: [{ id: uid('s'), name: studentName, phone: String(phone || '').slice(0, 20), classId, paid: p, fee: f, enrolled: today() }, ...s.students],
      classes: s.classes.map((c) => (c.id === classId ? { ...c, size: c.size + 1 } : c)),
      leads: leadId ? s.leads.map((l) => (l.id === leadId ? { ...l, stage: 'enrolled' } : l)) : s.leads,
      transactions: p > 0 ? [{ id: uid('x'), date: today(), type: 'income', cat: 'Học phí', amount: p, note: `${studentName} – ${cls.course}`, method }, ...s.transactions] : s.transactions,
    }
  },
  payTuition: (s, studentId, amount, method) => {
    const st = s.students.find((x) => x.id === studentId)
    if (!st) bad('Không tìm thấy học viên')
    const a = money(amount)
    if (a > st.fee - st.paid) bad('Số tiền vượt quá công nợ')
    if (!seed.PAY_METHODS.includes(method)) bad('Hình thức thanh toán không hợp lệ')
    return {
      students: s.students.map((x) => (x.id === studentId ? { ...x, paid: x.paid + a } : x)),
      transactions: [{ id: uid('x'), date: today(), type: 'income', cat: 'Học phí', amount: a, note: `${st.name} – thu thêm`, method }, ...s.transactions],
    }
  },

  addTransaction: (s, t) => {
    if (!['income', 'expense'].includes(t.type)) bad('Loại giao dịch không hợp lệ')
    if (!(t.type === 'income' ? seed.INCOME_CATS : seed.EXPENSE_CATS).includes(t.cat)) bad('Hạng mục không hợp lệ')
    if (!seed.PAY_METHODS.includes(t.method)) bad('Hình thức thanh toán không hợp lệ')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date || '')) bad('Ngày không hợp lệ')
    return { transactions: [{ id: uid('x'), date: t.date, type: t.type, cat: t.cat, amount: money(t.amount), note: String(t.note || '').slice(0, 200), method: t.method }, ...s.transactions] }
  },
  removeTransaction: (s, id) => ({ transactions: s.transactions.filter((t) => t.id !== id) }),

  // Chi lương: số tiền được tính lại từ số buổi đã điểm danh × đơn giá (server không tin giá trị từ client)
  payTeacher: (s, teacherId, month) => {
    const t = s.teachers.find((x) => x.id === teacherId)
    if (!t) bad('Không tìm thấy giáo viên')
    if (!/^\d{4}-\d{2}$/.test(month || '')) bad('Tháng không hợp lệ')
    if (s.payrolls.some((p) => p.teacherId === teacherId && p.month === month)) bad('Đã chi lương tháng này')
    const count = s.sessions.filter((x) => x.teacherId === teacherId && x.date.startsWith(month)).length
    const amount = count * (seed.TEACHER_RATES[teacherId] || 0)
    if (amount <= 0) bad('Không có buổi dạy để chi lương')
    return {
      payrolls: [...s.payrolls, { teacherId, month }],
      transactions: [{ id: uid('x'), date: today(), type: 'expense', cat: 'Lương giáo viên', amount, note: `Lương ${t.name} – ${month}`, method: 'Chuyển khoản' }, ...s.transactions],
    }
  },

  addSession: (s, x) => {
    const cls = s.classes.find((c) => c.id === x.classId)
    if (!cls) bad('Không tìm thấy lớp')
    const total = Math.round(Number(x.total)), present = Math.round(Number(x.present))
    if (!(total >= 0 && present >= 0 && present <= total)) bad('Số liệu điểm danh không hợp lệ')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(x.date || '')) bad('Ngày không hợp lệ')
    if (s.sessions.some((y) => y.classId === x.classId && y.date === x.date)) bad('Lớp đã điểm danh ngày này')
    return { sessions: [{ id: uid('ss'), classId: x.classId, teacherId: cls.teacherId, date: x.date, present, total }, ...s.sessions] }
  },

  addAssignment: (s, a) => {
    if (!s.classes.some((c) => c.id === a.classId)) bad('Không tìm thấy lớp')
    const max = Number(a.max)
    if (!(max >= 1 && max <= 1000)) bad('Thang điểm không hợp lệ')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.due || '')) bad('Hạn nộp không hợp lệ')
    return { assignments: [{ id: uid('a'), created: today(), classId: a.classId, title: text(a.title, 'Tiêu đề', 200), due: a.due, max }, ...s.assignments] }
  },
  submitWork: (s, assignmentId, studentId, body) => {
    const a = s.assignments.find((x) => x.id === assignmentId)
    const st = s.students.find((x) => x.id === studentId)
    if (!a || !st) bad('Không tìm thấy bài tập hoặc học viên')
    if (st.classId !== a.classId) bad('Học viên không thuộc lớp này')
    const old = s.submissions.find((b) => b.assignmentId === assignmentId && b.studentId === studentId)
    if (old && old.score !== null) bad('Bài đã được chấm, không thể sửa')
    const content = text(body, 'Bài làm', 5000)
    return {
      submissions: old
        ? s.submissions.map((b) => (b === old ? { ...b, text: content } : b))
        : [{ id: uid('b'), assignmentId, studentId, text: content, score: null, feedback: '' }, ...s.submissions],
    }
  },
  gradeWork: (s, id, score, feedback) => {
    const b = s.submissions.find((x) => x.id === id)
    if (!b) bad('Không tìm thấy bài nộp')
    const a = s.assignments.find((x) => x.id === b.assignmentId)
    const sc = Number(score)
    if (!Number.isFinite(sc) || sc < 0 || sc > a.max) bad(`Điểm phải từ 0 đến ${a.max}`)
    return { submissions: s.submissions.map((x) => (x.id === id ? { ...x, score: sc, feedback: String(feedback || '').slice(0, 1000) } : x)) }
  },
}
