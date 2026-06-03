import { useState, useEffect, useCallback } from 'react'
import { getConversations, searchConversations } from '../api/zalo'

const S = {
  sidebar: {
    width: 320, minWidth: 280, background: '#fff', borderRight: '1px solid #e8e8e8',
    display: 'flex', flexDirection: 'column', height: '100%',
  },
  header: { padding: '16px 16px 12px', borderBottom: '1px solid #f0f0f0' },
  title: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 10 },
  search: {
    width: '100%', padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: 20,
    fontSize: 14, outline: 'none', background: '#f5f5f5', transition: 'all .2s',
  },
  list: { flex: 1, overflowY: 'auto' },
  item: (active) => ({
    display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
    background: active ? '#e8f0fe' : 'transparent', borderLeft: active ? '3px solid #0068ff' : '3px solid transparent',
    transition: 'background .15s',
  }),
  avatar: (color) => ({
    width: 44, height: 44, borderRadius: '50%', background: color, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 17, marginRight: 12,
  }),
  info: { flex: 1, overflow: 'hidden' },
  name: { fontWeight: 600, fontSize: 14, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  preview: { fontSize: 13, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 },
  badge: {
    background: '#0068ff', color: '#fff', borderRadius: 10, fontSize: 11,
    fontWeight: 700, padding: '1px 6px', marginLeft: 6, flexShrink: 0,
  },
  empty: { padding: 24, textAlign: 'center', color: '#aaa', fontSize: 14 },
  loading: { padding: 24, textAlign: 'center', color: '#aaa', fontSize: 14 },
  loadMore: {
    padding: '12px 0', textAlign: 'center', color: '#0068ff', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, borderTop: '1px solid #f0f0f0',
  },
}

const AVATAR_COLORS = ['#0068ff', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#607d8b']

function avatarColor(id) {
  const idx = (parseInt(id?.slice(-4) || '0', 16) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
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

export default function ConversationList({ selected, onSelect }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [lastId, setLastId] = useState('0')
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const id = reset ? '0' : lastId
      const data = await getConversations(id, 30)
      if (reset) {
        setConversations(data)
      } else {
        setConversations(prev => [...prev, ...data])
      }
      if (data.length < 30) setHasMore(false)
      if (data.length > 0) setLastId(data[data.length - 1].id || '0')
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [lastId])

  useEffect(() => { load(true) }, [])

  async function handleSearch(e) {
    const q = e.target.value
    setQuery(q)
    if (!q.trim()) { load(true); return }
    try {
      const data = await searchConversations(q)
      setConversations(data)
      setHasMore(false)
    } catch { /* ignore */ }
  }

  const displayed = conversations

  return (
    <div style={S.sidebar}>
      <div style={S.header}>
        <div style={S.title}>Tin nhắn</div>
        <input
          style={S.search}
          placeholder="Tìm kiếm hội thoại..."
          value={query}
          onChange={handleSearch}
          onFocus={e => { e.target.style.borderColor = '#0068ff'; e.target.style.background = '#fff' }}
          onBlur={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.background = '#f5f5f5' }}
        />
      </div>

      <div style={S.list}>
        {loading && conversations.length === 0 ? (
          <div style={S.loading}>Đang tải...</div>
        ) : displayed.length === 0 ? (
          <div style={S.empty}>Không có hội thoại nào</div>
        ) : (
          displayed.map(conv => {
            const isActive = selected?.id === conv.id
            const unread = parseInt(conv.unread_msgs || '0')
            const lastMsg = conv.last_msg
            const preview = lastMsg?.content || ''
            return (
              <div
                key={conv.id}
                style={S.item(isActive)}
                onClick={() => onSelect(conv)}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f9fa' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={S.avatar(avatarColor(conv.id))}>{initials(conv.name)}</div>
                <div style={S.info}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={S.name}>{conv.name || 'Không có tên'}</div>
                    <div style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{formatTime(lastMsg?.ts)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={S.preview}>{preview}</div>
                    {unread > 0 && <div style={S.badge}>{unread > 99 ? '99+' : unread}</div>}
                  </div>
                </div>
              </div>
            )
          })
        )}
        {!loading && hasMore && !query && (
          <div style={S.loadMore} onClick={() => load(false)}>Tải thêm...</div>
        )}
      </div>
    </div>
  )
}
