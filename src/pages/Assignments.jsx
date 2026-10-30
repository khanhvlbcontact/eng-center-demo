import { useState } from 'react'
import { useStore } from '../store'
import { PageHead, Modal, Field, Badge, Progress, ReadOnlyNote } from '../components/ui'
import Icon from '../components/icons'

export default function Assignments() {
  const s = useStore()
  return s.user.role === 'student' ? <StudentView /> : <StaffView />
}

function StudentView() {
  const s = useStore()
  const ME = s.meStudentId
  const me = s.students.find((x) => x.id === ME)
  const mine = s.assignments.filter((a) => a.classId === me.classId)
  const [work, setWork] = useState(null)
  const [text, setText] = useState('')
  const sub = (a) => s.submissions.find((b) => b.assignmentId === a.id && b.studentId === ME)
  const open = (a) => {
    setWork(a)
    setText(sub(a)?.text || '')
  }

  return (
    <>
      <PageHead
        title="Bài tập của tôi"
        sub={`Lớp ${s.classes.find((c) => c.id === me.classId)?.code} – nộp bài và xem điểm`}
      />
      <div className="grid cards">
        {mine.map((a) => {
          const b = sub(a)
          const graded = b && b.score !== null
          return (
            <div key={a.id} className="card mat">
              <b>{a.title}</b>
              <small className="muted">
                Hạn nộp: {a.due} · Thang điểm {a.max}
              </small>
              <div className="tags">
                {graded ? (
                  <Badge tone="green">
                    Đã chấm: {b.score}/{a.max}
                  </Badge>
                ) : b ? (
                  <Badge tone="blue">Đã nộp – chờ chấm</Badge>
                ) : (
                  <Badge tone="orange">Chưa nộp</Badge>
                )}
              </div>
              {graded && b.feedback && (
                <div className="obs">
                  <div className="feedback-line">
                    <Icon name="message" size={13} />
                    <span>{b.feedback}</span>
                  </div>
                </div>
              )}
              {!graded && (
                <div className="mat-actions">
                  <button className="btn small primary" onClick={() => open(a)}>
                    {b ? 'Sửa bài nộp' : 'Nộp bài'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {!mine.length && <div className="empty">Chưa có bài tập nào.</div>}
      </div>
      {work && (
        <Modal title={work.title} onClose={() => setWork(null)}>
          <Field label="Bài làm">
            <textarea rows="6" autoFocus value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div className="modal-foot">
            <button
              className="btn primary"
              onClick={() => {
                if (!text.trim()) return s.notify('Hãy nhập bài làm')
                s.submitWork(work.id, ME, text)
                setWork(null)
                s.notify('Đã nộp bài')
              }}
            >
              Nộp bài
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function StaffView() {
  const s = useStore()
  const TEACHER_ME = s.meTeacherId
  const edit = s.canEdit('assignments')
  const myClasses = s.user.role === 'teacher' ? s.classes.filter((c) => c.teacherId === TEACHER_ME) : s.classes
  const list = s.assignments.filter((a) => myClasses.some((c) => c.id === a.classId))
  const [sel, setSel] = useState(null)
  const [create, setCreate] = useState(false)
  const [f, setF] = useState({ classId: myClasses[0]?.id, title: '', due: '', max: 10 })
  const [grading, setGrading] = useState(null)
  const [g, setG] = useState({ score: 0, feedback: '' })

  const cls = (id) => s.classes.find((c) => c.id === id)
  const a = sel && s.assignments.find((x) => x.id === sel)
  const roster = a ? s.students.filter((x) => x.classId === a.classId) : []
  const subOf = (st) => s.submissions.find((b) => b.assignmentId === a.id && b.studentId === st.id)
  const stats = (x) => {
    const total = s.students.filter((st) => st.classId === x.classId).length
    const subs = s.submissions.filter((b) => b.assignmentId === x.id)
    return { total, sent: subs.length, graded: subs.filter((b) => b.score !== null).length }
  }

  const save = () => {
    if (!f.title.trim() || !f.due) return s.notify('Nhập tiêu đề và hạn nộp')
    s.addAssignment({ ...f, max: Number(f.max) })
    setCreate(false)
    setF({ ...f, title: '', due: '' })
    s.notify('Đã giao bài tập')
  }

  const grade = () => {
    const score = Math.min(Number(g.score), a.max)
    s.gradeWork(grading.id, score, g.feedback)
    setGrading(null)
    s.notify('Đã lưu điểm')
  }

  return (
    <>
      <PageHead title="Bài tập & chấm điểm" sub="Giao bài theo lớp, theo dõi tỷ lệ nộp và chấm điểm kèm nhận xét">
        {edit && (
          <button className="btn primary" onClick={() => setCreate(true)}>
            <Icon name="plus" size={14} />
            <span>Giao bài tập</span>
          </button>
        )}
      </PageHead>
      <ReadOnlyNote show={!edit} />
      <div className="split">
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bài tập</th>
                <th>Lớp</th>
                <th>Hạn</th>
                <th>Đã nộp</th>
                <th>Đã chấm</th>
              </tr>
            </thead>
            <tbody>
              {list.map((x) => {
                const t = stats(x)
                return (
                  <tr key={x.id} className={'click' + (sel === x.id ? ' sel' : '')} onClick={() => setSel(x.id)}>
                    <td>
                      <b>{x.title}</b>
                    </td>
                    <td>{cls(x.classId)?.code}</td>
                    <td>{x.due}</td>
                    <td style={{ minWidth: 110 }}>
                      {t.sent}/{t.total}
                      <Progress value={t.total ? (t.sent / t.total) * 100 : 0} />
                    </td>
                    <td>
                      {t.graded}/{t.sent}
                    </td>
                  </tr>
                )
              })}
              {!list.length && (
                <tr>
                  <td colSpan="5" className="muted">
                    Chưa có bài tập.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card">
          {!a ? (
            <div className="empty small">Chọn một bài tập để xem bài nộp.</div>
          ) : (
            <>
              <h3>{a.title}</h3>
              {roster.map((st) => {
                const b = subOf(st)
                return (
                  <div key={st.id} className="obs">
                    <div className="row-between">
                      <b>{st.name}</b>
                      {!b ? (
                        <Badge tone="orange">Chưa nộp</Badge>
                      ) : b.score === null ? (
                        <Badge tone="blue">Chờ chấm</Badge>
                      ) : (
                        <Badge tone="green">
                          {b.score}/{a.max}
                        </Badge>
                      )}
                    </div>
                    {b && <p>{b.text}</p>}
                    {b?.feedback && (
                      <small className="muted feedback-line">
                        <Icon name="message" size={12} />
                        <span>{b.feedback}</span>
                      </small>
                    )}
                    {edit && b && (
                      <div className="mat-actions">
                        <button
                          className="btn small"
                          onClick={() => {
                            setGrading(b)
                            setG({ score: b.score ?? 0, feedback: b.feedback })
                          }}
                        >
                          {b.score === null ? 'Chấm điểm' : 'Sửa điểm'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              {!roster.length && <p className="muted">Lớp chưa có học viên.</p>}
            </>
          )}
        </div>
      </div>

      {create && (
        <Modal title="Giao bài tập" onClose={() => setCreate(false)}>
          <Field label="Lớp">
            <select value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}>
              {myClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} – {c.course}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tiêu đề">
            <input autoFocus value={f.title} onChange={(e) => setForm ? setForm({ ...f, title: e.target.value }) : setF({ ...f, title: e.target.value })} />
          </Field>
          <div className="form-row">
            <Field label="Hạn nộp">
              <input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
            </Field>
            <Field label="Thang điểm">
              <input type="number" min="1" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} />
            </Field>
          </div>
          <div className="modal-foot">
            <button className="btn primary" onClick={save}>
              Giao bài
            </button>
          </div>
        </Modal>
      )}
      {grading && (
        <Modal title="Chấm điểm" onClose={() => setGrading(null)} width={440}>
          <Field label={`Điểm (tối đa ${a.max})`}>
            <input
              type="number"
              min="0"
              max={a.max}
              step="0.5"
              value={g.score}
              onChange={(e) => setG({ ...g, score: e.target.value })}
            />
          </Field>
          <Field label="Nhận xét">
            <textarea rows="3" value={g.feedback} onChange={(e) => setG({ ...g, feedback: e.target.value })} />
          </Field>
          <div className="modal-foot">
            <button className="btn primary" onClick={grade}>
              Lưu điểm
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
