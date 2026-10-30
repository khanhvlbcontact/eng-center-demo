import { Modal } from './ui'
import Icon from './icons'

// Hộp thông báo dùng chung cho chức năng chưa hoàn thiện: nút vẫn bấm được nhưng báo rõ đang triển khai.
// Dùng: const [soon, setSoon] = useState(null) → setSoon({ feature: 'Tải xuống tài liệu', plan: '…' })
//       {soon && <ComingSoon {...soon} onClose={() => setSoon(null)} />}
export default function ComingSoon({ feature, plan, onClose }) {
  return (
    <Modal title="Tính năng đang triển khai" onClose={onClose} width={420}>
      <div className="coming-soon">
        <div className="coming-soon-icon">
          <Icon name="sparkles" size={22} />
        </div>
        <h4>{feature}</h4>
        <p>
          Chức năng này đang trong quá trình triển khai và sẽ sớm có mặt trong các phiên bản tới. Hiện tại bạn vẫn có thể dùng
          các phần còn lại của hệ thống bình thường.
        </p>
        {plan && <p className="coming-soon-plan">{plan}</p>}
      </div>
      <div className="modal-foot">
        <button className="btn primary" onClick={onClose}>
          Đã hiểu
        </button>
      </div>
    </Modal>
  )
}
