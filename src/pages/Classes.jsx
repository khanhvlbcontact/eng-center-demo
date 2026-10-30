import { useState } from 'react'
import { useStore } from '../store'
import { PageHead, Progress, Modal, Badge, ReadOnlyNote } from '../components/ui'
import Icon from '../components/icons'

export default function Classes() {
  const s = useStore()
  const edit = s.canEdit('classes')
  const [att, setAtt] = useState(null) // lớp đang điểm danh
  const [absent, setAbsent] = useState({})
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const tn = (id) => s.teachers.find((t) => t.id === id)?.name
  const roster = att ? s.students.filter((x) => x.classId === att.id) : []
  const sessionsOf = (id) => s.sessions.filter((x) => x.classId === id)

  const open = (c) => {
    setAtt(c)
    setAbsent({})
  }
  const save = () => {
    if (!roster.length) return s.notify('Lớp chưa có học viên để điểm danh')
    const present = roster.filter((x) => !absent[x.id]).length
    s.addSession({ classId: att.id, teacherId: att.teacherId, date, present, total: roster.length })
    setAtt(null)
    s.notify('Đã lưu buổi học – tính vào lương giáo viên')
  }

  return (
    <>
      <PageHead
        title="Lớp học"
        sub="Danh sách lớp, lịch, sĩ số và điểm danh. Mỗi buổi điểm danh được tính tự động vào lương giáo viên."
      />
      <ReadOnlyNote show={!edit} />
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã lớp</th>
              <th>Khoá</th>
              <th>Giáo viên</th>
              <th>Lịch học</th>
              <th>Phòng</th>
              <th>Sĩ số</th>
              <th>Buổi đã dạy</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {s.classes.map((c) => {
              const ss = sessionsOf(c.id)
              const rate = ss.length
                ? Math.round(
                    (ss.reduce((a, x) => a + x.present, 0) / ss.reduce((a, x) => a + x.total, 0)) * 100
                  )
                : null
              return (
                <tr key={c.id}>
                  <td>
                    <b>{c.code}</b>
                  </td>
                  <td>{c.course}</td>
                  <td>{tn(c.teacherId)}</td>
                  <td>{c.schedule}</td>
                  <td>{c.room}</td>
                  <td style={{ minWidth: 140 }}>
                    <div className="class-capacity-text">
                      <span>{c.size} / {c.capacity}</span>
                      <small className="muted">{Math.round((c.size / c.capacity) * 100)}%</small>
                    </div>
                    <Progress value={(c.size / c.capacity) * 100} tone={c.size >= c.capacity ? 'red' : ''} />
                  </td>
                  <td>
                    {ss.length}{' '}
                    {rate !== null && (
                      <Badge tone={rate >= 90 ? 'green' : 'orange'}>{rate}% có mặt</Badge>
                    )}
                  </td>
                  <td>
                    {edit && (
                      <button className="btn small primary" onClick={() => open(c)}>
                        Điểm danh
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {att && (
        <Modal title={`Điểm danh – ${att.code}`} onClose={() => setAtt(null)} width={460}>
          <label className="field">
            <span>Ngày học</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div className="attendance-list">
            {roster.length ? (
              roster.map((x) => (
                <label key={x.id} className="row-between attendance-row">
                  <span>{x.name}</span>
                  <span className="attendance-check">
                    <input
                      type="checkbox"
                      checked={!absent[x.id]}
                      onChange={(e) => setAbsent({ ...absent, [x.id]: !e.target.checked })}
                    />
                    <span>Có mặt</span>
                  </span>
                </label>
              ))
            ) : (
              <p className="muted">Lớp chưa có học viên trong hệ thống (hãy ghi danh ở mục Tuyển sinh).</p>
            )}
          </div>
          <div className="modal-foot">
            <button className="btn primary" onClick={save}>
              Lưu buổi học
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
