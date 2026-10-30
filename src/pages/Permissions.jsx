import { useStore } from '../store'
import { MODULES, ROLES } from '../data'
import { PageHead, ReadOnlyNote } from '../components/ui'
import Icon from '../components/icons'

const LV = [
  ['none', 'Không'],
  ['view', 'Xem'],
  ['edit', 'Sửa'],
]

export default function Permissions() {
  const s = useStore()
  const edit = s.canEdit('permissions')
  return (
    <>
      <PageHead
        title="Phân quyền"
        sub="Ma trận quyền theo vai trò × chức năng. Thay đổi có hiệu lực ngay khi bạn đổi sang vai trò đó."
      />
      <ReadOnlyNote show={!edit} />
      <div className="card table-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th>Chức năng</th>
              {Object.entries(ROLES).map(([k, r]) => (
                <th key={k} style={{ color: r.color }}>
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => (
              <tr key={m.key}>
                <td>
                  <div className="perm-mod-label">
                    <Icon name={m.icon} size={16} />
                    <span>{m.label}</span>
                  </div>
                </td>
                {Object.keys(ROLES).map((role) => (
                  <td key={role}>
                    <select
                      className={'perm ' + s.perms[role][m.key]}
                      value={s.perms[role][m.key]}
                      disabled={!edit || (role === 'admin' && (m.key === 'permissions' || m.key === 'users'))}
                      onChange={(e) => s.setPerm(role, m.key, e.target.value)}
                    >
                      {LV.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
