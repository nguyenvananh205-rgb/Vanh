import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import TabBar from './components/TabBar.jsx'
import ConversationList from './components/ConversationList.jsx'
import MessageThread from './components/MessageThread.jsx'
import GroupSummary from './components/GroupSummary.jsx'
import { authStatus, logout, getConversations } from './api/zalo.js'
import { getLabels, setConvLabels } from './api/labels.js'

const S = {
  app: { display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' },
  topBar: {
    background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 16px',
    display: 'flex', alignItems: 'center', gap: 12, height: 48, flexShrink: 0,
  },
  logo: { fontWeight: 800, fontSize: 16, color: '#0068ff', marginRight: 'auto' },
  userChip: {
    border: '1px solid #e0e0e0', borderRadius: 20,
    padding: '4px 12px', fontSize: 13, color: '#333', display: 'flex', alignItems: 'center', gap: 6,
  },
  logoutBtn: {
    background: 'none', border: '1px solid #e0e0e0', borderRadius: 8,
    padding: '4px 12px', cursor: 'pointer', fontSize: 13, color: '#666',
  },
  body: { flex: 1, display: 'flex', overflow: 'hidden' },
  leftCol: { display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8e8e8', overflow: 'hidden' },
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  // Label state
  const [labels, setLabels] = useState([])
  const [assignments, setAssignments] = useState({})

  // All conversations (for GroupSummary filtering)
  const [allConversations, setAllConversations] = useState([])

  useEffect(() => {
    authStatus()
      .then(({ authenticated }) => { if (!authenticated) setUser(null) })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (!user) return
    getLabels()
      .then(({ labels: lbls, assignments: asgn }) => {
        setLabels(lbls)
        setAssignments(asgn)
      })
      .catch(() => {})
  }, [user])

  // Keep allConversations updated (ConversationList manages its own list internally,
  // but GroupSummary needs it too — we fetch once here for summary)
  useEffect(() => {
    if (!user) return
    getConversations('0', 100)
      .then(setAllConversations)
      .catch(() => {})
  }, [user])

  async function handleLogout() {
    await logout().catch(() => {})
    setUser(null)
    setSelected(null)
    setActiveTab('all')
  }

  async function handleAssignmentsChange(next, batchConvIds) {
    setAssignments(next)
    // Persist to backend for each changed conv
    const convIds = batchConvIds || Object.keys(next).filter(id => JSON.stringify(next[id]) !== JSON.stringify(assignments[id]))
    await Promise.all(convIds.map(id => setConvLabels(id, next[id] || []).catch(() => {})))
  }

  function handleTabChange(tabId) {
    setActiveTab(tabId)
    setSelected(null)
  }

  if (checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Đang kiểm tra phiên đăng nhập...
      </div>
    )
  }

  if (!user) return <Login onLogin={setUser} />

  const activeLabel = labels.find(l => l.id === activeTab) || null

  // Filter allConversations for GroupSummary
  const groupConversations = activeLabel
    ? allConversations.filter(c => (assignments[c.id] || []).includes(activeTab))
    : []

  return (
    <div style={S.app}>
      {/* Top nav bar */}
      <div style={S.topBar}>
        <div style={S.logo}>💬 Zalo Manager</div>
        <div style={S.userChip}>
          <span>👤</span>
          <span>{user.displayName || user.zaloName || 'Người dùng'}</span>
        </div>
        <button style={S.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
      </div>

      {/* Main body */}
      <div style={S.body}>
        {/* Left: tabs + conversation list */}
        <div style={S.leftCol}>
          <TabBar
            labels={labels}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLabelsChange={setLabels}
          />
          <ConversationList
            selected={selected}
            onSelect={setSelected}
            activeTab={activeTab}
            labels={labels}
            assignments={assignments}
            onAssignmentsChange={handleAssignmentsChange}
          />
        </div>

        {/* Right: group summary or message thread */}
        {activeLabel && !selected ? (
          <GroupSummary
            label={activeLabel}
            conversations={groupConversations}
            selected={selected}
            onSelect={setSelected}
          />
        ) : (
          <MessageThread
            conversation={selected}
            currentUserId={user.userId || user.uid || ''}
          />
        )}
      </div>
    </div>
  )
}
