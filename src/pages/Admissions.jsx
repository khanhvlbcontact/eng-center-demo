import { useState } from 'react'
import { useStore } from '../store'
import { LEAD_STAGES, courses, fmtMoney } from '../data'
import { PageHead, Modal, Field, Badge, ReadOnlyNote } from '../components/ui'
import Icon from '../components/icons'

export default function Admissions() {
  const s = useStore()
  const edit = s.canEdit('admissions')
  const [lead, setLead] = useState(false)
  const [lf, setLf] = useState({ name: '', phone: '', interest: courses[0].name, source: 'Facebook', owner: 'Sales A' })
  const [enr, setEnr] = useState(null) // lead đang ghi danh
  const [receipt, setReceipt] = useState(null)
  const [mobileTab, setMobileTab] = useState('all')

  const addLead = () => {
    if (!lf.name.trim()) return s.notify('Nhập tên khách hàng')
    s.addLead(lf)
    setLead(false)
    setLf({ ...lf, name: '', phone: '' })
    s.notify('Đã thêm lead mới')
  }

  const stagesToShow = LEAD_STAGES.filter((st) => mobileTab === 'all' || st.key === mobileTab)

  return (
    <>
      <PageHead
        title="Tuyển sinh & Thu ngân"
        sub="Từ lead → tư vấn → học thử → ghi danh & thu học phí"
      >
        {edit && (
          <button className="btn primary" onClick={() => setLead(true)}>
            <Icon name="plus" size={14} />
            <span>Thêm lead</span>
          </button>
        )}
        {edit && (
          <button className="btn" onClick={() => setEnr({})}>
            <Icon name="receipt" size={15} />
            <span>Ghi danh trực tiếp</span>
          </button>
        )}
      </PageHead>
      <ReadOnlyNote show={!edit} />

      {/* Mobile Kanban Tabs */}
      <div className="mobile-kanban-tabs mobile-only">
        <button
          className={mobileTab === 'all' ? 'active' : ''}
          onClick={() => setMobileTab('all')}
        >
          Tất cả ({s.leads.length})
        </button>
        {LEAD_STAGES.map((st) => (
          <button
            key={st.key}
            className={mobileTab === st.key ? 'active' : ''}
            onClick={() => setMobileTab(st.key)}
          >
            {st.label} ({s.leads.filter((l) => l.stage === st.key).length})
          </button>
        ))}
      </div>

      <div className={`kanban ${mobileTab !== 'all' ? 'mobile-single-col' : ''}`}>
        {stagesToShow.map((st) => (
          <div key={st.key} className="col">
            <div className="col-head">
              <span>{st.label}</span>
              <span className="count-pill">{s.leads.filter((l) => l.stage === st.key).length}</span>
            </div>
            {s.leads
              .filter((l) => l.stage === st.key)
              .map((l) => (
                <div key={l.id} className="lead">
                  <b>{l.name}</b>
                  <small className="muted">{l.phone}</small>
                  <div className="tags">
                    <Badge tone="blue">{l.interest}</Badge>
                    <Badge>{l.source}</Badge>
                  </div>
                  <small className="muted">Phụ trách: {l.owner}</small>
                  {edit && st.key !== 'enrolled' && (
                    <div className="mat-actions">
                      {st.key === 'new' && (
                        <button className="btn small" onClick={() => s.moveLead(l.id, 'consulted')}>
                          <span>Tư vấn</span>
                          <Icon name="arrow-right" size={12} />
                        </button>
                      )}
                      {st.key === 'consulted' && (
                        <button className="btn small" onClick={() => s.moveLead(l.id, 'trial')}>
                          <span>Học thử</span>
                          <Icon name="arrow-right" size={12} />
                        </button>
                      )}
                      <button className="btn small primary" onClick={() => setEnr(l)}>
                        Ghi danh
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>

      {lead && (
        <Modal title="Thêm lead" onClose={() => setLead(false)}>
          <Field label="Họ tên">
            <input autoFocus value={lf.name} onChange={(e) => setLf({ ...lf, name: e.target.value })} />
          </Field>
          <Field label="Điện thoại">
            <input value={lf.phone} onChange={(e) => setLf({ ...lf, phone: e.target.value })} />
          </Field>
          <div className="form-row">
            <Field label="Quan tâm khoá">
              <select value={lf.interest} onChange={(e) => setLf({ ...lf, interest: e.target.value })}>
                {courses.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Nguồn">
              <select value={lf.source} onChange={(e) => setLf({ ...lf, source: e.target.value })}>
                {['Facebook', 'Zalo', 'Website', 'Giới thiệu', 'Tờ rơi'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="modal-foot">
            <button className="btn primary" onClick={addLead}>
              Lưu
            </button>
          </div>
        </Modal>
      )}

      {enr && (
        <EnrollModal
          lead={enr}
          onClose={() => setEnr(null)}
          onDone={(r) => {
            setEnr(null)
            setReceipt(r)
          }}
        />
      )}

      {receipt && (
        <Modal title="Phiếu thu" onClose={() => setReceipt(null)} width={420}>
          <div className="receipt">
            <h4>BRIGHT ENGLISH CENTER</h4>
            <small className="muted">Phiếu thu học phí · {new Date().toLocaleDateString('vi-VN')}</small>
            <hr />
            <div className="row-between">
              <span>Học viên</span>
              <b>{receipt.name}</b>
            </div>
            <div className="row-between">
              <span>Lớp</span>
              <b>{receipt.cls}</b>
            </div>
            <div className="row-between">
              <span>Học phí</span>
              <b>{fmtMoney(receipt.fee)}</b>
            </div>
            <div className="row-between">
              <span>Đã thu</span>
              <b>{fmtMoney(receipt.paid)}</b>
            </div>
            <div className="row-between">
              <span>Còn lại</span>
              <b>{fmtMoney(receipt.fee - receipt.paid)}</b>
            </div>
            <div className="row-between">
              <span>Hình thức</span>
              <b>{receipt.method}</b>
            </div>
          </div>
          <div className="note ok">
            <Icon name="check-circle" size={16} />
            <span>Học viên đã được tạo, sĩ số lớp cập nhật và khoản thu đã ghi vào sổ thu chi.</span>
          </div>
          <div className="modal-foot">
            <button className="btn" onClick={() => window.print()}>
              <Icon name="printer" size={14} />
              <span>In</span>
            </button>
            <button className="btn primary" onClick={() => setReceipt(null)}>
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function EnrollModal({ lead, onClose, onDone }) {
  const s = useStore()
  const guess = courses.find((c) => c.name === lead.interest) || courses[0]
  const [f, setF] = useState({
    name: lead.name || '',
    phone: lead.phone || '',
    course: guess.id,
    classId: '',
    discount: 0,
    paid: guess.fee,
    method: 'Tiền mặt',
  })
  const course = courses.find((c) => c.id === f.course)
  const classOpts = s.classes.filter((c) => c.course === course.name)

  const finalFee = Math.max(0, course.fee - Number(f.discount || 0))

  const submit = () => {
    if (!f.name.trim()) return s.notify('Nhập họ tên học viên')
    if (!f.classId) return s.notify('Chọn lớp cho học viên')
    const cls = s.classes.find((c) => c.id === f.classId)
    if (cls && cls.size >= cls.capacity) return s.notify('Lớp đã đủ sĩ số')

    const student = s.enrollStudent({
      name: f.name,
      phone: f.phone,
      classId: f.classId,
      fee: finalFee,
      paid: Number(f.paid || 0),
      enrolled: new Date().toISOString().slice(0, 10),
      leadId: lead.id,
    })

    if (f.paid > 0) {
      s.addTransaction({
        date: new Date().toISOString().slice(0, 10),
        type: 'income',
        cat: 'Học phí',
        amount: Number(f.paid),
        note: `${f.name} – ${cls.code}`,
        method: f.method,
      })
    }

    onDone({
      name: f.name,
      cls: cls.code,
      fee: finalFee,
      paid: Number(f.paid || 0),
      method: f.method,
      id: student.id,
    })
  }

  return (
    <Modal title="Ghi danh & thu học phí" onClose={onClose} width={500}>
      <Field label="Họ tên">
        <input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </Field>
      <Field label="Số điện thoại">
        <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </Field>
      <div className="form-row">
        <Field label="Khoá học">
          <select
            value={f.course}
            onChange={(e) => {
              const c = courses.find((x) => x.id === e.target.value)
              setF({ ...f, course: e.target.value, paid: c.fee, classId: '' })
            }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({fmtMoney(c.fee)})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Xếp lớp">
          <select value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}>
            <option value="">-- Chọn lớp --</option>
            {classOpts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} ({c.schedule} · {c.size}/{c.capacity})
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="form-row">
        <Field label="Giảm giá (₫)">
          <input
            type="number"
            min="0"
            value={f.discount}
            onChange={(e) => setF({ ...f, discount: e.target.value, paid: Math.max(0, course.fee - Number(e.target.value || 0)) })}
          />
        </Field>
        <Field label="Thực thu đợt 1 (₫)">
          <input
            type="number"
            min="0"
            max={finalFee}
            value={f.paid}
            onChange={(e) => setF({ ...f, paid: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Hình thức thanh toán">
        <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
          {['Tiền mặt', 'Chuyển khoản', 'Thẻ'].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </Field>
      <div className="modal-foot">
        <button className="btn primary" onClick={submit}>
          Hoàn tất ghi danh & tạo phiếu thu
        </button>
      </div>
    </Modal>
  )
}
