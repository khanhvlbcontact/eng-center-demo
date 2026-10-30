import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { fmtMoney } from '../data'
import { PageHead, Stat, Progress } from '../components/ui'
import Icon from '../components/icons'

// Demo: học viên Phạm Gia Hân / lớp IE65-A1
export default function Portal() {
  const s = useStore()
  const me = s.students.find((x) => x.id === s.meStudentId) || s.students[0]
  const cls = s.classes.find((c) => c.id === me.classId)
  const teacher = s.teachers.find((t) => t.id === cls?.teacherId)
  const mats = s.materials.filter((m) => m.status === 'published' && m.level === cls?.course).slice(0, 4)

  return (
    <>
      <PageHead title={`Chào ${me.name}`} sub="Cổng học viên – lịch học, tài liệu và học phí của bạn" />
      <div className="grid stats">
        <Stat label="Lớp học" value={cls?.code} hint={cls?.course} tone="blue" icon="classes" />
        <Stat label="Lịch học" value={cls?.schedule} hint={cls?.room} icon="portal" />
        <Stat label="Giáo viên" value={teacher?.name} hint={teacher?.cert} tone="purple" icon="teachers" />
        <Stat
          label="Học phí còn lại"
          value={fmtMoney(me.fee - me.paid)}
          tone={me.fee > me.paid ? 'orange' : 'green'}
          icon="finance"
        />
      </div>
      <div className="grid two">
        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3>Tài liệu cho khoá của bạn</h3>
            <Link to="/materials" className="inline-link">
              <span>Xem tất cả</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>
          {mats.length ? (
            mats.map((m) => (
              <div key={m.id} className="row-between portal-mat-item">
                <div className="portal-mat-title">
                  <Icon name="file-pdf" size={15} />
                  <span>{m.title}</span>
                </div>
                <small className="badge">{m.skill}</small>
              </div>
            ))
          ) : (
            <p className="muted">Chưa có tài liệu.</p>
          )}
        </div>
        <div className="card">
          <h3>Tiến độ đóng học phí</h3>
          <div style={{ margin: '14px 0 8px' }}>
            <Progress value={(me.paid / me.fee) * 100} tone="green" />
          </div>
          <p className="muted">
            Đã hoàn thành <b>{fmtMoney(me.paid)}</b> trên tổng số <b>{fmtMoney(me.fee)}</b>
          </p>
        </div>
      </div>
    </>
  )
}
