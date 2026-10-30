import { useStore } from '../store'
import { fmtShort, teacherScore, withLiveStats, ROLES } from '../data'
import { PageHead, Stat, BarChart } from '../components/ui'
import Icon from '../components/icons'

export function monthlyData(transactions) {
  const months = {}
  transactions.forEach((t) => {
    const k = t.date.slice(0, 7)
    months[k] = months[k] || { label: k.slice(5) + '/' + k.slice(2, 4), income: 0, expense: 0 }
    months[k][t.type] += t.amount
  })
  return Object.keys(months)
    .sort()
    .map((k) => months[k])
}

export default function Dashboard() {
  const s = useStore()
  const role = s.user.role
  const income = s.transactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const expense = s.transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const debt = s.students.reduce((a, x) => a + (x.fee - x.paid), 0)
  const avgScore = Math.round(
    s.teachers.reduce((a, t) => a + teacherScore(withLiveStats(t, s)), 0) / (s.teachers.length || 1)
  )
  const pending = s.materials.filter((m) => m.status === 'pending').length
  const newLeads = s.leads.filter((l) => l.stage === 'new').length
  const showFinance = s.can('finance')

  return (
    <div className="page-wrapper">
      <PageHead
        title="Bảng điều khiển tổng quan"
        sub={`Xin chào ${s.user.name} · Phân hệ vai trò: ${ROLES[role].label}`}
      />

      {/* KPI Cards Grid */}
      <div className="grid stats">
        <Stat
          label="Học viên đang học"
          value={s.students.length}
          hint={`${s.classes.length} lớp học đang mở`}
          icon="students"
          tone="blue"
        />
        <Stat
          label="Lead mới cần tư vấn"
          value={newLeads}
          hint="Trạng thái tiếp nhận"
          tone="orange"
          icon="admissions"
        />
        {s.can('materials') && (
          <Stat
            label="Tài liệu chờ duyệt"
            value={pending}
            hint={`${s.materials.length} tài liệu trong kho`}
            tone="purple"
            icon="materials"
          />
        )}
        {s.can('teachers') && (
          <Stat
            label="Chất lượng giáo viên TB"
            value={avgScore + '/100'}
            hint={`${s.teachers.length} giáo viên phụ trách`}
            tone="green"
            icon="teachers"
          />
        )}
        {showFinance && (
          <Stat
            label="Tổng doanh thu"
            value={fmtShort(income)}
            hint="Tất cả các kỳ"
            tone="green"
            icon="finance"
          />
        )}
        {showFinance && (
          <Stat
            label="Tổng chi phí"
            value={fmtShort(expense)}
            hint={'Lãi ròng: ' + fmtShort(income - expense)}
            tone="red"
            icon="wallet"
          />
        )}
        {showFinance && (
          <Stat
            label="Công nợ học phí"
            value={fmtShort(debt)}
            hint="Khoản cần thu"
            tone="orange"
            icon="receipt"
          />
        )}
      </div>

      {/* Finance Analytics Banner */}
      {showFinance && (
        <div className="surface-card">
          <div className="surface-card-header">
            <div className="card-title-group">
              <h3>Biểu đồ dòng tiền Thu – Chi theo tháng</h3>
              <p className="card-sub-info">Tổng hợp giao dịch từ học phí và các chi phí vận hành cơ sở</p>
            </div>
            <div className="chart-legend-box">
              <span className="legend-item">
                <i className="legend-swatch income-swatch" />
                <span>Thu vào</span>
              </span>
              <span className="legend-item">
                <i className="legend-swatch expense-swatch" />
                <span>Chi ra</span>
              </span>
            </div>
          </div>
          <BarChart data={monthlyData(s.transactions)} />
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid two">
        {s.can('classes') && (
          <div className="surface-card">
            <div className="surface-card-header">
              <div className="card-title-group">
                <h3>Sĩ số & Trạng thái lớp học</h3>
                <p className="card-sub-info">Tỷ lệ lấp đầy phòng học theo khoá</p>
              </div>
            </div>
            <div className="dashboard-class-list">
              {s.classes.map((c) => {
                const fillPct = Math.round((c.size / c.capacity) * 100)
                return (
                  <div key={c.id} className="dashboard-class-row">
                    <div className="class-identity">
                      <span className="class-code-tag">{c.code}</span>
                      <span className="class-course-name">{c.course}</span>
                    </div>
                    <div className="class-occupancy">
                      <div className="occupancy-numbers">
                        <span>{c.size} / {c.capacity}</span>
                        <span className="occupancy-pct">{fillPct}%</span>
                      </div>
                      <div className="mini-track">
                        <div
                          className={`mini-track-fill ${fillPct >= 100 ? 'full' : ''}`}
                          style={{ width: `${Math.min(100, fillPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="surface-card">
          <div className="surface-card-header">
            <div className="card-title-group">
              <h3>Kịch bản trải nghiệm nhanh</h3>
              <p className="card-sub-info">Các tác vụ tiêu biểu để kiểm tra luồng nghiệp vụ</p>
            </div>
          </div>
          <div className="workflow-scenario-list">
            <div className="workflow-scenario-item">
              <div className="scenario-number">1</div>
              <div className="scenario-text">
                <b>Đổi vai trò tức thì</b>
                <span>Sử dụng menu góc trên cùng bên phải để trải nghiệm góc nhìn của 6 vai trò khác nhau.</span>
              </div>
            </div>
            <div className="workflow-scenario-item">
              <div className="scenario-number">2</div>
              <div className="scenario-text">
                <b>Luồng Tuyển sinh & Ghi danh</b>
                <span>Vai trò <b>Thu ngân</b> → Tuyển sinh → bấm Ghi danh → tự động tạo học viên và kết chuyển sang phiếu thu.</span>
              </div>
            </div>
            <div className="workflow-scenario-item">
              <div className="scenario-number">3</div>
              <div className="scenario-text">
                <b>Điểm danh sinh Lương tự động</b>
                <span>Mục <b>Lớp học</b> → bấm Điểm danh buổi học → kết chuyển thẳng vào <b>Bảng lương giáo viên</b> ở mục Tài chính.</span>
              </div>
            </div>
            <div className="workflow-scenario-item">
              <div className="scenario-number">4</div>
              <div className="scenario-text">
                <b>Ma trận phân quyền linh hoạt</b>
                <span>Vai trò <b>Admin</b> → Phân quyền → chỉnh sửa quyền Xem/Sửa theo ma trận phân cấp.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
