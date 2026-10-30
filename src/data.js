// Dữ liệu mẫu cho bản demo – toàn bộ chạy ở client, lưu localStorage.

export const ROLES = {
  admin: { label: 'Quản trị hệ thống', desc: 'Toàn quyền, cấu hình phân quyền', color: '#7047eb' },
  manager: { label: 'Quản lý học thuật', desc: 'Duyệt tài liệu, theo dõi chất lượng giáo viên', color: '#0ea5e9' },
  sales: { label: 'Thu ngân / Tư vấn', desc: 'Tư vấn, ghi danh học viên mới, thu học phí', color: '#f59e0b' },
  accountant: { label: 'Kế toán', desc: 'Quản lý thu chi, công nợ, báo cáo', color: '#10b981' },
  teacher: { label: 'Giáo viên', desc: 'Tài liệu giảng dạy, lớp & đánh giá của mình', color: '#3b82f6' },
  student: { label: 'Học viên', desc: 'Cổng học viên: tài liệu, lịch học, học phí', color: '#ec4899' },
}

export const MODULES = [
  { key: 'dashboard', label: 'Tổng quan', icon: 'dashboard', group: 'Chung' },
  { key: 'materials', label: 'Tài liệu học tập', icon: 'materials', group: 'Học thuật (LMS/CMS)' },
  { key: 'classes', label: 'Lớp học', icon: 'classes', group: 'Học thuật (LMS/CMS)' },
  { key: 'assignments', label: 'Bài tập & chấm điểm', icon: 'assignments', group: 'Học thuật (LMS/CMS)' },
  { key: 'teachers', label: 'Chất lượng giáo viên', icon: 'teachers', group: 'Học thuật (LMS/CMS)' },
  { key: 'admissions', label: 'Tuyển sinh & Thu ngân', icon: 'admissions', group: 'Kinh doanh (ERP)' },
  { key: 'students', label: 'Học viên', icon: 'students', group: 'Kinh doanh (ERP)' },
  { key: 'finance', label: 'Tài chính – Thu chi', icon: 'finance', group: 'Tài chính' },
  { key: 'portal', label: 'Cổng học viên', icon: 'portal', group: 'Portal' },
  { key: 'permissions', label: 'Phân quyền', icon: 'permissions', group: 'Hệ thống' },
  { key: 'users', label: 'Người dùng & nhật ký', icon: 'users', group: 'Hệ thống' },
]

// quyền mặc định: role -> { module: 'none' | 'view' | 'edit' }
export const DEFAULT_PERMS = {
  admin: Object.fromEntries(MODULES.map((m) => [m.key, 'edit'])),
  manager: { assignments: 'edit', dashboard: 'view', materials: 'edit', classes: 'edit', teachers: 'edit', admissions: 'view', students: 'view', finance: 'none', portal: 'none', permissions: 'none', users: 'none' },
  sales: { assignments: 'none', dashboard: 'view', materials: 'view', classes: 'view', teachers: 'none', admissions: 'edit', students: 'edit', finance: 'none', portal: 'none', permissions: 'none', users: 'none' },
  accountant: { assignments: 'none', dashboard: 'view', materials: 'none', classes: 'none', teachers: 'none', admissions: 'view', students: 'view', finance: 'edit', portal: 'none', permissions: 'none', users: 'none' },
  teacher: { assignments: 'edit', dashboard: 'view', materials: 'edit', classes: 'view', teachers: 'view', admissions: 'none', students: 'none', finance: 'none', portal: 'none', permissions: 'none', users: 'none' },
  student: { assignments: 'view', dashboard: 'none', materials: 'view', classes: 'none', teachers: 'none', admissions: 'none', students: 'none', finance: 'none', portal: 'view', permissions: 'none', users: 'none' },
}

export const LEVELS = ['Starters', 'Movers', 'Flyers', 'KET', 'PET', 'IELTS 5.0', 'IELTS 6.5']
export const SKILLS = ['Listening', 'Speaking', 'Reading', 'Writing', 'Grammar', 'Vocabulary']
export const MAT_TYPES = ['PDF', 'Video', 'Audio', 'Slide', 'Bài tập']

