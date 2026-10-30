import { useState } from 'react'
import { useStore } from '../store'
import { INCOME_CATS, EXPENSE_CATS, TEACHER_RATES, fmtMoney } from '../data'
import { PageHead, Stat, Modal, Field, Badge, BarChart, ReadOnlyNote } from '../components/ui'
import Icon from '../components/icons'
import { monthlyData } from './Dashboard'

function downloadCsv(name, rows) {
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
  const csv = String.fromCharCode(0xfeff) + rows.map((r) => r.map(esc).join(',')).join(String.fromCharCode(13, 10)) // BOM cho Excel
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default function Finance() {
  const s = useStore()
  const edit = s.canEdit('finance')
  const months = [...new Set(s.transactions.map((t) => t.date.slice(0, 7)))].sort().reverse()
  const [month, setMonth] = useState('')
  const [type, setType] = useState('')
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({
    type: 'expense',
    cat: EXPENSE_CATS[0],
    amount: '',
    note: '',
    method: 'Chuyển khoản',
    date: new Date().toISOString().slice(0, 10),
  })

  const list = s.transactions
    .filter((t) => (!month || t.date.startsWith(month)) && (!type || t.type === type))
    .sort((a, b) => b.date.localeCompare(a.date))
  const inc = list.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const exp = list.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const debtors = s.students.filter((x) => x.fee > x.paid)
  const byCat = Object.entries(
    list
      .filter((t) => t.type === 'expense')
      .reduce((m, t) => ({ ...m, [t.cat]: (m[t.cat] || 0) + t.amount }), {})
  ).sort((a, b) => b[1] - a[1])

  const payMonth = month || [...s.sessions.map((x) => x.date.slice(0, 7))].sort().pop() || '2026-10'
  const payroll = s.teachers.map((t) => {
    const count = s.sessions.filter((x) => x.teacherId === t.id && x.date.startsWith(payMonth)).length
    const rate = TEACHER_RATES[t.id] || 0
    return {
      id: t.id,
      name: t.name,
      count,
      rate,
      amount: count * rate,
      paid: s.payrolls.some((p) => p.teacherId === t.id && p.month === payMonth),
    }
  })

  const exportLedger = () => {
    downloadCsv(`so-thu-chi-${month || 'tat-ca'}.csv`, [
      ['Ngày', 'Loại', 'Hạng mục', 'Diễn giải', 'Hình thức', 'Số tiền'],
      ...list.map((t) => [
        t.date,
        t.type === 'income' ? 'Thu' : 'Chi',
        t.cat,
        t.note,
        t.method,
        t.type === 'income' ? t.amount : -t.amount,
      ]),
      ['', '', '', '', 'Chênh lệch', inc - exp],
    ])
    s.notify('Đã xuất sổ thu chi')
  }
  const exportPayroll = () => {
    downloadCsv(`bang-luong-${payMonth}.csv`, [
      ['Giáo viên', 'Số buổi', 'Đơn giá', 'Thực lĩnh', 'Trạng thái'],
      ...payroll.map((p) => [p.name, p.count, p.rate, p.amount, p.paid ? 'Đã chi' : 'Chưa chi']),
    ])
    s.notify('Đã xuất bảng lương')
  }

  const submit = () => {
    const amount = Number(f.amount)
    if (!amount || amount <= 0) return s.notify('Nhập số tiền hợp lệ')
    s.addTransaction({ ...f, amount })
    setOpen(false)
    setF({ ...f, amount: '', note: '' })
    s.notify('Đã ghi sổ')
  }
  const setT = (t) => setF({ ...f, type: t, cat: (t === 'income' ? INCOME_CATS : EXPENSE_CATS)[0] })

  return (
    <>
      <PageHead title="Tài chính – Thu chi" sub="Sổ thu chi, công nợ học phí và cơ cấu chi phí">
        <button className="btn" onClick={exportLedger} title="Xuất sổ thu chi (Excel)">
          <Icon name="download" size={13} />
          <span className="btn-text-desktop">Xuất sổ thu chi (Excel)</span>
          <span className="btn-text-mobile">Sổ thu chi</span>
        </button>
        <button className="btn" onClick={exportPayroll} title="Xuất bảng lương">
          <Icon name="download" size={13} />
          <span className="btn-text-desktop">Xuất bảng lương</span>
          <span className="btn-text-mobile">Bảng lương</span>
        </button>
        {edit && (
          <button className="btn primary" onClick={() => setOpen(true)} title="Ghi thu / chi">
            <Icon name="plus" size={14} />
            <span className="btn-text-desktop">Ghi thu / chi</span>
            <span className="btn-text-mobile">Thu / Chi</span>
          </button>
        )}
      </PageHead>
      <ReadOnlyNote show={!edit} />
      <div className="toolbar">
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Tất cả tháng</option>
          {months.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Thu & chi</option>
          <option value="income">Chỉ thu</option>
          <option value="expense">Chỉ chi</option>
        </select>
      </div>

      <div className="grid stats">
        <Stat label="Tổng thu" value={fmtMoney(inc)} tone="green" />
        <Stat label="Tổng chi" value={fmtMoney(exp)} tone="red" />
        <Stat label="Chênh lệch" value={fmtMoney(inc - exp)} tone={inc - exp >= 0 ? 'blue' : 'red'} />
        <Stat
          label="Công nợ học phí"
          value={fmtMoney(debtors.reduce((a, x) => a + x.fee - x.paid, 0))}
          hint={`${debtors.length} học viên`}
          tone="orange"
        />
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Thu – Chi theo tháng</h3>
          <BarChart data={monthlyData(s.transactions)} />
          <div className="legend">
            <i style={{ background: '#10b981' }} /> Thu <i style={{ background: '#f59e0b' }} /> Chi
          </div>
        </div>
        <div className="card">
          <h3>Cơ cấu chi phí</h3>
          {byCat.length ? (
            byCat.map(([c, v]) => (
              <div key={c} className="metric">
                <div className="row-between">
                  <span>{c}</span>
                  <b>{fmtMoney(v)}</b>
                </div>
                <div className="progress">
                  <i className="orange" style={{ width: (v / (exp || 1)) * 100 + '%' }} />
                </div>
              </div>
            ))
          ) : (
            <p className="muted">Chưa có khoản chi.</p>
          )}
        </div>
      </div>

      <div className="card table-wrap">
        <div className="row-between">
          <h3>Bảng lương giáo viên – {payMonth}</h3>
          <small className="muted">Số buổi đã điểm danh × đơn giá/buổi (đổi tháng ở bộ lọc phía trên)</small>
        </div>
        <table>
          <thead>
            <tr>
              <th>Giáo viên</th>
              <th className="num">Số buổi</th>
              <th className="num">Đơn giá</th>
              <th className="num">Thực lĩnh</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {payroll.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.name}</b>
                </td>
                <td className="num">{p.count}</td>
                <td className="num">{fmtMoney(p.rate)}</td>
                <td className="num">
                  <b>{fmtMoney(p.amount)}</b>
                </td>
                <td className="num">
                  {p.paid ? (
                    <Badge tone="green">Đã chi</Badge>
                  ) : edit && p.amount > 0 ? (
                    <button
                      className="btn small primary"
                      onClick={() => {
                        s.payTeacher(p.id, payMonth, p.amount, p.name)
                        s.notify('Đã chi lương & ghi sổ')
                      }}
                    >
                      Chi lương
                    </button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card table-wrap">
        <h3>Sổ thu chi</h3>
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Loại</th>
              <th>Hạng mục</th>
              <th>Diễn giải</th>
              <th>HT</th>
              <th className="num">Số tiền</th>
              {edit && <th />}
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>
                  <Badge tone={t.type === 'income' ? 'green' : 'orange'}>
                    {t.type === 'income' ? 'Thu' : 'Chi'}
                  </Badge>
                </td>
                <td>{t.cat}</td>
                <td>{t.note}</td>
                <td>{t.method}</td>
                <td className={'num ' + (t.type === 'income' ? 'pos' : 'neg')}>
                  {t.type === 'income' ? '+' : '−'}
                  {fmtMoney(t.amount)}
                </td>
                {edit && (
                  <td>
                    <button
                      className="icon-action-btn danger"
                      title="Xoá giao dịch"
                      onClick={() => {
                        s.removeTransaction(t.id)
                        s.notify('Đã xoá giao dịch')
                      }}
                      aria-label="Xoá"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Ghi thu / chi" onClose={() => setOpen(false)}>
          <div className="seg">
            <button className={f.type === 'income' ? 'on' : ''} onClick={() => setT('income')}>
              Khoản thu
            </button>
            <button className={f.type === 'expense' ? 'on' : ''} onClick={() => setT('expense')}>
              Khoản chi
            </button>
          </div>
          <div className="form-row">
            <Field label="Hạng mục">
              <select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
                {(f.type === 'income' ? INCOME_CATS : EXPENSE_CATS).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Ngày">
              <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Số tiền (₫)">
              <input
                type="number"
                min="0"
                autoFocus
                value={f.amount}
                onChange={(e) => setF({ ...f, amount: e.target.value })}
              />
            </Field>
            <Field label="Hình thức">
              <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
                {['Chuyển khoản', 'Tiền mặt', 'Thẻ'].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Diễn giải">
            <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          </Field>
          <div className="modal-foot">
            <button className="btn primary" onClick={submit}>
              Ghi sổ
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
