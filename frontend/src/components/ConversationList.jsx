import { useState, useEffect, useCallback } from 'react'
import { getConversations, searchConversations } from '../api/zalo.js'
import { autoSuggest } from '../api/labels.js'
import LabelContextMenu from './LabelContextMenu.jsx'

const S = {
  sidebar: {
    width: 320, minWidth: 280, background: '#fff', borderRight: '1px solid #e8e8e8',
    display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
  },
  searchRow: { padding: '10px 12px 8px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 8 },
  search: {
    flex: 1, padding: '7px 12px', border: '1.5px solid #e0e0e0', borderRadius: 20,
    fontSize: 14, outline: 'none', background: '#f5f5f5', transition: 'all .2s',
  },
  suggestBtn: (loading) => ({
    padding: '0 10px', background: loading ? '#e0e0e0' : '#fff8e1', border: '1px solid #ffd43b',
    borderRadius: 16, fontSize: 12, color: '#c77b00', cursor: loading ? 'default' : 'pointer',
    fontWeight: 600, whiteSpace: 'nowrap', transition: 'all .2s',
  }),
  list: { flex: 1, overflowY: 'auto' },
  item: (active) => ({
    display: 'flex', alignItems: 'center', padding: '11px 14px', cursor: 'pointer',
    background: active ? '#e8f0fe' : 'transparent',
    borderLeft: active ? '3px solid #0068ff' : '3px solid transparent', transition: 'background .15s',
  }),
  avatar: (color) => ({
    width: 44, height: 44, borderRadius: '50%', background: color, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 17, marginRight: 10,
  }),
  info: { flex: 1, overflow: 'hidden' },
  name: { fontWeight: 600, fontSize: 14, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  preview: { fontSize: 13, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 },
  badge: {
    background: '#0068ff', color: '#fff', borderRadius: 10, fontSize: 11,
    fontWeight: 700, padding: '1px 6px', marginLeft: 6, flexShrink: 0,
  },
  labelDots: { display: 'flex', gap: 3, marginTop: 4 },
  dot: (color) => ({ width: 7, height: 7, borderRadius: '50%', background: color }),
  empty: { padding: 24, textAlign: 'center', color: '#aaa', fontSize: 14 },
  loadMore: {
    padding: '12px 0', textAlign: 'center', color: '#0068ff', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, borderTop: '1px solid #f0f0f0',
  },
  toastBar: {
    padding: '8px 14px', background: '#fff8e1', borderBottom: '1px solid #ffe066',
    fontSize: 13, color: '#7d5a00', display: 'flex', alignItems: 'center', gap: 8,
  },
  applyBtn: {
    marginLeft: 'auto', padding: '3px 10px', background: '#ffd43b', border: 'none',
    borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
}

const AVATAR_COLORS = ['#0068ff', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#607d8b']
function avatarColor(id) {
  return AVATAR_COLORS[(parseInt(id?.slice(-4) || '0', 16) || 0) % AVATAR_COLORS.length]
}
function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name[0].toUpperCase()
}
function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(parseInt(ts))
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return d.toLocaleDateString('vi-VN', { weekday: 'short' })
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default function ConversationList({
  selected, onSelect, activeTab, labels, assignments, onAssignmentsChange,
}) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [lastId, setLastId] = useState('0')
  const [hasMore, setHasMore] = useState(true)
  const [contextMenu, setContextMenu] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [suggesting, setSuggesting] = useState(false)

  const loadConversations = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const id = reset ? '0' : lastId
      const data = await getConversations(id, 30)
      setConversations(prev => reset ? data : [...prev, ...data])
      if (data.length < 30) setHasMore(false)
      if (data.length > 0) setLastId(data[data.length - 1].id || '0')
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [lastId])

  useEffect(() => { loadConversations(true) }, [])

  async function handleSearch(e) {
    const q = e.target.value
    setQuery(q)
    if (!q.trim()) { loadConversations(true); return }
    try {
      setConversations(await searchConversations(q))
      setHasMore(false)
    } catch { /* ignore */ }
  }

  async function handleAutoSuggest() {
    setSuggesting(true)
    try {
      const result = await autoSuggest(conversations)
      setSuggestions(result)
    } catch { /* ignore */ }
    finally { setSuggesting(false) }
  }

  function applyAllSuggestions() {
    if (!suggestions) return
    const next = { ...assignments }
    Object.entries(suggestions).forEach(([convId, labelIds]) => {
      next[convId] = Array.from(new Set([...(next[convId] || []), ...labelIds]))
    })
    onAssignmentsChange(next, Object.keys(suggestions))
    setSuggestions(null)
  }

  function handleContextMenu(e, conv) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, conv })
  }

  function handleAssignmentUpdate(convId, labelIds) {
    onAssignmentsChange({ ...assignments, [convId]: labelIds })
  }

  // Filter by active tab
  const displayed = activeTab === 'all'
    ? conversations
    : conversations.filter(c => (assignments[c.id] || []).includes(activeTab))

  const labelMap = Object.fromEntries(labels.map(l => [l.id, l]))
  const suggestionCount = suggestions ? Object.keys(suggestions).length : 0

  return (
    <div style={S.sidebar}>
      {/* Search + auto-suggest */}
      <div style={S.searchRow}>
        <input
          style={S.search}
          placeholder="Tìm kiếm hội thoại..."
          value={query}
          onChange={handleSearch}
          onFocus={e => { e.target.style.borderColor = '#0068ff'; e.target.style.background = '#fff' }}
          onBlur={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.background = '#f5f5f5' }}
        />
        <button
          style={S.suggestBtn(suggesting)}
          onClick={handleAutoSuggest}
          disabled={suggesting}
          title="Tự động gợi ý nhãn cho tất cả hội thoại"
        >
          {suggesting ? '...' : '✨ Gợi ý'}
        </button>
      </div>

      {/* Suggestion toast */}
      {suggestions && suggestionCount > 0 && (
        <div style={S.toastBar}>
          <span>Tìm được {suggestionCount} gợi ý phân loại</span>
          <button style={S.applyBtn} onClick={applyAllSuggestions}>Áp dụng tất cả</button>
          <button
            onClick={() => setSuggestions(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7d5a00', fontSize: 16 }}
          >×</button>
        </div>
      )}
      {suggestions && suggestionCount === 0 && (
        <div style={{ ...S.toastBar, background: '#f8f9fa', borderColor: '#e0e0e0', color: '#888' }}>
          Không tìm được gợi ý nào từ tên hội thoại.
          <button onClick={() => setSuggestions(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, marginLeft: 'auto' }}>×</button>
        </div>
      )}

      {/* List */}
      <div style={S.list}>
        {loading && conversations.length === 0 ? (
          <div style={S.empty}>Đang tải...</div>
        ) : displayed.length === 0 ? (
          <div style={S.empty}>
            {activeTab === 'all' ? 'Không có hội thoại nào' : 'Chưa có hội thoại nào trong nhóm này.'}
          </div>
        ) : (
          displayed.map(conv => {
            const isActive = selected?.id === conv.id
            const unread = parseInt(conv.unread_msgs || '0')
            const convLabels = (assignments[conv.id] || []).map(id => labelMap[id]).filter(Boolean)
            const hasSuggestion = suggestions && suggestions[conv.id]
            return (
              <div
                key={conv.id}
                style={{
                  ...S.item(isActive),
                  ...(hasSuggestion ? { borderLeft: '3px solid #ffd43b' } : {}),
                }}
                onClick={() => onSelect(conv)}
                onContextMenu={e => handleContextMenu(e, conv)}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f9fa' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={S.avatar(avatarColor(conv.id))}>{initials(conv.name)}</div>
                <div style={S.info}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={S.name}>{conv.name || 'Không có tên'}</div>
                    <div style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{formatTime(conv.last_msg?.ts)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={S.preview}>{conv.last_msg?.content || ''}</div>
                    {unread > 0 && <div style={S.badge}>{unread > 99 ? '99+' : unread}</div>}
                  </div>
                  {convLabels.length > 0 && (
                    <div style={S.labelDots}>
                      {convLabels.map(l => (
                        <div key={l.id} style={S.dot(l.color)} title={l.name} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        {!loading && hasMore && !query && (
          <div style={S.loadMore} onClick={() => loadConversations(false)}>Tải thêm...</div>
        )}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <LabelContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          conv={contextMenu.conv}
          labels={labels}
          assignments={assignments}
          onUpdate={handleAssignmentUpdate}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