export const teachers = [
  { id: 't1', name: 'Nguyễn Minh Anh', cert: 'IELTS 8.0 · CELTA', classes: 4, studentRating: 4.8, attendance: 97, onTime: 99, scoreGain: 0.9, passRate: 94, observation: 4.7, complaints: 0 },
  { id: 't2', name: 'Trần Quốc Bảo', cert: 'IELTS 7.5 · TESOL', classes: 5, studentRating: 4.5, attendance: 94, onTime: 92, scoreGain: 0.7, passRate: 88, observation: 4.2, complaints: 1 },
  { id: 't3', name: 'Sarah Johnson', cert: 'Native · CELTA', classes: 3, studentRating: 4.9, attendance: 98, onTime: 100, scoreGain: 1.0, passRate: 96, observation: 4.8, complaints: 0 },
  { id: 't4', name: 'Lê Thu Hà', cert: 'IELTS 7.0 · TKT', classes: 4, studentRating: 4.1, attendance: 90, onTime: 85, scoreGain: 0.5, passRate: 79, observation: 3.6, complaints: 3 },
  { id: 't5', name: 'David Miller', cert: 'Native · TESOL', classes: 3, studentRating: 4.6, attendance: 95, onTime: 96, scoreGain: 0.8, passRate: 91, observation: 4.4, complaints: 1 },
]

export const observations = [
  { id: 'o1', teacherId: 't4', date: '2026-10-14', observer: 'Quản lý học thuật', score: 3.4, note: 'Phân bổ thời gian chưa tốt, phần Speaking còn ít tương tác giữa học viên.' },
  { id: 'o2', teacherId: 't1', date: '2026-10-10', observer: 'Quản lý học thuật', score: 4.8, note: 'Giáo án rõ ràng, kiểm tra kiến thức đầu giờ hiệu quả.' },
  { id: 'o3', teacherId: 't2', date: '2026-10-08', observer: 'Quản lý học thuật', score: 4.1, note: 'Tốt về kỹ thuật chữa lỗi, cần cải thiện đúng giờ.' },
]

export const courses = [
  { id: 'c1', name: 'Starters', fee: 6400000, sessions: 32 },
  { id: 'c2', name: 'KET', fee: 7800000, sessions: 36 },
  { id: 'c3', name: 'PET', fee: 8600000, sessions: 36 },
  { id: 'c4', name: 'IELTS 5.0', fee: 12000000, sessions: 40 },
  { id: 'c5', name: 'IELTS 6.5', fee: 15500000, sessions: 48 },
]

export const classes = [
  { id: 'k1', code: 'IE65-A1', course: 'IELTS 6.5', teacherId: 't1', schedule: 'T3-T5 · 18:30', room: 'P.301', size: 12, capacity: 14 },
  { id: 'k2', code: 'IE50-B2', course: 'IELTS 5.0', teacherId: 't2', schedule: 'T2-T4 · 18:30', room: 'P.302', size: 14, capacity: 14 },
  { id: 'k3', code: 'PET-C1', course: 'PET', teacherId: 't3', schedule: 'T7-CN · 09:00', room: 'P.201', size: 10, capacity: 14 },
  { id: 'k4', code: 'KET-D3', course: 'KET', teacherId: 't4', schedule: 'T2-T4 · 17:30', room: 'P.203', size: 9, capacity: 14 },
  { id: 'k5', code: 'STA-E1', course: 'Starters', teacherId: 't5', schedule: 'T7-CN · 14:00', room: 'P.101', size: 11, capacity: 14 },
]

export const materials = [
  { id: 'm1', title: 'IELTS Writing Task 2 – Band 6.5+ Templates', level: 'IELTS 6.5', skill: 'Writing', type: 'PDF', author: 't1', date: '2026-10-02', status: 'published', downloads: 128, size: '2.4 MB' },
  { id: 'm2', title: 'Listening Practice Test 12 (Section 1-4)', level: 'IELTS 5.0', skill: 'Listening', type: 'Audio', author: 't2', date: '2026-10-05', status: 'published', downloads: 96, size: '38 MB' },
  { id: 'm3', title: 'PET Reading Part 3 – Strategy Slides', level: 'PET', skill: 'Reading', type: 'Slide', author: 't3', date: '2026-10-09', status: 'published', downloads: 54, size: '6.1 MB' },
  { id: 'm4', title: 'KET Vocabulary – Daily Life (Unit 5)', level: 'KET', skill: 'Vocabulary', type: 'Bài tập', author: 't4', date: '2026-10-12', status: 'pending', downloads: 0, size: '800 KB' },
  { id: 'm5', title: 'Starters Phonics Songs Playlist', level: 'Starters', skill: 'Speaking', type: 'Video', author: 't5', date: '2026-10-15', status: 'published', downloads: 77, size: '120 MB' },
  { id: 'm6', title: 'Conditional Sentences Workbook', level: 'PET', skill: 'Grammar', type: 'PDF', author: 't3', date: '2026-10-18', status: 'pending', downloads: 0, size: '1.2 MB' },
  { id: 'm7', title: 'IELTS Speaking Part 2 – Cue Cards Q4/2026', level: 'IELTS 6.5', skill: 'Speaking', type: 'PDF', author: 't1', date: '2026-10-20', status: 'draft', downloads: 0, size: '1.9 MB' },
]

