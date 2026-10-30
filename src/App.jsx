import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Materials from './pages/Materials'
import Classes from './pages/Classes'
import Teachers from './pages/Teachers'
import Assignments from './pages/Assignments'
import Admissions from './pages/Admissions'
import Students from './pages/Students'
import Finance from './pages/Finance'
import Portal from './pages/Portal'
import Permissions from './pages/Permissions'
import Users from './pages/Users'
import ChangePassword from './components/ChangePassword'
import Icon from './components/icons'
import { MODULES } from './data'

const PAGES = {
  dashboard: Dashboard,
  materials: Materials,
  classes: Classes,
  teachers: Teachers,
  assignments: Assignments,
  admissions: Admissions,
  students: Students,
  finance: Finance,
  portal: Portal,
  permissions: Permissions,
  users: Users,
}

function Guard({ mod }) {
  const { can } = useStore()
  const Page = PAGES[mod]
  if (!can(mod)) {
    return (
      <div className="empty">
        <Icon name="lock" size={20} style={{ marginBottom: 6, display: 'block', marginInline: 'auto' }} />
        <span>Vai trò hiện tại không có quyền truy cập mục này.</span>
      </div>
    )
  }
  return <Page />
}

export default function App() {
  const { user, can } = useStore()
  if (!user) return <Login />
  if (user.mustChange) return <ChangePassword forced />
  const home = MODULES.find((m) => can(m.key))?.key || 'dashboard'
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={'/' + home} replace />} />
        {MODULES.map((m) => (
          <Route key={m.key} path={'/' + m.key} element={<Guard mod={m.key} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
