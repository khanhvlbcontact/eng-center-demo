import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { initialState, reducers, COLLECTIONS } from './engine'

// Hai chế độ:
//  - Guest/offline (không có token): chạy reducer ngay trên trình duyệt, lưu localStorage.
//  - Đăng nhập thật (có token): mọi thao tác gửi lên API, server kiểm tra quyền & trả về state được phép xem.
const KEY = 'engcen-demo-v2'
const Ctx = createContext(null)

const fresh = () => ({ user: null, token: null, ...initialState() })
const EMPTY = Object.fromEntries(COLLECTIONS.map((c) => [c, []]))

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const base = fresh()
    const saved = JSON.parse(raw)
    // gộp quyền mặc định mới vào quyền đã lưu (khi thêm module mới)
    const perms = Object.fromEntries(Object.keys(base.perms).map((r) => [r, { ...base.perms[r], ...(saved.perms?.[r] || {}) }]))
    return { ...base, ...saved, perms }
  } catch {
    return fresh()
  }
}

async function call(path, token, body, method) {
  let res
  try {
    res = await fetch('/api' + path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw Object.assign(new Error('Không kết nối được máy chủ (đã chạy `npm run server` chưa?)'), { status: 0 })
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Lỗi máy chủ'), { status: res.status })
  return data
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [toast, setToast] = useState(null)
  const ref = useRef(state)
  ref.current = state

  useEffect(() => {
    try {
      // không lưu dữ liệu thật của máy chủ vào trình duyệt, chỉ giữ token để khôi phục phiên
      localStorage.setItem(KEY, JSON.stringify(state.token ? { token: state.token } : state))
    } catch {}
  }, [state])

  const notify = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }, [])

  // Guest: chỉ đổi vai trò, giữ dữ liệu demo; phiên thật: xoá sạch dữ liệu khỏi trình duyệt
  const logout = useCallback(() => setState((s) => (s.token ? fresh() : { ...s, user: null })), [])

  // Khôi phục phiên khi tải lại trang
  useEffect(() => {
    const { token } = ref.current
    if (!token) return
    call('/state', token)
      .then((d) => setState((s) => ({ ...s, ...EMPTY, ...d.state, user: { ...d.user, real: true } })))
      .catch((e) => {
        if (e.status === 401) logout()
        else if (e.status === 0) notify(e.message)
      })
  }, [logout, notify])

  const dispatch = useCallback(
    async (type, args) => {
      const { token } = ref.current
      try {
        if (token) {
          const d = await call('/action', token, { type, args })
          setState((s) => ({ ...s, ...EMPTY, ...d.state }))
        } else {
          setState((s) => ({ ...s, ...reducers[type](s, ...args) }))
        }
        return true
      } catch (e) {
        if (e.status === 401) logout()
        notify(e.message)
        return false
      }
    },
    [logout, notify]
  )

  const api = useMemo(() => {
    const level = (mod) => (state.user ? state.perms[state.user.role]?.[mod] || 'none' : 'none')
    const actions = Object.fromEntries(Object.keys(reducers).map((name) => [name, (...args) => dispatch(name, args)]))
    return {
      ...state,
      ...actions,
      toast,
      notify,
      level,
      can: (mod) => level(mod) !== 'none',
      canEdit: (mod) => level(mod) === 'edit',
      isReal: !!state.token,
      meStudentId: state.user?.studentId || 's1', // tài khoản thật dùng hồ sơ được gán; Guest dùng hồ sơ mẫu
      meTeacherId: state.user?.teacherId || 't1',
      // gọi API có token; tự đăng xuất khi phiên hết hạn/bị thu hồi
      req: async (method, path, body) => {
        try {
          return await call(path, ref.current.token, body, method)
        } catch (e) {
          if (e.status === 401) logout()
          throw e
        }
      },
      // nhận phiên mới (sau đổi mật khẩu) và nạp lại dữ liệu theo quyền
      async adoptSession(token, user) {
        const d = await call('/state', token)
        setState((s) => ({ ...s, ...EMPTY, ...d.state, token, user: { ...d.user, real: true } }))
      },
      loginGuest: (user) => setState((s) => ({ ...s, user: { ...user, guest: true } })),
      async signIn(email, password) {
        const d = await call('/auth/login', null, { email, password })
        setState({ ...fresh(), ...EMPTY, ...d.state, token: d.token, user: { ...d.user, real: true } })
      },
      logout,
      resetDemo: async () => {
        if (await dispatch('resetDemo', [])) notify('Đã khôi phục dữ liệu mẫu')
      },
    }
  }, [state, toast, notify, dispatch, logout])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