export const students = [
  { id: 's1', name: 'Phạm Gia Hân', phone: '0912 345 678', classId: 'k1', paid: 15500000, fee: 15500000, enrolled: '2026-08-15' },
  { id: 's2', name: 'Võ Đức Minh', phone: '0903 222 111', classId: 'k2', paid: 6000000, fee: 12000000, enrolled: '2026-09-01' },
  { id: 's3', name: 'Đặng Khánh Linh', phone: '0987 654 321', classId: 'k3', paid: 8600000, fee: 8600000, enrolled: '2026-09-10' },
  { id: 's4', name: 'Bùi Thanh Tùng', phone: '0933 112 233', classId: 'k4', paid: 3900000, fee: 7800000, enrolled: '2026-09-20' },
  { id: 's5', name: 'Ngô Bảo Châu', phone: '0944 556 677', classId: 'k5', paid: 6400000, fee: 6400000, enrolled: '2026-10-03' },
]

export const leads = [
  { id: 'l1', name: 'Hoàng Mai Chi', phone: '0911 000 111', interest: 'IELTS 6.5', source: 'Facebook', stage: 'new', owner: 'Sales A' },
  { id: 'l2', name: 'Trịnh Văn Long', phone: '0922 333 444', interest: 'PET', source: 'Giới thiệu', stage: 'consulted', owner: 'Sales A' },
  { id: 'l3', name: 'Lý Thị Hoa', phone: '0933 555 666', interest: 'Starters', source: 'Website', stage: 'trial', owner: 'Sales B' },
  { id: 'l4', name: 'Đỗ Anh Khoa', phone: '0944 777 888', interest: 'IELTS 5.0', source: 'Zalo', stage: 'consulted', owner: 'Sales B' },
  { id: 'l5', name: 'Mai Phương Thảo', phone: '0955 999 000', interest: 'KET', source: 'Tờ rơi', stage: 'new', owner: 'Sales A' },
]

export const LEAD_STAGES = [
  { key: 'new', label: 'Mới' },
  { key: 'consulted', label: 'Đã tư vấn' },
  { key: 'trial', label: 'Học thử' },
  { key: 'enrolled', label: 'Đã đóng phí' },
]

export const INCOME_CATS = ['Học phí', 'Phí tài liệu', 'Phí thi thử', 'Khác']
export const EXPENSE_CATS = ['Lương giáo viên', 'Lương nhân viên', 'Thuê mặt bằng', 'Marketing', 'Điện nước', 'Học liệu', 'Thiết bị', 'Khác']

export const transactions = [
  { id: 'x1', date: '2026-10-01', type: 'income', cat: 'Học phí', amount: 15500000, note: 'Phạm Gia Hân – IELTS 6.5', method: 'Chuyển khoản' },
  { id: 'x2', date: '2026-10-01', type: 'expense', cat: 'Thuê mặt bằng', amount: 45000000, note: 'Tiền thuê tháng 10', method: 'Chuyển khoản' },
  { id: 'x3', date: '2026-10-03', type: 'income', cat: 'Học phí', amount: 6400000, note: 'Ngô Bảo Châu – Starters', method: 'Tiền mặt' },
  { id: 'x4', date: '2026-10-05', type: 'expense', cat: 'Marketing', amount: 12000000, note: 'Quảng cáo Facebook', method: 'Thẻ' },
  { id: 'x5', date: '2026-10-07', type: 'income', cat: 'Học phí', amount: 6000000, note: 'Võ Đức Minh – đợt 1', method: 'Chuyển khoản' },
  { id: 'x6', date: '2026-10-10', type: 'expense', cat: 'Điện nước', amount: 6800000, note: 'Điện nước tháng 9', method: 'Chuyển khoản' },
  { id: 'x7', date: '2026-10-12', type: 'income', cat: 'Phí tài liệu', amount: 1800000, note: 'Bộ sách Cambridge x6', method: 'Tiền mặt' },
  { id: 'x8', date: '2026-10-15', type: 'expense', cat: 'Lương giáo viên', amount: 78000000, note: 'Lương GV kỳ 1', method: 'Chuyển khoản' },
  { id: 'x9', date: '2026-10-18', type: 'income', cat: 'Học phí', amount: 3900000, note: 'Bùi Thanh Tùng – đợt 1', method: 'Tiền mặt' },
  { id: 'x10', date: '2026-10-22', type: 'expense', cat: 'Lương nhân viên', amount: 32000000, note: 'Lương lễ tân, tư vấn, kế toán', method: 'Chuyển khoản' },
  { id: 'x11', date: '2026-09-05', type: 'income', cat: 'Học phí', amount: 168000000, note: 'Tổng thu học phí tháng 9', method: 'Tổng hợp' },
  { id: 'x12', date: '2026-09-28', type: 'expense', cat: 'Lương giáo viên', amount: 74000000, note: 'Lương GV tháng 9', method: 'Chuyển khoản' },
  { id: 'x13', date: '2026-08-05', type: 'income', cat: 'Học phí', amount: 152000000, note: 'Tổng thu học phí tháng 8', method: 'Tổng hợp' },
  { id: 'x14', date: '2026-08-28', type: 'expense', cat: 'Lương giáo viên', amount: 70000000, note: 'Lương GV tháng 8', method: 'Chuyển khoản' },
]

