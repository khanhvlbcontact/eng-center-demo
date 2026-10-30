import { useState } from 'react'
import { useStore } from '../store'
import { fmtMoney } from '../data'
import { PageHead, Modal, Field, Badge, Progress, ReadOnlyNote } from '../components/ui'
import Icon from '../components/icons'

export default function Students() {
  const s = useStore()
  const edit = s.canEdit('students')
  const [q, setQ] = useState('')
  const [pay, setPay] = useState(null)
  const [amt, setAmt] = useState(0)
  const [method, setMethod] = useState('Tiền mặt')
  const cls = (id) => s.classes.find((c) => c.id === id)?.code
  const list = s.students.filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()))

  const submit = () => {
    if (amt <= 0) return
    s.payTuition(pay.id, Number(amt), method)
    setPay(null)
    s.notify('Đã thu học phí & ghi sổ')
  }

  return (
    <>
      <PageHead title="Học viên" sub="Hồ sơ học viên và tình trạng học phí" />
      <ReadOnlyNote show={!edit} />
      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={15} className="search-icon" />
          <input placeholder="Tìm học viên…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>SĐT</th>
              <th>Lớp</th>
              <th>Ngày ghi danh</th>
              <th>Học phí</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((x) => {
              const left = x.fee - x.paid
              return (
                <tr key={x.id}>
                  <td>
                    <b>{x.name}</b>
                  </td>
                  <td>{x.phone}</td>
                  <td>{cls(x.classId)}</td>
                  <td>{x.enrolled}</td>
                  <td style={{ minWidth: 170 }}>
                    {left <= 0 ? (
                      <Badge tone="green">Đã đóng đủ</Badge>
                    ) : (
                      <>
                        <small>
                          Còn nợ <b>{fmtMoney(left)}</b>
                        </small>
                        <Progress value={(x.paid / x.fee) * 100} tone="orange" />
                      </>
                    )}
                  </td>
                  <td>
                    {edit && left > 0 && (
                      <button
                        className="btn small primary"
                        title="Thu tiền học phí"
                        onClick={() => {
                          setPay(x)
                          setAmt(left)
                        }}
                      >
                        <Icon name="wallet" size={12} />
                        <span className="btn-text-desktop">Thu tiền</span>
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {pay && (
        <Modal title={`Thu học phí – ${pay.name}`} onClose={() => setPay(null)} width={420}>
          <div className="note">
            Còn nợ: <b>{fmtMoney(pay.fee - pay.paid)}</b>
          </div>
          <Field label="Số tiền thu">
            <input
              type="number"
              min="0"
              max={pay.fee - pay.paid}
              value={amt}
              onChange={(e) => setAmt(Math.min(pay.fee - pay.paid, Number(e.target.value)))}
            />
          </Field>
          <Field label="Hình thức">
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {['Tiền mặt', 'Chuyển khoản', 'Thẻ'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <div className="modal-foot">
            <button className="btn primary" onClick={submit}>
              Xác nhận thu
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
