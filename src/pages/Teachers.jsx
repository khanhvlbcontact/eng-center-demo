import { useState } from 'react'
import { useStore } from '../store'
import { teacherScore, withLiveStats } from '../data'
import { PageHead, Modal, Field, Badge, Progress, ReadOnlyNote } from '../components/ui'
import Icon from '../components/icons'

const grade = (sc) =>
  sc >= 85
    ? { l: 'Xuất sắc', t: 'green' }
    : sc >= 75
    ? { l: 'Tốt', t: 'blue' }
    : sc >= 65
    ? { l: 'Đạt', t: 'orange' }
    : { l: 'Cần cải thiện', t: 'red' }

const METRICS = [
  ['Học viên đánh giá', (t) => t.studentRating.toFixed(1) + '/5', (t) => (t.studentRating / 5) * 100],
  ['Chuyên cần', (t) => t.attendance + '%', (t) => t.attendance, 'attendance'],
  ['Đúng giờ', (t) => t.onTime + '%', (t) => t.onTime],
  ['Tăng điểm TB', (t) => '+' + t.scoreGain + ' band', (t) => Math.min(t.scoreGain, 1) * 100],
  ['Bài tập đạt (≥60%)', (t) => t.passRate + '%', (t) => t.passRate, 'passRate'],
  ['Dự giờ', (t) => t.observation.toFixed(1) + '/5', (t) => (t.observation / 5) * 100],
]

export default function Teachers() {
  const s = useStore()
  const edit = s.canEdit('teachers')
  // Giáo viên chỉ xem chính mình (demo: Nguyễn Minh Anh)
  const ctx = {
    sessions: s.sessions,
    classes: s.classes,
    assignments: s.assignments,
    submissions: s.submissions,
  }
  const list = (s.user.role === 'teacher' ? s.teachers.filter((t) => t.id === s.meTeacherId) : s.teachers)
    .map((t) => withLiveStats(t, ctx))
    .map((t) => ({ ...t, score: teacherScore(t) }))
    .sort((a, b) => b.score - a.score)
  const [sel, setSel] = useState(null)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ score: 4, note: '' })
  const t = sel && list.find((x) => x.id === sel)

  const save = () => {
    if (!f.note.trim()) return s.notify('Vui lòng nhập nhận xét')
    s.addObservation({
      teacherId: sel,
      date: new Date().toISOString().slice(0, 10),
      observer: s.user.name,
      score: Number(f.score),
      note: f.note,
    })
    setOpen(false)
    setF({ score: 4, note: '' })
    s.notify('Đã lưu phiếu dự giờ')
  }

  return (
    <>
      <PageHead
        title="Chất lượng giáo viên"
        sub="Điểm tổng hợp 100: đánh giá HV 25 · tăng điểm 20 · chuyên cần 15 · đạt mục tiêu 15 · dự giờ 15 · đúng giờ 10 − khiếu nại"
      />
      <ReadOnlyNote show={!edit} />
      <div className="split">
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Giáo viên</th>
                <th>Lớp</th>
                <th>Điểm</th>
                <th>Xếp loại</th>
              </tr>
            </thead>
            <tbody>
              {list.map((x, i) => (
                <tr key={x.id} className={'click' + (sel === x.id ? ' sel' : '')} onClick={() => setSel(x.id)}>
                  <td>{i + 1}</td>
                  <td>
                    <b>{x.name}</b>
                    <br />
                    <small className="muted">{x.cert}</small>
                  </td>
                  <td>{x.classes}</td>
                  <td style={{ minWidth: 120 }}>
                    <div className="class-capacity-text">
                      <b>{x.score}</b>
                    </div>
                    <Progress value={x.score} tone={grade(x.score).t} />
                  </td>
                  <td>
                    <Badge tone={grade(x.score).t}>{grade(x.score).l}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          {!t ? (
            <div className="empty small">Chọn một giáo viên để xem chi tiết.</div>
          ) : (
            <>
              <div className="row-between">
                <h3>{t.name}</h3>
                <Badge tone={grade(t.score).t}>{t.score} điểm</Badge>
              </div>
              {METRICS.map(([label, val, pct, liveKey]) => (
                <div key={label} className="metric">
                  <div className="row-between">
                    <span>
                      {label}{' '}
                      {liveKey && t.live[liveKey] && (
                        <Badge tone="green">trực tiếp · {t.live[liveKey]}</Badge>
                      )}
                    </span>
                    <b>{val(t)}</b>
                  </div>
                  <Progress value={pct(t)} />
                </div>
              ))}
              <div className="row-between" style={{ marginTop: 8 }}>
                <span>Khiếu nại</span>
                <b>{t.complaints}</b>
              </div>
              <hr />
              <div className="row-between">
                <h4>Phiếu dự giờ</h4>
                {edit && (
                  <button className="btn small primary" onClick={() => setOpen(true)}>
                    <Icon name="plus" size={13} />
                    <span>Thêm</span>
                  </button>
                )}
              </div>
              {s.observations
                .filter((o) => o.teacherId === t.id)
                .map((o) => (
                  <div key={o.id} className="obs">
                    <div className="row-between">
                      <small className="muted">
                        {o.date} · {o.observer}
                      </small>
                      <Badge tone={o.score >= 4 ? 'green' : 'orange'}>{o.score}/5</Badge>
                    </div>
                    <p style={{ margin: '6px 0 0' }}>{o.note}</p>
                  </div>
                ))}
              {!s.observations.some((o) => o.teacherId === t.id) && (
                <p className="muted">Chưa có phiếu dự giờ.</p>
              )}
            </>
          )}
        </div>
      </div>

      {open && (
        <Modal title={`Phiếu dự giờ – ${t.name}`} onClose={() => setOpen(false)}>
          <Field label={`Điểm (${f.score}/5)`}>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={f.score}
              onChange={(e) => setF({ ...f, score: e.target.value })}
            />
          </Field>
          <Field label="Nhận xét">
            <textarea rows="4" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          </Field>
          <div className="modal-foot">
            <button className="btn primary" onClick={save}>
              Lưu phiếu
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