export const fmtMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
export const fmtShort = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + ' tr' : new Intl.NumberFormat('vi-VN').format(n))

// Điểm tổng hợp chất lượng giáo viên (thang 100)
export function teacherScore(t) {
  const s =
    (t.studentRating / 5) * 25 +
    (t.attendance / 100) * 15 +
    (t.onTime / 100) * 10 +
    Math.min(t.scoreGain / 1, 1) * 20 +
    (t.passRate / 100) * 15 +
    (t.observation / 5) * 15 -
    t.complaints * 2
  return Math.max(0, Math.round(s))
}

// Đơn giá lương theo buổi dạy (₫/buổi)
export const TEACHER_RATES = { t1: 450000, t2: 380000, t3: 600000, t4: 330000, t5: 550000 }

// Buổi dạy đã điểm danh (seed cho tháng 10/2026)
export const sessions = [
  { id: 'ss1', classId: 'k1', teacherId: 't1', date: '2026-10-06', present: 12, total: 12 },
  { id: 'ss2', classId: 'k1', teacherId: 't1', date: '2026-10-08', present: 11, total: 12 },
  { id: 'ss3', classId: 'k1', teacherId: 't1', date: '2026-10-13', present: 12, total: 12 },
  { id: 'ss4', classId: 'k2', teacherId: 't2', date: '2026-10-05', present: 13, total: 14 },
  { id: 'ss5', classId: 'k2', teacherId: 't2', date: '2026-10-07', present: 14, total: 14 },
  { id: 'ss6', classId: 'k3', teacherId: 't3', date: '2026-10-10', present: 10, total: 10 },
  { id: 'ss7', classId: 'k3', teacherId: 't3', date: '2026-10-11', present: 9, total: 10 },
  { id: 'ss8', classId: 'k4', teacherId: 't4', date: '2026-10-05', present: 8, total: 9 },
  { id: 'ss9', classId: 'k5', teacherId: 't5', date: '2026-10-10', present: 11, total: 11 },
  { id: 'ss10', classId: 'k5', teacherId: 't5', date: '2026-10-11', present: 10, total: 11 },
]

export const assignments = [
  { id: 'a1', classId: 'k1', title: 'Writing Task 2: Technology & Education', due: '2026-11-02', max: 9, created: '2026-10-20' },
  { id: 'a2', classId: 'k1', title: 'Listening Section 3 – Note completion', due: '2026-10-25', max: 10, created: '2026-10-15' },
  { id: 'a3', classId: 'k2', title: 'Reading Passage 2 – Matching headings', due: '2026-11-01', max: 10, created: '2026-10-22' },
]

export const submissions = [
  { id: 'b1', assignmentId: 'a2', studentId: 's1', text: 'Đã làm xong, đáp án: 1.B 2.A 3.C ...', score: 8, feedback: 'Tốt, chú ý lỗi chính tả ở câu 7.' },
  { id: 'b2', assignmentId: 'a1', studentId: 's1', text: 'Nowadays, technology plays a vital role in education...', score: null, feedback: '' },
]

// Gắn chỉ số "sống" từ điểm danh + bài tập vào hồ sơ giáo viên (nếu có dữ liệu)
export function withLiveStats(t, { sessions, classes, assignments, submissions }) {
  const mine = sessions.filter((x) => x.teacherId === t.id)
  const total = mine.reduce((a, x) => a + x.total, 0)
  const live = {}
  const out = { ...t, live }
  if (total > 0) {
    out.attendance = Math.round((mine.reduce((a, x) => a + x.present, 0) / total) * 100)
    live.attendance = `${mine.length} buổi điểm danh`
  }
  const classIds = classes.filter((c) => c.teacherId === t.id).map((c) => c.id)
  const asg = assignments.filter((a) => classIds.includes(a.classId))
  const graded = submissions.filter((b) => b.score !== null && asg.some((a) => a.id === b.assignmentId))
  if (graded.length > 0) {
    const ok = graded.filter((b) => b.score / asg.find((a) => a.id === b.assignmentId).max >= 0.6).length
    out.passRate = Math.round((ok / graded.length) * 100)
    live.passRate = `${graded.length} bài đã chấm`
  }
  return out
}

export const PAY_METHODS = ['Tiền mặt', 'Chuyển khoản', 'Thẻ']
