import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import ConversationList from './components/ConversationList.jsx'
import MessageThread from './components/MessageThread.jsx'
import { authStatus, logout } from './api/zalo.js'

const S = {
  app: { display: 'flex', height: '100vh', overflow: 'hidden' },
  main: { flex: 1, display: 'flex', overflow: 'hidden' },
  topBar: {
    position: 'absolute', top: 0, right: 0, padding: '10px 16px', zIndex: 10,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  userChip: {
    background: '#fff', border: '1px solid #e0e0e0', borderRadius: 20,
    padding: '5px 12px', fontSize: 13, color: '#333', display: 'flex', alignItems: 'center', gap: 6,
  },
  logoutBtn: {
    background: 'none', border: '1px solid #e0e0e0', borderRadius: 8,
    padding: '5px 12px', cursor: 'pointer', fontSize: 13, color: '#666',
  },
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    authStatus()
      .then(({ authenticated }) => { if (!authenticated) setUser(null) })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  async function handleLogout() {
    await logout().catch(() => {})
    setUser(null)
    setSelected(null)
  }

  if (checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Đang kiểm tra phiên đăng nhập...
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div style={{ ...S.app, position: 'relative' }}>
      <div style={S.topBar}>
        <div style={S.userChip}>
          <span>👤</span>
          <span>{user.displayName || user.zaloName || 'Người dùng'}</span>
        </div>
        <button style={S.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
      </div>

      <div style={S.main}>
        <ConversationList selected={selected} onSelect={setSelected} />
        <MessageThread
          conversation={selected}
          currentUserId={user.userId || user.uid || ''}
        />
      </div>
    </div>
  )
}
