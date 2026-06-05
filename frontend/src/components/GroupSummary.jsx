const S = {
  panel: {
    flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f9fa', overflow: 'hidden',
  },
  header: {
    padding: '20px 24px 16px', background: '#fff', borderBottom: '1px solid #eee',
  },
  labelTitle: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  emoji: { fontSize: 28 },
  name: { fontSize: 20, fontWeight: 700, color: '#111' },
  stats: { display: 'flex', gap: 20, fontSize: 13, color: '#666' },
  stat: { display: 'flex', alignItems: 'center', gap: 5 },
  statNum: (highlight) => ({ fontWeight: 700, color: highlight ? '#0068ff' : '#333' }),
  list: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  card: (active) => ({
    background: active ? '#e8f0fe' : '#fff', border: '1px solid #eeeeee',
    borderRadius: 12, padding: '12px 16px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 12, transition: 'all .15s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  }),
  avatar: (color) => ({
    width: 44, height: 44, borderRadius: '50%', background: color, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 17,
  }),
  cardInfo: { flex: 1, overflow: 'hidden' },
  cardName: { fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 3 },
  cardPreview: { fontSize: 13, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  unread: {
    background: '#0068ff', color: '#fff', borderRadius: 10,
    fontSize: 11, fontWeight: 700, padding: '2px 7px', flexShrink: 0,
  },
  time: { fontSize: 11, color: '#bbb', flexShrink: 0 },
  empty: { textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: 15 },
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
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default function GroupSummary({ label, conversations, selected, onSelect }) {
  if (!label) return null

  const totalUnread = conversations.reduce((s, c) => s + parseInt(c.unread_msgs || '0'), 0)

  return (
    <div style={S.panel}>
      {/* Summary header */}
      <div style={S.header}>
        <div style={S.labelTitle}>
          <span style={S.emoji}>{label.emoji}</span>
          <span style={{ ...S.name, color: label.color }}>{label.name}</span>
        </div>
        <div style={S.stats}>
          <div style={S.stat}>
            <span>Hội thoại:</span>
            <span style={S.statNum(false)}>{conversations.length}</span>
          </div>
          {totalUnread > 0 && (
            <div style={S.stat}>
              <span>Chưa đọc:</span>
              <span style={S.statNum(true)}>{totalUnread} tin</span>
            </div>
          )}
        </div>
      </div>

      {/* Conversation cards */}
      <div style={S.list}>
        {conversations.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{label.emoji}</div>
            Chưa có hội thoại nào trong nhóm này.<br />
            <span style={{ fontSize: 13 }}>Chuột phải lên hội thoại để gán nhãn.</span>
          </div>
        ) : (
          conversations.map(conv => {
            const unread = parseInt(conv.unread_msgs || '0')
            const isActive = selected?.id === conv.id
            return (
              <div
                key={conv.id}
                style={S.card(isActive)}
                onClick={() => onSelect(conv)}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f0f4ff' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff' }}
              >
                <div style={S.avatar(avatarColor(conv.id))}>{initials(conv.name)}</div>
                <div style={S.cardInfo}>
                  <div style={S.cardName}>{conv.name || 'Không có tên'}</div>
                  <div style={S.cardPreview}>{conv.last_msg?.content || ''}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={S.time}>{formatTime(conv.last_msg?.ts)}</div>
                  {unread > 0 && <div style={S.unread}>{unread > 99 ? '99+' : unread}</div>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
