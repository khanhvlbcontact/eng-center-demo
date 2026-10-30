import { useState } from 'react'
import { useStore } from '../store'
import { LEVELS, SKILLS, MAT_TYPES } from '../data'
import { PageHead, Modal, Field, Badge, ReadOnlyNote } from '../components/ui'
import Icon from '../components/icons'
import ComingSoon from '../components/ComingSoon'

const STATUS = {
  published: { label: 'Đã xuất bản', tone: 'green' },
  pending: { label: 'Chờ duyệt', tone: 'orange' },
  draft: { label: 'Bản nháp', tone: 'gray' },
}

const TYPE_ICON_NAMES = {
  PDF: 'file-pdf',
  Video: 'file-video',
  Audio: 'file-audio',
  Slide: 'file-slide',
  'Bài tập': 'file-edit',
}

export default function Materials() {
  const s = useStore()
  const edit = s.canEdit('materials')
  const isReviewer = ['admin', 'manager'].includes(s.user.role)
  const isStudent = s.user.role === 'student'
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('')
  const [skill, setSkill] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [soon, setSoon] = useState(null) // thông báo tính năng đang triển khai
  const [form, setForm] = useState({ title: '', level: LEVELS[0], skill: SKILLS[0], type: MAT_TYPES[0] })

  const teacherName = (id) => s.teachers.find((t) => t.id === id)?.name || 'Trung tâm'
  const list = s.materials.filter(
    (m) =>
      (!isStudent || m.status === 'published') &&
      (!q || m.title.toLowerCase().includes(q.toLowerCase())) &&
      (!level || m.level === level) &&
      (!skill || m.skill === skill) &&
      (!status || m.status === status)
  )

  const submit = (asDraft) => {
    if (!form.title.trim()) return s.notify('Vui lòng nhập tiêu đề')
    s.addMaterial({
      ...form,
      author: s.user.role === 'teacher' ? 't1' : 'center',
      date: new Date().toISOString().slice(0, 10),
      status: asDraft ? 'draft' : isReviewer ? 'published' : 'pending',
      size: '1.0 MB',
    })
    setOpen(false)
    setForm({ title: '', level: LEVELS[0], skill: SKILLS[0], type: MAT_TYPES[0] })
    s.notify(asDraft ? 'Đã lưu bản nháp' : isReviewer ? 'Đã xuất bản tài liệu' : 'Đã gửi tài liệu chờ duyệt')
  }

  return (
    <>
      <PageHead
        title="Tài liệu học tập"
        sub="Kho học liệu theo trình độ & kỹ năng, có quy trình duyệt trước khi xuất bản"
      >
        {edit && (
          <button className="btn primary" onClick={() => setOpen(true)}>
            <Icon name="plus" size={14} />
            <span>Tải tài liệu lên</span>
          </button>
        )}
      </PageHead>
      <ReadOnlyNote show={!edit && !isStudent} />

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={15} className="search-icon" />
          <input placeholder="Tìm tài liệu…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">Tất cả trình độ</option>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">Tất cả kỹ năng</option>
          {SKILLS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        {!isStudent && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Mọi trạng thái</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid cards">
        {list.map((m) => (
          <div key={m.id} className="card mat">
            <div className="mat-top">
              <span className="mat-icon">
                <Icon name={TYPE_ICON_NAMES[m.type] || 'file-pdf'} size={24} />
              </span>
              {!isStudent && <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>}
            </div>
            <b>{m.title}</b>
            <div className="tags">
              <Badge tone="blue">{m.level}</Badge>
              <Badge tone="purple">{m.skill}</Badge>
              <Badge>{m.type}</Badge>
            </div>
            <small className="muted mat-meta">
              <span>{teacherName(m.author)}</span>
              <span>·</span>
              <span>{m.date}</span>
              <span>·</span>
              <span>{m.size}</span>
              <span>·</span>
              <span className="inline-meta">
                <Icon name="download" size={12} />
                {m.downloads}
              </span>
            </small>
            <div className="mat-actions">
              {m.status === 'published' && (
                <button
                  className="btn small"
                  onClick={() =>
                    setSoon({
                      feature: 'Tải xuống tài liệu',
                      plan: 'Hiện kho học liệu mới lưu thông tin tài liệu, chưa đính kèm file thực. Việc tải file sẽ có cùng lúc với tính năng tải lên.',
                    })
                  }
                >
                  <Icon name="download" size={13} />
                  <span>Tải xuống</span>
                </button>
              )}
              {edit && isReviewer && m.status === 'pending' && (
                <>
                  <button
                    className="btn small primary"
                    onClick={() => {
                      s.setMaterialStatus(m.id, 'published')
                      s.notify('Đã duyệt & xuất bản')
                    }}
                  >
                    <Icon name="check" size={13} />
                    <span>Duyệt</span>
                  </button>
                  <button
                    className="btn small ghost"
                    onClick={() => {
                      s.setMaterialStatus(m.id, 'draft')
                      s.notify('Đã trả về bản nháp')
                    }}
                  >
                    Từ chối
                  </button>
                </>
              )}
              {edit && !isReviewer && m.status === 'draft' && (
                <button
                  className="btn small"
                  onClick={() => {
                    s.setMaterialStatus(m.id, 'pending')
                    s.notify('Đã gửi chờ duyệt')
                  }}
                >
                  Gửi duyệt
                </button>
              )}
              {edit && isReviewer && m.status === 'published' && (
                <button className="btn small ghost" onClick={() => s.setMaterialStatus(m.id, 'draft')}>
                  Gỡ xuống
                </button>
              )}
            </div>
          </div>
        ))}
        {!list.length && <div className="empty">Không có tài liệu phù hợp.</div>}
      </div>

      {open && (
        <Modal title="Tải tài liệu lên" onClose={() => setOpen(false)}>
          <Field label="Tiêu đề">
            <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="form-row">
            <Field label="Trình độ">
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Kỹ năng">
              <select value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })}>
                {SKILLS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Loại">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {MAT_TYPES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
          </div>
          <div
            className="dropzone"
            role="button"
            tabIndex={0}
            onClick={() =>
              setSoon({
                feature: 'Đính kèm file tài liệu',
                plan: 'Bạn vẫn có thể lưu thông tin tài liệu (tiêu đề, trình độ, kỹ năng, loại) và đưa vào quy trình duyệt. Phần đính kèm file đang được phát triển.',
              })
            }
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
          >
            <Icon name="paperclip" size={24} className="dropzone-icon" />
            <p>Chọn hoặc kéo thả file vào đây</p>
            <small>Sắp ra mắt</small>
          </div>
          <div className="modal-foot">
            <button className="btn ghost" onClick={() => submit(true)}>
              Lưu nháp
            </button>
            <button className="btn primary" onClick={() => submit(false)}>
              {isReviewer ? 'Xuất bản' : 'Gửi duyệt'}
            </button>
          </div>
        </Modal>
      )}
      {soon && <ComingSoon {...soon} onClose={() => setSoon(null)} />}
    </>
  )
}
